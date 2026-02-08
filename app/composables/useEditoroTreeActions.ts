import type { Ref } from 'vue'
import type { TreeNode } from '~/types/editoro'

type EditoroTreeActionsOptions = {
  selectedNode: Ref<TreeNode | undefined>
  loadTree: (preferPath?: string) => Promise<void>
  toggleShowHiddenEntriesRaw: () => void
}

/**
 * Provides high-level tree actions used across context/state layers.
 * Used by `app/composables/useEditoroContext.ts`.
 */
export function useEditoroTreeActions(options: EditoroTreeActionsOptions) {
  async function refreshTree() {
    await options.loadTree(options.selectedNode.value?.path)
  }

  async function toggleShowHiddenEntries() {
    options.toggleShowHiddenEntriesRaw()
    await refreshTree()
  }

  return {
    refreshTree,
    toggleShowHiddenEntries
  }
}
