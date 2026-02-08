/**
 * Synchronizes selected tree node with route query and editor content loading.
 * Used by `app/composables/useEditoroContext.ts`.
 */
import type { Ref } from 'vue'
import type { TreeNode } from '~/types/editoro'
import { isImagePath, isMarkdownPath } from '~/utils/editoro-file'
import { hasHiddenPathSegment } from '~/utils/editoro-path'

type EditorStoreLike = {
  clearEditor: () => void
  loadFile: (path: string) => Promise<void>
}

type FileSelectionOptions = {
  selectedNode: Ref<TreeNode | undefined>
  activeFilePath: Ref<string>
  pinnedFilePaths: Ref<string[]>
  showHiddenEntries: Ref<boolean>
  setShowHiddenEntries: (nextValue: boolean) => void
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

  function getPinnedFallbackPath() {
    return options.pinnedFilePaths.value[0] || ''
  }

  function getInitialPreferredPath() {
    return getFileQueryValue() || getPinnedFallbackPath()
  }

  async function openPath(path: string) {
    if (!path) {
      return false
    }

    if (hasHiddenPathSegment(path) && !options.showHiddenEntries.value) {
      options.setShowHiddenEntries(true)
    }

    await options.loadTree(path)
    return options.selectedNode.value?.path === path
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
    const preferredPath = getInitialPreferredPath()

    async function ensurePathSelected(path: string) {
      const selected = options.selectedNode.value
      if (selected?.path === path) {
        return true
      }

      return await openPath(path)
    }

    if (!options.treeInitialized.value) {
      await options.loadTree(preferredPath || undefined)

      if (filePath && !(await ensurePathSelected(filePath))) {
        await syncRouteWithFile(undefined)
      }

      return
    }

    if (filePath) {
      const isOpened = await ensurePathSelected(filePath)
      if (!isOpened) {
        await syncRouteWithFile(undefined)
        options.editorStore.clearEditor()
        return
      }
    } else if (preferredPath) {
      await ensurePathSelected(preferredPath)
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
    getInitialPreferredPath,
    openPath,
    syncRouteWithFile,
    handleSelectedNodeChange,
    initializeFromRouteOnMounted
  }
}
