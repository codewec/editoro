/**
 * Registers watcher and mount/unmount hooks for editor workspace lifecycle.
 * Used by `app/composables/useEditoroState.ts`.
 */
import type { Ref } from 'vue'
import type { TreeNode } from '~/types/editoro'
import { fetchTree } from '~/services/files-api'
import { collectFilePaths } from '~/utils/editoro-path'

type FileSelectionLike = {
  getFileQueryValue: () => string
  handleSelectedNodeChange: (node?: TreeNode) => Promise<void>
  initializeFromRouteOnMounted: () => Promise<void>
}

type TreeStoreLike = {
  applyTreeData: (items: TreeNode[], preferPath?: string) => void
}

type EditorStoreLike = {
  clearPendingSave: () => void
  reconcilePinnedFiles: (existingFilePaths: Set<string>) => void
}

type UiStoreLike = {
  stopSidebarResize: () => void
}

type LifecycleOptions = {
  selectedNode: Ref<TreeNode | undefined>
  treeItems: Ref<TreeNode[]>
  treeInitialized: Ref<boolean>
  showHiddenEntries: Ref<boolean>
  fileSelection: FileSelectionLike
  treeStore: TreeStoreLike
  editorStore: EditorStoreLike
  uiStore: UiStoreLike
}

export async function useEditoroLifecycle(options: LifecycleOptions) {
  watch([options.treeItems, options.treeInitialized], ([items, initialized]) => {
    if (!initialized) {
      return
    }

    options.editorStore.reconcilePinnedFiles(collectFilePaths(items))
  }, { immediate: true })

  watch(options.selectedNode, async (node) => {
    await options.fileSelection.handleSelectedNodeChange(node)
  })

  onBeforeUnmount(() => {
    options.uiStore.stopSidebarResize()
    options.editorStore.clearPendingSave()
  })

  onMounted(async () => {
    await options.fileSelection.initializeFromRouteOnMounted()
  })

  const initialFilePath = options.fileSelection.getFileQueryValue()
  const { data: initialTreeData } = await useAsyncData(
    'editoro-tree-initial',
    () => fetchTree(options.showHiddenEntries.value)
  )

  if (initialTreeData.value?.items) {
    options.treeStore.applyTreeData(initialTreeData.value.items, initialFilePath || undefined)
  }
}
