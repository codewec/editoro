/**
 * Orchestrates lifecycle and composes final grouped API for `useEditoro`.
 * Used by `app/composables/useEditoro.ts`.
 */
import { useEditoroContext } from '~/composables/useEditoroContext'
import { buildEditoroApi } from '~/composables/useEditoroApi'
import { useEditoroLifecycle } from '~/composables/useEditoroLifecycle'

export async function useEditoroState() {
  const { stores, refs, viewModel, fileSelection, entryActions, actions } = useEditoroContext()
  const { treeStore, editorStore, uiStore } = stores
  const { preferencesRefs, treeRefs } = refs

  await useEditoroLifecycle({
    selectedNode: treeRefs.selectedNode,
    showHiddenEntries: preferencesRefs.showHiddenEntries,
    fileSelection,
    treeStore,
    editorStore,
    uiStore
  })

  return buildEditoroApi({
    stores,
    refs,
    viewModel,
    entryActions,
    actions
  })
}
