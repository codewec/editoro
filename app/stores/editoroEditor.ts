/**
 * Store for editor content state, persistence, upload and status composition.
 * Used by `app/composables/useEditoroStores.ts`.
 */
import type { EditorViewMode, SaveState } from '~/types/editoro'
import { useEditoroEditorStatus } from '~/composables/useEditoroEditorStatus'
import { useEditoroEditorPersistence } from '~/composables/editor/useEditoroEditorPersistence'
import { useEditoroEditorPins } from '~/composables/editor/useEditoroEditorPins'
import { useEditoroEditorUploads } from '~/composables/editor/useEditoroEditorUploads'

export const useEditoroEditorStore = defineStore('editoro-editor', () => {
  const toast = useToast()
  const { t, locale } = useI18n()

  const activeFilePath = ref('')
  const editorContent = ref('')
  const editorViewMode = ref<EditorViewMode>('rich')
  const isLoadingFile = ref(false)

  const saveState = ref<SaveState>('idle')
  const lastSavedAt = ref<Date | null>(null)
  const suppressAutoSave = ref(false)

  const editorStatus = useEditoroEditorStatus({
    t,
    locale,
    saveState,
    lastSavedAt,
    editorViewMode
  })

  function notifyError(title: string, description?: string) {
    toast.add({ title, description, color: 'error' })
  }

  function toggleEditorMode() {
    editorViewMode.value = editorViewMode.value === 'raw' ? 'rich' : 'raw'
  }

  function setContent(value: string) {
    editorContent.value = value
  }

  const persistence = useEditoroEditorPersistence({
    t,
    activeFilePath,
    editorContent,
    isLoadingFile,
    saveState,
    lastSavedAt,
    suppressAutoSave,
    notifyError
  })

  const uploads = useEditoroEditorUploads({
    t,
    activeFilePath,
    notifyError
  })

  const pins = useEditoroEditorPins({
    activeFilePath
  })

  return {
    activeFilePath,
    editorContent,
    editorViewMode,
    isLoadingFile,
    saveState,
    lastSavedAt,
    isSaving: editorStatus.isSaving,
    saveStatusColor: editorStatus.saveStatusColor,
    saveStatusIcon: editorStatus.saveStatusIcon,
    saveStatusHint: editorStatus.saveStatusHint,
    editorModeLabel: editorStatus.editorModeLabel,
    editorModeIcon: editorStatus.editorModeIcon,
    editorModeTooltip: editorStatus.editorModeTooltip,
    pinnedFilePaths: pins.pinnedFilePaths,
    clearEditor: persistence.clearEditor,
    toggleEditorMode,
    loadFile: persistence.loadFile,
    setContent,
    uploadImage: uploads.uploadImage,
    uploadFile: uploads.uploadFile,
    clearPendingSave: persistence.clearPendingSave,
    isPinned: pins.isPinned,
    pinFile: pins.pinFile,
    unpinFile: pins.unpinFile,
    togglePinnedFile: pins.togglePinnedFile,
    toggleCurrentFilePin: pins.toggleCurrentFilePin,
    reconcilePinnedFiles: pins.reconcilePinnedFiles
  }
})
