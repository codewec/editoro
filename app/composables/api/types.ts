import type { useEditoroContext } from '~/composables/useEditoroContext'

type EditoroContext = ReturnType<typeof useEditoroContext>

export type BuildEditoroApiOptions = {
  stores: EditoroContext['stores']
  refs: EditoroContext['refs']
  viewModel: EditoroContext['viewModel']
  entryActions: EditoroContext['entryActions']
  actions: EditoroContext['actions']
}
