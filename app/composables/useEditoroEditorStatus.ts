/**
 * Derives save badge and editor mode labels/icons from editor state.
 * Used by `app/stores/editoroEditor.ts`.
 */
import type { Ref } from 'vue'
import type { EditorViewMode, SaveState, SaveStatusColor, Translator } from '~/types/editoro'
import { formatRelativeDateTime } from '~/utils/editoro-time'

type EditoroEditorStatusOptions = {
  t: Translator
  locale: Ref<string>
  saveState: Ref<SaveState>
  lastSavedAt: Ref<Date | null>
  editorViewMode: Ref<EditorViewMode>
}

export function useEditoroEditorStatus(options: EditoroEditorStatusOptions) {
  const isSaving = computed(() => options.saveState.value === 'saving')

  const saveStatusColor = computed<SaveStatusColor>(() => {
    return options.saveState.value === 'error' ? 'error' : options.saveState.value === 'saving' ? 'neutral' : 'success'
  })

  const saveStatusIcon = computed(() => {
    return options.saveState.value === 'error' ? 'i-lucide-alert-triangle' : 'i-lucide-check'
  })

  const saveStatusHint = computed(() => {
    if (options.saveState.value === 'saving') {
      return options.t('save.inProgress')
    }

    if (options.saveState.value === 'error') {
      return options.t('save.error')
    }

    if (options.lastSavedAt.value) {
      // Recompute relative timestamp in the current locale at render time.
      return options.t('save.lastSaved', {
        time: formatRelativeDateTime(options.lastSavedAt.value, new Date(), options.locale.value)
      })
    }

    return options.t('save.success')
  })

  const editorModeLabel = computed(() => {
    return options.editorViewMode.value === 'raw' ? options.t('editorMode.raw') : options.t('editorMode.rich')
  })

  const editorModeIcon = computed(() => {
    return options.editorViewMode.value === 'raw' ? 'i-lucide-file-text' : 'i-lucide-code-2'
  })

  const editorModeTooltip = computed(() => {
    return options.editorViewMode.value === 'raw' ? options.t('editorMode.toRich') : options.t('editorMode.toRaw')
  })

  return {
    isSaving,
    saveStatusColor,
    saveStatusIcon,
    saveStatusHint,
    editorModeLabel,
    editorModeIcon,
    editorModeTooltip
  }
}
