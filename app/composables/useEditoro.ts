/**
 * Public entrypoint for editor page state.
 * Used by `app/components/editoro/Workspace.vue`.
 */
import { useEditoroState } from '~/composables/useEditoroState'

export async function useEditoro() {
  // Keep a stable public entrypoint while implementation evolves internally.
  return await useEditoroState()
}
