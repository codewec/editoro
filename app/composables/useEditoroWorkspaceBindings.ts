/**
 * Thin aggregator for workspace view bindings (sidebar/header/content/modals).
 * Used by `app/components/editoro/Workspace.vue`.
 */
import type { WorkspaceBindingOptions } from '~/composables/workspace/types'
import { useEditoroMainContentBindings } from '~/composables/workspace/useEditoroMainContentBindings'
import { useEditoroMainHeaderBindings } from '~/composables/workspace/useEditoroMainHeaderBindings'
import { useEditoroModalsBindings } from '~/composables/workspace/useEditoroModalsBindings'
import { useEditoroSidebarBindings } from '~/composables/workspace/useEditoroSidebarBindings'

export function useEditoroWorkspaceBindings(options: WorkspaceBindingOptions) {
  const { state } = options

  const { sidebarProps, sidebarHandlers } = useEditoroSidebarBindings(state)
  const { mainHeaderProps, mainHeaderHandlers } = useEditoroMainHeaderBindings(state)
  const { mainContentProps, mainContentHandlers } = useEditoroMainContentBindings(options)
  const { modalsProps, modalsHandlers } = useEditoroModalsBindings(state)

  return {
    sidebarProps,
    sidebarHandlers,
    mainHeaderProps,
    mainHeaderHandlers,
    mainContentProps,
    mainContentHandlers,
    modalsProps,
    modalsHandlers
  }
}
