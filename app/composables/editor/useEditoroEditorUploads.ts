/**
 * Handles image uploads from editor and maps errors to user-facing notifications.
 * Used by `app/stores/editoroEditor.ts`.
 */
import type { Ref } from 'vue'
import type { Translator } from '~/types/editoro'
import { uploadFileApi, uploadImageApi } from '~/services/files-api'
import { toRelativeVaultLink } from '~/utils/editoro-vault-links'

type EditoroEditorUploadsOptions = {
  t: Translator
  activeFilePath: Ref<string>
  notifyError: (title: string, description?: string) => void
}

export function useEditoroEditorUploads(options: EditoroEditorUploadsOptions) {
  async function uploadImage(file: File) {
    if (!options.activeFilePath.value) {
      options.notifyError(options.t('errors.openMarkdownFirst'))
      return null
    }

    try {
      const result = await uploadImageApi(options.activeFilePath.value, file)
      return toRelativeVaultLink(options.activeFilePath.value, result.path)
    } catch (error) {
      console.error(error)
      options.notifyError(options.t('errors.uploadImage'))
      return null
    }
  }

  async function uploadFile(file: File) {
    if (!options.activeFilePath.value) {
      options.notifyError(options.t('errors.openMarkdownFirst'))
      return null
    }

    try {
      const result = await uploadFileApi(options.activeFilePath.value, file)
      return toRelativeVaultLink(options.activeFilePath.value, result.path)
    } catch (error) {
      console.error(error)
      options.notifyError(options.t('errors.uploadFile'))
      return null
    }
  }

  return {
    uploadImage,
    uploadFile
  }
}
