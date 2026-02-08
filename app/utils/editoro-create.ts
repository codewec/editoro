import type { TreeNode } from '~/types/editoro'
import { buildPath, getParentPath } from '~/utils/editoro-path'

export function getSelectedBaseDirectory(node?: TreeNode) {
  if (!node) {
    return ''
  }

  if (node.type === 'directory') {
    return node.path
  }

  return getParentPath(node.path)
}

export function buildCreatePathPreview(input: string, baseDir: string, t: (key: string) => string) {
  const trimmed = input.trim()

  if (!trimmed) {
    return t('errors.specifyName')
  }

  const forceRoot = trimmed.startsWith('/')
  const normalizedInput = trimmed.replace(/^\/+/, '')

  if (!normalizedInput) {
    return t('errors.specifyName')
  }

  return forceRoot ? normalizedInput : buildPath(baseDir, normalizedInput)
}

export function normalizeCreatePathInput(input: string) {
  const trimmed = input.trim()
  const forceRoot = trimmed.startsWith('/')
  const name = trimmed.replace(/^\/+/, '')

  return { trimmed, forceRoot, name }
}
