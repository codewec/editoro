import type { TreeNode } from '~/types/editoro'

export function getParentPath(path: string) {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

export function getBaseName(path: string) {
  const parts = path.split('/')
  return parts[parts.length - 1] || ''
}

export function buildPath(parentPath: string, name: string) {
  return parentPath ? `${parentPath}/${name}` : name
}

export function getAncestorPaths(path: string) {
  const parts = path.split('/').filter(Boolean)
  return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'))
}

export function findNodeByPath(items: TreeNode[], path: string): TreeNode | undefined {
  for (const item of items) {
    if (item.path === path) {
      return item
    }

    if (item.type === 'directory' && item.children.length) {
      const found = findNodeByPath(item.children, path)
      if (found) {
        return found
      }
    }
  }

  return undefined
}

export function collectDirectoryPaths(items: TreeNode[]) {
  const directories = new Set<string>()

  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type !== 'directory') {
        continue
      }

      directories.add(node.path)
      if (node.children.length) {
        walk(node.children)
      }
    }
  }

  walk(items)
  return directories
}

export function collectFilePaths(items: TreeNode[]) {
  const files = new Set<string>()

  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'file') {
        files.add(node.path)
        continue
      }

      if (node.children.length) {
        walk(node.children)
      }
    }
  }

  walk(items)
  return files
}
