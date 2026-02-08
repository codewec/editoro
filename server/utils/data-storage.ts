import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, posix, resolve, sep } from 'node:path'
import { createError } from 'h3'

export type FileStorageEntry = {
  label: string
  path: string
  type: 'file'
  icon: string
}

export type DirectoryStorageEntry = {
  label: string
  path: string
  type: 'directory'
  icon?: string
  defaultExpanded: boolean
  children: StorageEntry[]
}

export type StorageEntry = FileStorageEntry | DirectoryStorageEntry

const DATA_DIR = resolve(process.cwd(), 'data')
const IMAGE_CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon'
}

function isInsideDataDir(path: string) {
  return path === DATA_DIR || path.startsWith(`${DATA_DIR}${sep}`)
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error
}

export async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true })
}

export function normalizeRelativePath(input: string) {
  const cleaned = input.trim().replaceAll('\\', '/')

  if (cleaned.split('/').some(part => part === '..')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный путь'
    })
  }

  const normalized = posix.normalize(`/${cleaned}`).slice(1)

  if (!normalized || normalized === '.') {
    return ''
  }

  return normalized
}

export function resolveDataPath(relativePath: string) {
  const normalized = normalizeRelativePath(relativePath)
  const fullPath = resolve(DATA_DIR, normalized)

  if (!isInsideDataDir(fullPath)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Выход за пределы каталога data запрещен'
    })
  }

  return {
    normalized,
    fullPath
  }
}

function isHiddenEntry(name: string) {
  return name.startsWith('.')
}

function getDirectoryIcon(name: string, hasChildren: boolean) {
  if (isHiddenEntry(name)) {
    return 'i-lucide-folder-lock'
  }

  return hasChildren ? undefined : 'i-lucide-folder'
}

async function readDirRecursive(relativePath = '', includeHidden = false): Promise<StorageEntry[]> {
  const { fullPath } = resolveDataPath(relativePath)
  const entries = await readdir(fullPath, { withFileTypes: true })
  const result: StorageEntry[] = []

  for (const entry of entries) {
    if (!includeHidden && isHiddenEntry(entry.name)) {
      continue
    }

    const nextRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      const children = await readDirRecursive(nextRelativePath, includeHidden)
      const directoryIcon = getDirectoryIcon(entry.name, children.length > 0)
      const directoryEntry: DirectoryStorageEntry = {
        label: entry.name,
        path: nextRelativePath,
        type: 'directory',
        ...(directoryIcon ? { icon: directoryIcon } : {}),
        defaultExpanded: true,
        children
      }

      result.push(directoryEntry)
      continue
    }

    const fileEntry: FileStorageEntry = {
      label: entry.name,
      path: nextRelativePath,
      type: 'file',
      icon: getFileIconByExtension(entry.name)
    }

    result.push(fileEntry)
  }

  return result
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }

      return a.label.localeCompare(b.label, 'ru')
    })
}

function getFileIconByExtension(fileName: string) {
  const extension = fileName.toLowerCase().split('.').pop() || ''

  switch (extension) {
    case 'md':
    case 'markdown':
      return 'i-simple-icons-markdown'
    case 'json':
      return 'i-lucide-file-json-2'
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return 'i-lucide-file-code-2'
    case 'yml':
    case 'yaml':
    case 'toml':
      return 'i-lucide-file-cog'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'bmp':
    case 'ico':
      return 'i-lucide-image'
    default:
      return 'i-lucide-file'
  }
}

export async function getTree(includeHidden = false) {
  await ensureDataDir()
  return readDirRecursive('', includeHidden)
}

export async function getFileContent(relativePath: string) {
  const { fullPath } = resolveDataPath(relativePath)
  const metadata = await stat(fullPath)

  if (!metadata.isFile()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Нужен путь к файлу'
    })
  }

  return readFile(fullPath, 'utf8')
}

export async function saveFileContent(relativePath: string, content: string) {
  const { normalized, fullPath } = resolveDataPath(relativePath)

  if (!normalized.toLowerCase().endsWith('.md')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Сохранять можно только markdown файлы (*.md)'
    })
  }

  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, content, 'utf8')

  // Best-effort cleanup: remove media files that are no longer referenced in markdown.
  try {
    await cleanupOrphanMediaForMarkdown(normalized, content)
  } catch (error) {
    console.warn('Failed to cleanup orphan media:', error)
  }
}

export async function createDirectory(relativePath: string) {
  const { fullPath } = resolveDataPath(relativePath)
  await mkdir(fullPath, { recursive: true })
}

export async function createMarkdownFile(relativePath: string) {
  const { normalized } = resolveDataPath(relativePath)
  const filePath = normalized.toLowerCase().endsWith('.md') ? normalized : `${normalized}.md`
  const { fullPath } = resolveDataPath(filePath)
  await mkdir(dirname(fullPath), { recursive: true })

  try {
    await stat(fullPath)
    throw createError({
      statusCode: 409,
      statusMessage: 'Файл уже существует'
    })
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      await writeFile(fullPath, '', 'utf8')
      return filePath
    }

    throw error
  }
}

async function pathExists(relativePath: string) {
  const { fullPath } = resolveDataPath(relativePath)

  try {
    await stat(fullPath)
    return true
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return false
    }

    throw error
  }
}

