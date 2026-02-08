/**
 * Synchronizes selected tree node with route query and editor content loading.
 * Used by `app/composables/useEditoroContext.ts`.
 */
import type { Ref } from 'vue'
import type { TreeNode } from '~/types/editoro'
import { isImagePath, isMarkdownPath } from '~/utils/editoro-file'

type EditorStoreLike = {
  clearEditor: () => void
  loadFile: (path: string) => Promise<void>
}

type FileSelectionOptions = {
  selectedNode: Ref<TreeNode | undefined>
  activeFilePath: Ref<string>
  treeInitialized: Ref<boolean>
  editorStore: EditorStoreLike
  loadTree: (preferPath?: string) => Promise<void>
}

export function useEditoroFileSelection(options: FileSelectionOptions) {
  const route = useRoute()
  const router = useRouter()

  function getFileQueryValue() {
    const raw = route.query.file
    if (typeof raw === 'string') {
      return raw
    }

    if (Array.isArray(raw)) {
      return raw[0] || ''
    }

    return ''
  }

  async function syncRouteWithFile(filePath?: string) {
    const current = getFileQueryValue()
    const next = filePath || ''

    if (current === next) {
      return
    }

    const query = { ...route.query }

    if (next) {
      query.file = next
    } else {
      delete query.file
    }

    await router.replace({ query })
  }

  async function handleSelectedNodeChange(node?: TreeNode) {
    if (!node || node.type !== 'file') {
      options.editorStore.clearEditor()
      await syncRouteWithFile(undefined)
      return
    }

    await syncRouteWithFile(node.path)

    if (isImagePath(node.path) || !isMarkdownPath(node.path)) {
      options.editorStore.clearEditor()
      return
    }

    await options.editorStore.loadFile(node.path)
  }

  async function initializeFromRouteOnMounted() {
    const filePath = getFileQueryValue()

    async function ensureRouteFileSelected(path: string) {
      const selected = options.selectedNode.value
      if (selected?.type === 'file' && selected.path === path) {
        return true
      }

      await options.loadTree(path)

      const nextSelected = options.selectedNode.value
      return nextSelected?.type === 'file' && nextSelected.path === path
    }

    if (!options.treeInitialized.value) {
      await options.loadTree(filePath || undefined)

      if (filePath && !(await ensureRouteFileSelected(filePath))) {
        await syncRouteWithFile(undefined)
      }

      return
    }

    if (filePath) {
      const isOpened = await ensureRouteFileSelected(filePath)
      if (!isOpened) {
        await syncRouteWithFile(undefined)
        options.editorStore.clearEditor()
        return
      }
    }

    // Hydration case: selected node can already be restored from SSR state,
    // so selectedNode watcher won't fire on client mount.
    const node = options.selectedNode.value
    if (!node || node.type !== 'file') {
      options.editorStore.clearEditor()
      return
    }

    if (isImagePath(node.path) || !isMarkdownPath(node.path)) {
      options.editorStore.clearEditor()
      return
    }

    if (options.activeFilePath.value !== node.path) {
      await options.editorStore.loadFile(node.path)
    }
  }

  return {
    getFileQueryValue,
    syncRouteWithFile,
    handleSelectedNodeChange,
    initializeFromRouteOnMounted
  }
}
