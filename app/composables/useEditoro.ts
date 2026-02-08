import { nextTick } from 'vue'
import type {
  ColorModePreference,
  ContentResponse,
  CreateTargetType,
  DirectoryTreeNode,
  EditorViewMode,
  ImageUploadResponse,
  PathResponse,
  SaveState,
  SaveStatusColor,
  SelectOption,
  TreeNode,
  TreeResponse
} from '~/types/editoro'
import {
  buildPath,
  collectDirectoryPaths,
  findNodeByPath,
  getAncestorPaths,
  getBaseName,
  getParentPath
} from '~/utils/editoro-path'
import { formatRelativeDateTime } from '~/utils/editoro-time'
import { buildImageUrl, getFileExtension, isImagePath, isMarkdownPath } from '~/utils/editoro-file'

export async function useEditoro() {
  const toast = useToast()
  const route = useRoute()
  const router = useRouter()
  const { t, locale, setLocale } = useI18n()
  const colorMode = useColorMode()

  const treeItems = ref<TreeNode[]>([])
  const selectedNode = ref<TreeNode>()
  const expandedTreePaths = ref<string[]>([])

  const activeFilePath = ref('')
  const editorContent = ref('')
  const editorViewMode = ref<EditorViewMode>('rich')

  const isLoadingTree = ref(false)
  const isLoadingFile = ref(false)
  const treeInitialized = ref(false)

  const saveState = ref<SaveState>('idle')
  const lastSavedAt = ref<Date | null>(null)
  const suppressAutoSave = ref(false)
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  const minSidebarWidth = 240
  const maxSidebarWidth = 560
  const sidebarWidthCookie = useCookie<string>('editoro.sidebar.width', { path: '/', sameSite: 'lax' })
  const sidebarWidth = ref(parseSidebarWidth(sidebarWidthCookie.value, minSidebarWidth, maxSidebarWidth))
  const isResizingSidebar = ref(false)
  const sidebarResizeStartX = ref(0)
  const sidebarResizeStartWidth = ref(320)

  const createModalOpen = ref(false)
  const createTargetType = ref<CreateTargetType>('file')
  const createInputPath = ref('')
  const renameModalOpen = ref(false)
  const renameInputName = ref('')
  const deleteModalOpen = ref(false)

  const draggingPath = ref('')
  const dragOverTargetPath = ref('')
  const settingsModalOpen = ref(false)
  const showHiddenEntriesCookie = useCookie<string>('editoro.show-hidden', { path: '/', sameSite: 'lax' })
  const localeCookie = useCookie<string>('editoro.locale', { path: '/', sameSite: 'lax' })
  const colorModeCookie = useCookie<string>('editoro.color-mode', { path: '/', sameSite: 'lax' })
  const showHiddenEntries = ref(showHiddenEntriesCookie.value === '1')
  const settingsLocale = ref(locale.value)
  const settingsColorMode = ref<ColorModePreference>('system')

  const allowedColorModes: ColorModePreference[] = ['light', 'dark', 'system']

  if (localeCookie.value && localeCookie.value !== locale.value) {
    void setLocale(localeCookie.value)
  } else if (!localeCookie.value) {
    localeCookie.value = locale.value
  }

  const initialColorMode = colorModeCookie.value as ColorModePreference | undefined
  if (initialColorMode && allowedColorModes.includes(initialColorMode)) {
    colorMode.preference = initialColorMode
    settingsColorMode.value = initialColorMode
  } else {
    settingsColorMode.value = (colorMode.preference as ColorModePreference) || 'system'
    colorModeCookie.value = settingsColorMode.value
  }

  settingsLocale.value = locale.value

  const selectedFolder = computed<DirectoryTreeNode | undefined>(() => {
    return selectedNode.value?.type === 'directory' ? selectedNode.value : undefined
  })
  const browserItems = computed(() => selectedFolder.value ? (selectedFolder.value.children || []) : treeItems.value)
  const selectedFolderParentPath = computed(() => selectedFolder.value ? getParentPath(selectedFolder.value.path) : '')

  const canRenameOrDelete = computed(() => !!selectedNode.value?.path)
  const editorTitle = computed(() => {
    const node = selectedNode.value
    if (!node) {
      return t('main.root')
    }

    return node.type === 'file' ? node.label : node.path
  })
  const selectedPath = computed(() => selectedNode.value?.path || '')
  const selectedNodeType = computed(() => selectedNode.value?.type)
  const selectedIsImage = computed(() => {
    return selectedNode.value?.type === 'file' && isImagePath(selectedNode.value.path)
  })
  const selectedImageUrl = computed(() => {
    if (!selectedIsImage.value || !selectedNode.value || selectedNode.value.type !== 'file') {
      return ''
    }

    return buildImageUrl(selectedNode.value.path)
  })
  const selectedFileExtension = computed(() => {
    if (selectedNode.value?.type !== 'file') {
      return ''
    }

    return getFileExtension(selectedNode.value.path)
  })

  const createTitle = computed(() => createTargetType.value === 'file' ? t('titles.createFile') : t('titles.createFolder'))
  const createButtonLabel = computed(() => createTargetType.value === 'file' ? t('titles.createFile') : t('titles.createFolder'))
  const createInputLabel = computed(() => createTargetType.value === 'file' ? t('titles.createFileLabel') : t('titles.createFolderLabel'))
  const selectedBaseDirectory = computed(() => getSelectedBaseDirectory(selectedNode.value))
  const createPathPreview = computed(() => buildCreatePathPreview(createInputPath.value, selectedBaseDirectory.value, t))

  const renameTitle = computed(() => selectedNode.value?.type === 'directory' ? t('titles.renameFolder') : t('titles.renameFile'))
  const deleteTitle = computed(() => selectedNode.value?.type === 'directory' ? t('titles.deleteFolder') : t('titles.deleteFile'))
  const localeOptions = computed<SelectOption[]>(() => [
    { label: t('settings.ru'), value: 'ru' },
    { label: t('settings.en'), value: 'en' }
  ])
  const colorModeOptions = computed<SelectOption[]>(() => [
    { label: t('settings.system'), value: 'system' },
    { label: t('settings.light'), value: 'light' },
    { label: t('settings.dark'), value: 'dark' }
  ])

  const isSaving = computed(() => saveState.value === 'saving')
  const saveStatusColor = computed<SaveStatusColor>(() => {
    return saveState.value === 'error' ? 'error' : saveState.value === 'saving' ? 'neutral' : 'success'
  })
  const saveStatusIcon = computed(() => saveState.value === 'error' ? 'i-lucide-alert-triangle' : 'i-lucide-check')
  const saveStatusHint = computed(() => {
    if (saveState.value === 'saving') {
      return t('save.inProgress')
    }

    if (saveState.value === 'error') {
      return t('save.error')
    }

    if (lastSavedAt.value) {
      return t('save.lastSaved', { time: formatRelativeDateTime(lastSavedAt.value, new Date(), locale.value) })
    }

    return t('save.success')
  })

  const editorModeLabel = computed(() => editorViewMode.value === 'raw' ? t('editorMode.raw') : t('editorMode.rich'))
  const editorModeIcon = computed(() => editorViewMode.value === 'raw' ? 'i-lucide-file-text' : 'i-lucide-code-2')
  const editorModeTooltip = computed(() => editorViewMode.value === 'raw' ? t('editorMode.toRich') : t('editorMode.toRaw'))

  function notifyError(title: string, description?: string) {
    toast.add({ title, description, color: 'error' })
  }

  function toggleEditorMode() {
    editorViewMode.value = editorViewMode.value === 'raw' ? 'rich' : 'raw'
  }

  async function uploadImage(file: File) {
    if (!activeFilePath.value) {
      notifyError(t('errors.openMarkdownFirst'))
      return null
    }

    try {
      const formData = new FormData()
      formData.set('path', activeFilePath.value)
      formData.set('file', file)

      const result = await $fetch<ImageUploadResponse>('/api/files/image', {
        method: 'POST',
        body: formData
      })

      return result.url
    } catch (error) {
      console.error(error)
      notifyError(t('errors.uploadImage'))
      return null
    }
  }

  function openSettingsModal() {
    settingsLocale.value = locale.value
    settingsColorMode.value = (colorMode.preference as ColorModePreference) || 'system'
    settingsModalOpen.value = true
  }

  function closeSettingsModal() {
    settingsModalOpen.value = false
  }

  async function setLocalePreference(nextLocale: string) {
    settingsLocale.value = nextLocale
    await setLocale(nextLocale)
    localeCookie.value = nextLocale
  }

  function setColorModePreference(nextPreference: string) {
    const value = allowedColorModes.includes(nextPreference as ColorModePreference)
      ? (nextPreference as ColorModePreference)
      : 'system'

    settingsColorMode.value = value
    colorMode.preference = value
    colorModeCookie.value = value
  }

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

  function applyTreeData(items: TreeNode[], preferPath?: string) {
    treeItems.value = items
    treeInitialized.value = true

    const directories = collectDirectoryPaths(items)
    const previousExpanded = expandedTreePaths.value.filter(path => directories.has(path))
    const targetPath = preferPath || selectedNode.value?.path
    const nextSelection = targetPath ? findNodeByPath(items, targetPath) : undefined

    if (nextSelection) {
      selectedNode.value = nextSelection
      expandedTreePaths.value = Array.from(new Set([
        ...previousExpanded,
        ...getAncestorPaths(nextSelection.path),
        ...(nextSelection.type === 'directory' ? [nextSelection.path] : [])
      ]))

      if (nextSelection.type !== 'file') {
        activeFilePath.value = ''
        editorContent.value = ''
      }

      return
    }

    selectedNode.value = undefined
    expandedTreePaths.value = previousExpanded
    activeFilePath.value = ''
    editorContent.value = ''
  }

  async function loadTree(preferPath?: string) {
    isLoadingTree.value = true

    try {
      const data = await $fetch<TreeResponse>('/api/files/tree', {
        query: {
          hidden: showHiddenEntries.value ? '1' : '0'
        }
      })
      applyTreeData(data.items, preferPath)

      if (preferPath && (!selectedNode.value || selectedNode.value.type !== 'file')) {
        await syncRouteWithFile(undefined)
      }
    } catch (error) {
      console.error(error)
      notifyError(t('errors.loadTree'))
    } finally {
      isLoadingTree.value = false
    }
  }

  async function refreshTree() {
    await loadTree(selectedNode.value?.path)
  }

  async function toggleShowHiddenEntries() {
    showHiddenEntries.value = !showHiddenEntries.value
    await refreshTree()
  }

  async function loadFile(path: string) {
    isLoadingFile.value = true

    try {
      suppressAutoSave.value = true
      activeFilePath.value = path
      editorContent.value = ''

      const data = await $fetch<ContentResponse>('/api/files/content', { query: { path } })
      editorContent.value = data.content
      saveState.value = 'idle'
      lastSavedAt.value = null

      await nextTick()
      suppressAutoSave.value = false
    } catch (error) {
      console.error(error)
      notifyError(t('errors.openFile'), path)
    } finally {
      isLoadingFile.value = false
    }
  }

  async function saveFile(path: string, content: string) {
    saveState.value = 'saving'

    try {
      await $fetch('/api/files/content', { method: 'PUT', body: { path, content } })
      saveState.value = 'saved'
      lastSavedAt.value = new Date()
    } catch (error) {
      console.error(error)
      saveState.value = 'error'
      notifyError(t('errors.saveFile'), path)
    }
  }

  function scheduleSave(path: string, content: string) {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }

    saveState.value = 'pending'
    saveTimer = setTimeout(() => saveFile(path, content), 600)
  }

  async function createEntry(type: CreateTargetType) {
    const input = createInputPath.value.trim()

    if (!input) {
      notifyError(t('errors.specifyFileOrFolder'))
      return
    }

    const forceRoot = input.startsWith('/')
    const name = input.replace(/^\/+/, '')

    if (!name) {
      notifyError(t('errors.emptyName'))
      return
    }

    const nextPath = forceRoot ? name : buildPath(selectedBaseDirectory.value, name)

    try {
      const result = await $fetch<PathResponse>('/api/files/create', {
        method: 'POST',
        body: { type, path: nextPath }
      })

      await loadTree(result.path)

      if (type === 'file') {
        const fileNode = findNodeByPath(treeItems.value, result.path)
        if (fileNode) {
          selectedNode.value = fileNode
        }
      }

      createModalOpen.value = false
      createInputPath.value = ''
    } catch (error) {
      console.error(error)
      notifyError(t('errors.createEntry'))
    }
  }

  function openCreateModal(type: CreateTargetType) {
    createTargetType.value = type
    createInputPath.value = ''
    createModalOpen.value = true
  }

  function openRenameModal() {
    if (!selectedNode.value) {
      return
    }

    renameInputName.value = selectedNode.value.type === 'file'
      ? selectedNode.value.label.replace(/\.md$/i, '')
      : selectedNode.value.label

    renameModalOpen.value = true
  }

  async function renameSelectedEntry() {
    const node = selectedNode.value
    const rawName = renameInputName.value.trim()

    if (!node || !rawName) {
      notifyError(t('errors.specifyName'))
      return
    }

    let nextName = rawName

    if (node.type === 'file' && isMarkdownPath(node.path)) {
      const base = rawName.replace(/(\.md)+$/i, '')

      if (!base) {
        notifyError(t('errors.emptyFileName'))
        return
      }

      nextName = `${base}.md`
    } else if (node.type === 'file') {
      const hasExtension = rawName.includes('.') && !rawName.endsWith('.')
      if (!hasExtension) {
        const currentExt = getFileExtension(node.path)
        nextName = currentExt ? `${rawName}.${currentExt}` : rawName
      }
    }

    const targetPath = buildPath(getParentPath(node.path), nextName)

    try {
      const result = await $fetch<PathResponse>('/api/files/move', {
        method: 'POST',
        body: { from: node.path, to: targetPath }
      })

      await loadTree(result.path)
      renameModalOpen.value = false
      renameInputName.value = ''
    } catch (error) {
      console.error(error)
      notifyError(t('errors.rename'))
    }
  }

  async function deleteSelectedEntry() {
    const node = selectedNode.value

    if (!node) {
      return
    }

    try {
      await $fetch('/api/files/delete', { method: 'POST', body: { path: node.path } })
      deleteModalOpen.value = false
      await loadTree()
    } catch (error) {
      console.error(error)
      notifyError(t('errors.delete'))
    }
  }

  function selectNodeByPath(path: string) {
    const node = findNodeByPath(treeItems.value, path)

    if (!node) {
      return
    }

    selectedNode.value = node
    expandedTreePaths.value = Array.from(new Set([
      ...expandedTreePaths.value,
      ...getAncestorPaths(path),
      ...(node.type === 'directory' ? [node.path] : [])
    ]))
  }

  function goToFolderParent() {
    const folder = selectedFolder.value

    if (!folder) {
      return
    }

    const parentPath = getParentPath(folder.path)

    if (!parentPath) {
      selectedNode.value = undefined
      return
    }

    selectNodeByPath(parentPath)
  }

  function clampSidebarWidth(value: number) {
    return Math.min(maxSidebarWidth, Math.max(minSidebarWidth, value))
  }

  function onSidebarResizeMove(event: MouseEvent) {
    if (!isResizingSidebar.value) {
      return
    }

    const delta = event.clientX - sidebarResizeStartX.value
    sidebarWidth.value = clampSidebarWidth(sidebarResizeStartWidth.value + delta)
  }

  function stopSidebarResize() {
    if (!isResizingSidebar.value) {
      return
    }

    isResizingSidebar.value = false
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    window.removeEventListener('mousemove', onSidebarResizeMove)
    window.removeEventListener('mouseup', stopSidebarResize)
  }

  function onSidebarResizeStart(event: MouseEvent) {
    isResizingSidebar.value = true
    sidebarResizeStartX.value = event.clientX
    sidebarResizeStartWidth.value = sidebarWidth.value
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', onSidebarResizeMove)
    window.addEventListener('mouseup', stopSidebarResize)
  }

  function onTreeDragStart(item: TreeNode, event: DragEvent) {
    draggingPath.value = item.path
    dragOverTargetPath.value = ''

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', item.path)

      const preview = document.createElement('div')
      preview.className = 'editoro-drag-preview'
      preview.style.position = 'fixed'
      preview.style.top = '-9999px'
      preview.style.left = '-9999px'
      preview.style.padding = '8px 10px'
      preview.style.borderRadius = '8px'
      preview.style.border = '1px solid color-mix(in oklab, var(--ui-border-muted) 80%, transparent)'
      preview.style.background = 'var(--ui-bg-elevated)'
      preview.style.color = 'var(--ui-text)'
      preview.style.fontSize = '13px'
      preview.style.fontWeight = '500'
      preview.style.maxWidth = '280px'
      preview.style.whiteSpace = 'nowrap'
      preview.style.overflow = 'hidden'
      preview.style.textOverflow = 'ellipsis'
      preview.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)'
      preview.textContent = item.label

      document.body.appendChild(preview)
      event.dataTransfer.setDragImage(preview, 16, 16)
      requestAnimationFrame(() => preview.remove())
    }
  }

  function onTreeDragEnd() {
    draggingPath.value = ''
    dragOverTargetPath.value = ''
  }

  function getDropDirectoryPath(item: TreeNode) {
    return item.type === 'directory' ? item.path : getParentPath(item.path)
  }

  function canDropToDirectory(sourceNode: TreeNode, targetDirectoryPath: string) {
    if (sourceNode.type === 'directory') {
      if (targetDirectoryPath === sourceNode.path) {
        return false
      }

      if (targetDirectoryPath.startsWith(`${sourceNode.path}/`)) {
        return false
      }
    }

    return buildPath(targetDirectoryPath, getBaseName(sourceNode.path)) !== sourceNode.path
  }

  function onTreeDragOver(item: TreeNode, event: DragEvent) {
    if (!draggingPath.value || draggingPath.value === item.path) {
      return
    }

    const sourceNode = findNodeByPath(treeItems.value, draggingPath.value)

    if (!sourceNode) {
      return
    }

    const targetDirectoryPath = getDropDirectoryPath(item)

    if (!canDropToDirectory(sourceNode, targetDirectoryPath)) {
      return
    }

    event.preventDefault()

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    dragOverTargetPath.value = item.path
  }

  async function moveByDnD(targetDirectoryPath: string) {
    if (!draggingPath.value) {
      return
    }

    const sourceNode = findNodeByPath(treeItems.value, draggingPath.value)

    if (!sourceNode) {
      return
    }

    if (!canDropToDirectory(sourceNode, targetDirectoryPath)) {
      return
    }

    const targetPath = buildPath(targetDirectoryPath, getBaseName(sourceNode.path))

    try {
      const result = await $fetch<PathResponse>('/api/files/move', {
        method: 'POST',
        body: { from: sourceNode.path, to: targetPath }
      })

      await loadTree(result.path)
    } catch (error) {
      console.error(error)
      notifyError(t('errors.move'))
    } finally {
      onTreeDragEnd()
    }
  }

  async function onTreeDrop(item: TreeNode, event: DragEvent) {
    event.preventDefault()
    await moveByDnD(getDropDirectoryPath(item))
  }

  async function onRootDrop(event: DragEvent) {
    event.preventDefault()
    await moveByDnD('')
  }

  watch(selectedNode, async (node) => {
    if (!node) {
      activeFilePath.value = ''
      editorContent.value = ''
      await syncRouteWithFile(undefined)
      return
    }

    if (node.type !== 'file') {
      activeFilePath.value = ''
      editorContent.value = ''
      await syncRouteWithFile(undefined)
      return
    }

    await syncRouteWithFile(node.path)

    if (isImagePath(node.path)) {
      activeFilePath.value = ''
      editorContent.value = ''
      return
    }

    if (!isMarkdownPath(node.path)) {
      activeFilePath.value = ''
      editorContent.value = ''
      return
    }

    await loadFile(node.path)
  })

  watch(editorContent, (value) => {
    if (suppressAutoSave.value || !activeFilePath.value) {
      return
    }

    scheduleSave(activeFilePath.value, value)
  })

  watch(sidebarWidth, (value) => {
    sidebarWidthCookie.value = String(clampSidebarWidth(value))
  })

  watch(showHiddenEntries, (value) => {
    showHiddenEntriesCookie.value = value ? '1' : '0'
  })

  watch(locale, (value) => {
    settingsLocale.value = value
    localeCookie.value = value
  })

  onMounted(async () => {
    const filePath = getFileQueryValue()

    if (!treeInitialized.value) {
      await loadTree(filePath || undefined)
      return
    }

    if (filePath && (!selectedNode.value || selectedNode.value.type !== 'file')) {
      await syncRouteWithFile(undefined)
    }
  })

  onBeforeUnmount(() => {
    stopSidebarResize()

    if (saveTimer) {
      clearTimeout(saveTimer)
    }
  })

  const initialFilePath = getFileQueryValue()
  const { data: initialTreeData } = await useAsyncData(
    'editoro-tree-initial',
    () => $fetch<TreeResponse>('/api/files/tree', { query: { hidden: showHiddenEntries.value ? '1' : '0' } }),
    { watch: [showHiddenEntries] }
  )

  if (initialTreeData.value?.items) {
    applyTreeData(initialTreeData.value.items, initialFilePath || undefined)
  }

  return {
    treeItems,
    selectedNode,
    expandedTreePaths,
    activeFilePath,
    editorContent,
    editorViewMode,
    isLoadingTree,
    isLoadingFile,
    minSidebarWidth,
    maxSidebarWidth,
    sidebarWidth,
    createModalOpen,
    createTargetType,
    createInputPath,
    renameModalOpen,
    renameInputName,
    deleteModalOpen,
    draggingPath,
    dragOverTargetPath,
    settingsModalOpen,
    settingsLocale,
    settingsColorMode,
    localeOptions,
    colorModeOptions,
    showHiddenEntries,
    selectedFolder,
    browserItems,
    selectedFolderParentPath,
    selectedNodeType,
    selectedIsImage,
    selectedImageUrl,
    selectedFileExtension,
    canRenameOrDelete,
    editorTitle,
    selectedPath,
    createTitle,
    createButtonLabel,
    createInputLabel,
    createPathPreview,
    renameTitle,
    deleteTitle,
    isSaving,
    saveStatusColor,
    saveStatusIcon,
    saveStatusHint,
    editorModeLabel,
    editorModeIcon,
    editorModeTooltip,
    uploadImage,
    toggleEditorMode,
    openCreateModal,
    createEntry,
    openRenameModal,
    renameSelectedEntry,
    deleteSelectedEntry,
    refreshTree,
    toggleShowHiddenEntries,
    openSettingsModal,
    closeSettingsModal,
    setLocalePreference,
    setColorModePreference,
    selectNodeByPath,
    goToFolderParent,
    onSidebarResizeStart,
    onTreeDragStart,
    onTreeDragEnd,
    onTreeDragOver,
    onTreeDrop,
    onRootDrop
  }
}

function getSelectedBaseDirectory(node?: TreeNode) {
  if (!node) {
    return ''
  }

  if (node.type === 'directory') {
    return node.path
  }

  return getParentPath(node.path)
}

function buildCreatePathPreview(input: string, baseDir: string, t: (key: string) => string) {
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

function parseSidebarWidth(raw: string | undefined, minWidth: number, maxWidth: number) {
  const parsed = Number(raw)

  if (!Number.isFinite(parsed)) {
    return 320
  }

  return Math.min(maxWidth, Math.max(minWidth, parsed))
}
