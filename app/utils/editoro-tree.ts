import type { TreeNode } from '~/types/editoro'

/**
 * Returns a display icon for a tree node based on its type and expansion state.
 * Used by `app/components/editoro/Sidebar.vue`.
 */
export function getTreeNodeIcon(item: TreeNode, expanded: boolean) {
  if (item.icon) {
    return item.icon
  }

  if (item.type === 'directory') {
    return expanded ? 'i-lucide-folder-open' : 'i-lucide-folder'
  }

  return 'i-lucide-file'
}
