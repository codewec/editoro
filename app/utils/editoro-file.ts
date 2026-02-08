const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'bmp',
  'ico'
])

export function getFileExtension(path: string) {
  const fileName = path.split('/').pop() || ''
  const parts = fileName.split('.')
  if (parts.length < 2) {
    return ''
  }

  const extension = parts[parts.length - 1]
  return extension ? extension.toLowerCase() : ''
}

export function isMarkdownPath(path: string) {
  return getFileExtension(path) === 'md'
}

export function isImagePath(path: string) {
  return IMAGE_EXTENSIONS.has(getFileExtension(path))
}

export function buildImageUrl(path: string) {
  return `/api/files/media?path=${encodeURIComponent(path)}`
}
