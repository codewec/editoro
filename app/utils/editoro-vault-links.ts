import { getFileExtension, isImagePath, isMarkdownPath } from '~/utils/editoro-file'
import { getParentPath } from '~/utils/editoro-path'

const API_MEDIA_PREFIX = '/api/files/media?path='
const API_FILE_PREFIX = '/api/files/file?path='

type LinkTargetParts = {
  target: string
  suffix: string
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

function decodeQueryPath(url: string, key: string) {
  const queryIndex = url.indexOf('?')
  if (queryIndex < 0) {
    return ''
  }

  const query = new URLSearchParams(url.slice(queryIndex + 1))
  return query.get(key) || ''
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function splitTargetAndSuffix(raw: string): LinkTargetParts {
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

  const spaceIndex = trimmed.search(/\s/)
  if (spaceIndex < 0) {
    return { target: trimmed, suffix: '' }
  }

  return {
    target: trimmed.slice(0, spaceIndex),
    suffix: trimmed.slice(spaceIndex)
  }
}

function joinFromCurrentDirectory(currentFilePath: string, relativeTarget: string) {
  const currentDirectory = getParentPath(currentFilePath)
  const candidate = currentDirectory
    ? `${currentDirectory}/${relativeTarget}`
    : relativeTarget

  return normalizeVaultPath(candidate)
}

export function resolveVaultPath(target: string, currentFilePath: string) {
  const normalizedTarget = target.trim()
  if (!normalizedTarget || isExternalLink(normalizedTarget) || normalizedTarget.startsWith('#')) {
    return ''
  }

  if (normalizedTarget.startsWith(API_MEDIA_PREFIX) || normalizedTarget.startsWith(API_FILE_PREFIX)) {
    const value = decodeQueryPath(normalizedTarget, 'path')
    if (!value) {
      return ''
    }

    return normalizeVaultPath(safeDecode(value))
  }

  if (normalizedTarget.startsWith('/')) {
    return normalizeVaultPath(normalizedTarget.slice(1))
  }

  if (normalizedTarget.startsWith('./') || normalizedTarget.startsWith('../')) {
    return joinFromCurrentDirectory(currentFilePath, normalizedTarget)
  }

  return joinFromCurrentDirectory(currentFilePath, normalizedTarget)
}

export function toRelativeVaultLink(currentFilePath: string, targetVaultPath: string) {
  const currentDirectory = normalizeVaultPath(getParentPath(currentFilePath))
  const toSegments = normalizeVaultPath(targetVaultPath).split('/').filter(Boolean)
  const fromSegments = currentDirectory.split('/').filter(Boolean)

  let shared = 0
  while (
    shared < fromSegments.length
    && shared < toSegments.length
    && fromSegments[shared] === toSegments[shared]
  ) {
    shared += 1
  }

  const up = new Array(fromSegments.length - shared).fill('..')
  const down = toSegments.slice(shared)
  const relative = [...up, ...down].join('/')

  return relative ? (relative.startsWith('..') ? relative : `./${relative}`) : './'
}

export function toRuntimeLinkUrl(target: string, currentFilePath: string) {
  const vaultPath = resolveVaultPath(target, currentFilePath)
  if (!vaultPath) {
    return target
  }

  const extension = getFileExtension(vaultPath)
  const isMediaPath = vaultPath.includes('/.media/')
  const isFilesPath = vaultPath.includes('/.files/')

  if (!extension && !isMediaPath && !isFilesPath) {
    return `/${vaultPath}`
  }

  if (isMarkdownPath(vaultPath)) {
    return `/${vaultPath}`
  }

  if (isImagePath(vaultPath) || isMediaPath) {
    return `${API_MEDIA_PREFIX}${encodeURIComponent(vaultPath)}`
  }

  return `${API_FILE_PREFIX}${encodeURIComponent(vaultPath)}`
}

export function toRawVaultLink(target: string, currentFilePath: string) {
  const vaultPath = resolveVaultPath(target, currentFilePath)
  if (!vaultPath) {
    return target
  }

  const extension = getFileExtension(vaultPath)
  const isMediaPath = vaultPath.includes('/.media/')
  const isFilesPath = vaultPath.includes('/.files/')
  if (!extension && !isMediaPath && !isFilesPath) {
    return target
  }

  return toRelativeVaultLink(currentFilePath, vaultPath)
}

/**
 * Converts markdown link targets between raw vault links and runtime URLs.
 * This is required because rich mode renders links/images via browser URLs,
 * while raw mode must keep Obsidian-like vault links (`./`, `../`).
 */
export function transformMarkdownLinks(
  markdown: string,
  currentFilePath: string,
  mode: 'to-rich' | 'to-raw'
) {
  const pattern = /(!?\[[^\]]*]\()([^)]+)(\))/g

  return markdown.replace(pattern, (_match, prefix: string, rawTarget: string, suffix: string) => {
    const parts = splitTargetAndSuffix(rawTarget)
    if (!parts.target) {
      return `${prefix}${rawTarget}${suffix}`
    }

    const nextTarget = mode === 'to-rich'
      ? toRuntimeLinkUrl(parts.target, currentFilePath)
      : toRawVaultLink(parts.target, currentFilePath)

    const normalizedSuffix = parts.suffix || ''
    return `${prefix}${nextTarget}${normalizedSuffix}${suffix}`
  })
}

export function getVaultLinkIconName(target: string, currentFilePath: string) {
  if (isExternalLink(target)) {
    return 'external'
  }

  const vaultPath = resolveVaultPath(target, currentFilePath)
  if (!vaultPath) {
    return ''
  }

  const extension = getFileExtension(vaultPath)
  if (extension === 'md' || extension === 'markdown') {
    return 'internal-doc'
  }

  return 'internal-file'
}