export async function moveEntry(fromPath: string, toPath: string) {
  const { normalized: fromNormalized, fullPath: fromFullPath } = resolveDataPath(fromPath)
  let targetNormalized = normalizeRelativePath(toPath)

  if (!fromNormalized) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Нельзя перемещать корень'
    })
  }

  if (!targetNormalized) {
    targetNormalized = basename(fromNormalized)
  }

  const fromStats = await stat(fromFullPath)

  if (fromStats.isFile()) {
    const sourceExtension = posix.extname(fromNormalized).toLowerCase()
    const targetExtension = posix.extname(targetNormalized).toLowerCase()

    if (sourceExtension === '.md' && !targetExtension) {
      targetNormalized = `${targetNormalized}.md`
    }
  }

  if (fromStats.isDirectory() && targetNormalized.startsWith(`${fromNormalized}/`)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Нельзя переместить папку в саму себя'
    })
  }

  const { fullPath: toFullPath } = resolveDataPath(targetNormalized)

  if (fromNormalized === targetNormalized) {
    return fromNormalized
  }

  if (await pathExists(targetNormalized)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Путь назначения уже существует'
    })
  }

  await mkdir(dirname(toFullPath), { recursive: true })
  await rename(fromFullPath, toFullPath)

  return targetNormalized
}

export async function deleteEntry(relativePath: string) {
  const { normalized, fullPath } = resolveDataPath(relativePath)

  if (!normalized) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Нельзя удалить корневой каталог'
    })
  }

  await rm(fullPath, { recursive: true, force: false })
}

function sanitizeFileName(input: string) {
  const normalized = input
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')

  return normalized || 'image'
}

function getMediaDirectoryForFile(markdownPath: string) {
  const parent = posix.dirname(markdownPath)
  return parent === '.' ? '.media' : `${parent}/.media`
}

function isMediaFileReferencedInContent(markdownPath: string, mediaFilePath: string, content: string) {
  const markdownDir = posix.dirname(markdownPath)
  const relativePath = markdownDir === '.'
    ? mediaFilePath
    : posix.relative(markdownDir, mediaFilePath)

  const encodedPath = encodeURIComponent(mediaFilePath)
  const candidates = [
    `/api/files/media?path=${encodedPath}`,
    `/api/files/media?path=${mediaFilePath}`,
    mediaFilePath,
    `/${mediaFilePath}`,
    relativePath,
    `./${relativePath}`
  ]

  return candidates.some(candidate => content.includes(candidate))
}

async function listFilesRecursive(relativeDir: string) {
  const files: string[] = []
  const { fullPath } = resolveDataPath(relativeDir)
  const entries = await readdir(fullPath, { withFileTypes: true })

  for (const entry of entries) {
    const childPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      const nested = await listFilesRecursive(childPath)
      files.push(...nested)
    } else if (entry.isFile()) {
      files.push(childPath)
    }
  }

  return files
}

async function removeEmptyDirectoriesRecursive(relativeDir: string) {
  const { fullPath } = resolveDataPath(relativeDir)
  const entries = await readdir(fullPath, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const childPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
    await removeEmptyDirectoriesRecursive(childPath)
  }

  const remaining = await readdir(fullPath, { withFileTypes: true })
  if (remaining.length === 0) {
    await rm(fullPath, { recursive: true, force: true })
  }
}

async function cleanupOrphanMediaForMarkdown(markdownPath: string, content: string) {
  const mediaDir = getMediaDirectoryForFile(markdownPath)

  if (!(await pathExists(mediaDir))) {
    return
  }

  const existingFiles = await listFilesRecursive(mediaDir)

  for (const filePath of existingFiles) {
    if (!isMediaFileReferencedInContent(markdownPath, filePath, content)) {
      const { fullPath } = resolveDataPath(filePath)
      await rm(fullPath, { force: true })
    }
  }

  if (await pathExists(mediaDir)) {
    await removeEmptyDirectoriesRecursive(mediaDir)
  }
}

async function ensureUniquePath(relativePath: string) {
  if (!(await pathExists(relativePath))) {
    return relativePath
  }

  const ext = posix.extname(relativePath)
  const nameWithoutExt = relativePath.slice(0, ext ? -ext.length : undefined)
  let index = 1

  while (true) {
    const candidate = `${nameWithoutExt}-${index}${ext}`
    if (!(await pathExists(candidate))) {
      return candidate
    }

    index += 1
  }
}

export async function saveImageForMarkdownFile(
  markdownPath: string,
  sourceFileName: string,
  data: Uint8Array,
  contentType?: string
) {
  const { normalized, fullPath } = resolveDataPath(markdownPath)

  if (!normalized.toLowerCase().endsWith('.md')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Изображение можно загрузить только для markdown файла'
    })
  }

  const markdownStats = await stat(fullPath)
  if (!markdownStats.isFile()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Путь markdown файла не найден'
    })
  }

  const safeName = sanitizeFileName(sourceFileName)
  const originalExt = posix.extname(safeName).toLowerCase()
  const inferredExt = Object.entries(IMAGE_CONTENT_TYPES).find(([, type]) => type === contentType)?.[0]
  const extension = originalExt || inferredExt || '.png'

  if (!IMAGE_CONTENT_TYPES[extension]) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поддерживаются только изображения (png, jpg, gif, webp, svg, bmp, ico)'
    })
  }

  const baseName = safeName.replace(new RegExp(`${extension.replace('.', '\\.')}$`, 'i'), '') || 'image'
  const mediaDir = getMediaDirectoryForFile(normalized)
  const fileName = `${baseName}${extension}`
  const relativePath = await ensureUniquePath(`${mediaDir}/${fileName}`)
  const { fullPath: targetPath } = resolveDataPath(relativePath)

  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, data)

  return relativePath
}

export async function getMediaFile(relativePath: string) {
  const { normalized, fullPath } = resolveDataPath(relativePath)
  const extension = posix.extname(normalized).toLowerCase()

  const contentType = IMAGE_CONTENT_TYPES[extension]
  if (!contentType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Неподдерживаемый тип изображения'
    })
  }

  const metadata = await stat(fullPath)
  if (!metadata.isFile()) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Файл не найден'
    })
  }

  const data = await readFile(fullPath)
  return { data, contentType }
}
