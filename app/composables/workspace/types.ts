import type { Ref } from 'vue'
import type { useEditoro } from '~/composables/useEditoro'
import type { EditorSuggestionItems, EditorToolbarItems } from '~/types/editoro'

export type EditoroState = Awaited<ReturnType<typeof useEditoro>>

// Shared input contract for workspace binding composables.
export type WorkspaceBindingOptions = {
  state: EditoroState
  editorToolbarItems: Ref<EditorToolbarItems>
  editorSuggestionItems: Ref<EditorSuggestionItems>
}
