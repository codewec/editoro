import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, posix } from 'node:path'
import { createError } from 'h3'
import { moveEntry, resolveDataPath } from './data-storage'

type ProgressReporter = (progress: number, stage: string) => void

type LinkParts = {
  target: string
  suffix: string
}

const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown'])
const FILE_LINK_PATTERN_SOURCE = /(!?\[[^\]]*]\()([^)]+)(\))/g

function createFileLinkPattern() {
  return new RegExp(FILE_LINK_PATTERN_SOURCE.source, 'g')
}

function splitTargetAndSuffix(raw: string): LinkParts {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { target: '', suffix: '' }
  }

  if (trimmed.startsWith('<')) {
    const closeIndex = trimmed.indexOf('>')
    if (closeIndex > 0) {
      return {
        target: trimmed.slice(1, closeIndex).trim(),
        suffix: trimmed.slice(closeIndex + 1)
      }
    }
  }

  const whitespaceIndex = trimmed.search(/\s/)
  if (whitespaceIndex < 0) {
    return { target: trimmed, suffix: '' }
  }

  return {
    target: trimmed.slice(0, whitespaceIndex),
    suffix: trimmed.slice(whitespaceIndex)
  }
}

function normalizeVaultPath(path: string) {
  const segments = path.split('/')
  const resolved: string[] = []

  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue
    }

    if (segment === '..') {
      resolved.pop()
      continue
    }

    resolved.push(segment)
  }

  return resolved.join('/')
}

function isExternalLink(target: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')
}

function toRelativeFromFile(filePath: string, targetPath: string) {
  const fromDir = posix.dirname(filePath)
  const relative = fromDir === '.'
    ? targetPath
    : posix.relative(fromDir, targetPath)

  if (!relative || relative === '.') {
    return './'
  }

  return relative.startsWith('..') ? relative : `./${relative}`
}

function resolveRelativeTarget(target: string, baseFilePath: string) {
  const normalizedTarget = target.trim()
  if (!normalizedTarget) {
    return ''
  }

  if (isExternalLink(normalizedTarget) || normalizedTarget.startsWith('#')) {
    return ''
  }

  if (normalizedTarget.startsWith('/')) {
    return normalizeVaultPath(normalizedTarget.slice(1))
  }

  const baseDir = posix.dirname(baseFilePath)
  const candidate = baseDir === '.'
    ? normalizedTarget
    : `${baseDir}/${normalizedTarget}`

  return normalizeVaultPath(candidate)
}

async function listMarkdownFiles(relativeDir = ''): Promise<string[]> {
  const { fullPath } = resolveDataPath(relativeDir)
  const entries = await readdir(fullPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const childPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(childPath))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const extension = posix.extname(entry.name).toLowerCase()
    if (MARKDOWN_EXTENSIONS.has(extension)) {
      files.push(childPath)
    }
  }

  return files
}

function markdownReferencesPath(content: string, markdownFilePath: string, targetPath: string) {
  const normalizedTarget = normalizeVaultPath(targetPath)
  if (!normalizedTarget) {
    return false
  }

  const pattern = createFileLinkPattern()
  let match: RegExpExecArray | null
  while ((match = pattern.exec(content)) !== null) {
    const target = match[2] || ''
    const parts = splitTargetAndSuffix(target)
    if (!parts.target) {
      continue
    }

    const resolved = resolveRelativeTarget(parts.target, markdownFilePath)
    if (resolved === normalizedTarget) {
      return true
    }
  }

  return false
}

async function countMarkdownReferences(targetPath: string) {
  const markdownFiles = await listMarkdownFiles('')
  let count = 0

  for (const markdownFilePath of markdownFiles) {
    const { fullPath } = resolveDataPath(markdownFilePath)
    const content = await readFile(fullPath, 'utf8')
    if (markdownReferencesPath(content, markdownFilePath, targetPath)) {
      count += 1
    }
  }

  return count
}

async function pathExists(relativePath: string) {
  const { fullPath } = resolveDataPath(relativePath)

  try {
    await stat(fullPath)
    return true
  } catch {
    return false
  }
}

async function ensureUniquePath(relativePath: string) {
  if (!(await pathExists(relativePath))) {
    return relativePath
  }

  const extension = posix.extname(relativePath)
  const stem = extension ? relativePath.slice(0, -extension.length) : relativePath
  let suffix = 1

  while (true) {
    const next = `${stem}-${suffix}${extension}`
    if (!(await pathExists(next))) {
      return next
    }

    suffix += 1
  }
}

function collectLocalAttachmentTargets(content: string, markdownPathBeforeMove: string) {
  const beforeDir = posix.dirname(markdownPathBeforeMove)
  const mediaPrefix = beforeDir === '.'
    ? '.media/'
    : `${beforeDir}/.media/`
  const filesPrefix = beforeDir === '.'
    ? '.files/'
    : `${beforeDir}/.files/`

  const targets = new Set<string>()
  const pattern = createFileLinkPattern()
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    const target = match[2] || ''
    const parts = splitTargetAndSuffix(target)
    if (!parts.target) {
      continue
    }

    const resolved = resolveRelativeTarget(parts.target, markdownPathBeforeMove)
    if (!resolved) {
      continue
    }

    if (resolved.startsWith(mediaPrefix) || resolved.startsWith(filesPrefix)) {
      targets.add(resolved)
    }
  }

  return Array.from(targets)
}

