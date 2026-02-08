/**
 * Manages editor file loading and autosave persistence workflow.
 * Used by `app/stores/editoroEditor.ts`.
 */
import { nextTick } from 'vue'
import type { Ref } from 'vue'
import type { SaveState, Translator } from '~/types/editoro'
import { fetchFileContent, saveFileContent } from '~/services/files-api'
import { isMarkdownPath } from '~/utils/editoro-file'

type EditoroEditorPersistenceOptions = {
  t: Translator
  activeFilePath: Ref<string>
  editorContent: Ref<string>
  isLoadingFile: Ref<boolean>
  saveState: Ref<SaveState>
  lastSavedAt: Ref<Date | null>
  suppressAutoSave: Ref<boolean>
  notifyError: (title: string, description?: string) => void
}

export function useEditoroEditorPersistence(options: EditoroEditorPersistenceOptions) {
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  function clearEditor() {
    options.activeFilePath.value = ''
    options.editorContent.value = ''
    options.saveState.value = 'idle'
    options.lastSavedAt.value = null
  }

  async function loadFile(path: string) {
    if (!isMarkdownPath(path)) {
      clearEditor()
      return
    }

    options.isLoadingFile.value = true

    try {
      // Pause autosave while replacing editor state with server content.
      options.suppressAutoSave.value = true
      options.activeFilePath.value = path
      options.editorContent.value = ''

      const data = await fetchFileContent(path)
      options.editorContent.value = data.content
      options.saveState.value = 'idle'
      options.lastSavedAt.value = null

      await nextTick()
      options.suppressAutoSave.value = false
    } catch (error) {
      console.error(error)
      options.notifyError(options.t('errors.openFile'), path)
    } finally {
      options.isLoadingFile.value = false
    }
  }

  async function saveFile(path: string, content: string) {
    options.saveState.value = 'saving'

    try {
      await saveFileContent(path, content)
      options.saveState.value = 'saved'
      options.lastSavedAt.value = new Date()
    } catch (error) {
      console.error(error)
      options.saveState.value = 'error'
      options.notifyError(options.t('errors.saveFile'), path)
    }
  }

  function scheduleSave(path: string, content: string) {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }

    options.saveState.value = 'pending'
    saveTimer = setTimeout(() => {
      void saveFile(path, content)
    }, 600)
  }

  function clearPendingSave() {
    if (!saveTimer) {
      return
    }

    clearTimeout(saveTimer)
    saveTimer = undefined
  }

  watch(options.editorContent, (value) => {
    if (options.suppressAutoSave.value || !options.activeFilePath.value) {
      return
    }

    scheduleSave(options.activeFilePath.value, value)
  })

  return {
    clearEditor,
    loadFile,
    clearPendingSave
  }
}
