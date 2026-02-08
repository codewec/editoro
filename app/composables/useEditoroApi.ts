/**
 * Aggregates section builders into final grouped API shape.
 * Used by `app/composables/useEditoroState.ts`.
 */
import { buildActionsApi } from '~/composables/api/buildActionsApi'
import { buildEditorApi } from '~/composables/api/buildEditorApi'
import { buildSettingsApi } from '~/composables/api/buildSettingsApi'
import { buildTreeApi } from '~/composables/api/buildTreeApi'
import { buildUiApi } from '~/composables/api/buildUiApi'
import { buildViewApi } from '~/composables/api/buildViewApi'
import type { BuildEditoroApiOptions } from '~/composables/api/types'

export function buildEditoroApi(options: BuildEditoroApiOptions) {
  return {
    tree: buildTreeApi(options),
    editor: buildEditorApi(options),
    ui: buildUiApi(options),
    settings: buildSettingsApi(options),
    view: buildViewApi(options),
    actions: buildActionsApi(options)
  }
}