function rewriteMarkdownLinks(
  content: string,
  markdownPathBeforeMove: string,
  markdownPathAfterMove: string,
  movedAttachments: Map<string, string>
) {
  const pattern = createFileLinkPattern()

  return content.replace(pattern, (full, prefix: string, rawTarget: string, suffix: string) => {
    const parts = splitTargetAndSuffix(rawTarget)
    if (!parts.target) {
      return full
    }

    if (isExternalLink(parts.target) || parts.target.startsWith('#')) {
      return `${prefix}${rawTarget}${suffix}`
    }

    const resolvedBefore = resolveRelativeTarget(parts.target, markdownPathBeforeMove)
    if (!resolvedBefore) {
      return `${prefix}${rawTarget}${suffix}`
    }

    const nextAbsolute = movedAttachments.get(resolvedBefore) || resolvedBefore
    const nextTarget = toRelativeFromFile(markdownPathAfterMove, nextAbsolute)
    const normalizedSuffix = parts.suffix || ''

    return `${prefix}${nextTarget}${normalizedSuffix}${suffix}`
  })
}

async function moveUniqueAttachment(sourcePath: string, destinationDirectory: string) {
  const targetPath = await ensureUniquePath(`${destinationDirectory}/${basename(sourcePath)}`)
  const { fullPath: sourceFullPath } = resolveDataPath(sourcePath)
  const { fullPath: targetFullPath } = resolveDataPath(targetPath)

  await mkdir(dirname(targetFullPath), { recursive: true })
  await rename(sourceFullPath, targetFullPath)
  return targetPath
}

export type MoveMarkdownResult = {
  path: string
  sharedAttachmentCount: number
}

/**
 * Moves entry and keeps markdown links valid after relocation.
 * For markdown files, local attachments are moved only when they are unique
 * (not referenced by other markdown files). Shared attachments stay in place.
 */
export async function moveEntryWithMarkdownRewrite(
  fromPath: string,
  toPath: string,
  reportProgress?: ProgressReporter
): Promise<MoveMarkdownResult> {
  const { normalized: fromNormalized, fullPath: fromFullPath } = resolveDataPath(fromPath)
  const sourceStats = await stat(fromFullPath)
  const isMarkdownFile = sourceStats.isFile() && MARKDOWN_EXTENSIONS.has(posix.extname(fromNormalized).toLowerCase())

  let originalContent = ''
  let localAttachments: string[] = []
  const attachmentReferences = new Map<string, number>()

  if (isMarkdownFile) {
    reportProgress?.(10, 'Reading markdown content')
    originalContent = await readFile(fromFullPath, 'utf8')

    reportProgress?.(25, 'Scanning local attachments')
    localAttachments = collectLocalAttachmentTargets(originalContent, fromNormalized)

    for (let index = 0; index < localAttachments.length; index += 1) {
      const attachmentPath = localAttachments[index]
      if (!attachmentPath) {
        continue
      }

      const progress = 25 + Math.round(((index + 1) / Math.max(localAttachments.length, 1)) * 25)
      reportProgress?.(progress, `Analyzing attachment ${index + 1}/${localAttachments.length}`)

      if (!(await pathExists(attachmentPath))) {
        continue
      }

      const references = await countMarkdownReferences(attachmentPath)
      attachmentReferences.set(attachmentPath, references)
    }
  }

  reportProgress?.(55, 'Moving entry')
  const movedPath = await moveEntry(fromPath, toPath)

  if (!isMarkdownFile) {
    reportProgress?.(100, 'Done')
    return {
      path: movedPath,
      sharedAttachmentCount: 0
    }
  }

  const { fullPath: movedFullPath } = resolveDataPath(movedPath)
  const movedAttachments = new Map<string, string>()
  let sharedAttachmentCount = 0

  for (let index = 0; index < localAttachments.length; index += 1) {
    const attachmentPath = localAttachments[index]
    if (!attachmentPath) {
      continue
    }

    const progress = 60 + Math.round(((index + 1) / Math.max(localAttachments.length, 1)) * 25)
    reportProgress?.(progress, `Relocating attachment ${index + 1}/${localAttachments.length}`)

    const references = attachmentReferences.get(attachmentPath)
    if (!references) {
      continue
    }

    if (references <= 1) {
      const targetDirectory = attachmentPath.includes('/.media/')
        ? (posix.dirname(movedPath) === '.' ? '.media' : `${posix.dirname(movedPath)}/.media`)
        : (posix.dirname(movedPath) === '.' ? '.files' : `${posix.dirname(movedPath)}/.files`)

      if (targetDirectory === posix.dirname(attachmentPath)) {
        continue
      }

      const movedAttachment = await moveUniqueAttachment(attachmentPath, targetDirectory)
      movedAttachments.set(attachmentPath, movedAttachment)
      continue
    }

    sharedAttachmentCount += 1
  }

  reportProgress?.(90, 'Rewriting markdown links')
  const rewritten = rewriteMarkdownLinks(originalContent, fromNormalized, movedPath, movedAttachments)
  await writeFile(movedFullPath, rewritten, 'utf8')

  reportProgress?.(100, 'Done')
  return {
    path: movedPath,
    sharedAttachmentCount
  }
}

export function assertMoveSource(fromPath: string) {
  const normalized = fromPath.trim()
  if (!normalized) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поле from обязательно'
    })
  }
}
