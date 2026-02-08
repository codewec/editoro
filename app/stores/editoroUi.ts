/**
 * Store for UI-only state: sidebar resizing and modal visibility/inputs.
 * Used by `app/composables/useEditoroStores.ts`.
 */
import type { CreateTargetType } from '~/types/editoro'

const MIN_SIDEBAR_WIDTH = 240
const MAX_SIDEBAR_WIDTH = 560

function clampSidebarWidth(value: number) {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, value))
}

function parseSidebarWidth(raw: string | undefined) {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    return 320
  }

  return clampSidebarWidth(parsed)
}

function parseCollapsedState(raw: unknown) {
  if (!raw) {
    return false
  }

  if (typeof raw === 'boolean') {
    return raw
  }

  if (typeof raw === 'number') {
    return raw === 1
  }

  if (typeof raw !== 'string') {
    return false
  }

  const normalized = raw.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

export const useEditoroUiStore = defineStore('editoro-ui', () => {
  const sidebarWidthCookie = useCookie<string>('editoro.sidebar.width', { path: '/', sameSite: 'lax' })
  const sidebarCollapsedCookie = useCookie<string>('editoro.sidebar.collapsed', { path: '/', sameSite: 'lax' })

  const sidebarWidth = ref(parseSidebarWidth(sidebarWidthCookie.value))
  const isSidebarCollapsed = ref(parseCollapsedState(sidebarCollapsedCookie.value))
  const isResizingSidebar = ref(false)
  const sidebarResizeStartX = ref(0)
  const sidebarResizeStartWidth = ref(sidebarWidth.value)

  const createModalOpen = ref(false)
  const createTargetType = ref<CreateTargetType>('file')
  const createInputPath = ref('')

  const renameModalOpen = ref(false)
  const renameInputName = ref('')

  const deleteModalOpen = ref(false)

  function onSidebarResizeMove(event: MouseEvent) {
    if (!isResizingSidebar.value) {
      return
    }

    const delta = event.clientX - sidebarResizeStartX.value
    sidebarWidth.value = clampSidebarWidth(sidebarResizeStartWidth.value + delta)
  }

  function stopSidebarResize() {
    if (!isResizingSidebar.value || !import.meta.client) {
      return
    }

    isResizingSidebar.value = false
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    window.removeEventListener('mousemove', onSidebarResizeMove)
    window.removeEventListener('mouseup', stopSidebarResize)
  }

  function onSidebarResizeStart(event: MouseEvent) {
    if (!import.meta.client || isSidebarCollapsed.value) {
      return
    }

    isResizingSidebar.value = true
    sidebarResizeStartX.value = event.clientX
    sidebarResizeStartWidth.value = sidebarWidth.value
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', onSidebarResizeMove)
    window.addEventListener('mouseup', stopSidebarResize)
  }

  function collapseSidebar() {
    stopSidebarResize()
    isSidebarCollapsed.value = true
  }

  function expandSidebar() {
    isSidebarCollapsed.value = false
  }

  function toggleSidebarCollapsed() {
    if (isSidebarCollapsed.value) {
      expandSidebar()
      return
    }

    collapseSidebar()
  }

  function openCreateModal(type: CreateTargetType) {
    createTargetType.value = type
    createInputPath.value = ''
    createModalOpen.value = true
  }

  function closeCreateModal() {
    createModalOpen.value = false
  }

  function openRenameModal(initialValue: string) {
    renameInputName.value = initialValue
    renameModalOpen.value = true
  }

  function closeRenameModal() {
    renameModalOpen.value = false
  }

  function openDeleteModal() {
    deleteModalOpen.value = true
  }

  function closeDeleteModal() {
    deleteModalOpen.value = false
  }

  watch(sidebarWidth, (value) => {
    sidebarWidthCookie.value = String(clampSidebarWidth(value))
  })

  watch(isSidebarCollapsed, (value) => {
    sidebarCollapsedCookie.value = value ? '1' : '0'
  }, { immediate: true })

  return {
    minSidebarWidth: MIN_SIDEBAR_WIDTH,
    maxSidebarWidth: MAX_SIDEBAR_WIDTH,
    sidebarWidth,
    isSidebarCollapsed,
    createModalOpen,
    createTargetType,
    createInputPath,
    renameModalOpen,
    renameInputName,
    deleteModalOpen,
    onSidebarResizeStart,
    stopSidebarResize,
    collapseSidebar,
    expandSidebar,
    toggleSidebarCollapsed,
    openCreateModal,
    closeCreateModal,
    openRenameModal,
    closeRenameModal,
    openDeleteModal,
    closeDeleteModal
  }
})
