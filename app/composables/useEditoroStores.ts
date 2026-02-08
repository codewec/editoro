/**
 * Initializes editor-related stores and exposes their refs in one place.
 * Used by `app/composables/useEditoroContext.ts`.
 */
import { storeToRefs } from '#imports'
import { useEditoroEditorStore } from '~/stores/editoroEditor'
import { useEditoroPreferencesStore } from '~/stores/editoroPreferences'
import { useEditoroTreeStore } from '~/stores/editoroTree'
import { useEditoroUiStore } from '~/stores/editoroUi'

export function useEditoroStores() {
  const preferencesStore = useEditoroPreferencesStore()
  const treeStore = useEditoroTreeStore()
  const editorStore = useEditoroEditorStore()
  const uiStore = useEditoroUiStore()

  // Ensure cookies-based settings are restored before any derived view state is computed.
  preferencesStore.initialize()

  const preferencesRefs = storeToRefs(preferencesStore)
  const treeRefs = storeToRefs(treeStore)
  const editorRefs = storeToRefs(editorStore)
  const uiRefs = storeToRefs(uiStore)

  return {
    stores: {
      preferencesStore,
      treeStore,
      editorStore,
      uiStore
    },
    refs: {
      preferencesRefs,
      treeRefs,
      editorRefs,
      uiRefs
    }
  }
}
