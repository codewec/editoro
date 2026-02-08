<script setup lang="ts">
import type { EditorPinnedBadge, SaveStatusColor } from '~/types/editoro'

const { t } = useI18n()

const props = defineProps<{
  showExpandSidebarButton: boolean
  editorModeLabel: string
  editorModeIcon: string
  editorModeTooltip: string
  headerBadges: EditorPinnedBadge[]
  canRenameOrDelete: boolean
  isSaving: boolean
  saveStatusColor: SaveStatusColor
  saveStatusIcon: string
  saveStatusHint: string
}>()

const emit = defineEmits<{
  expandSidebar: []
  toggleMode: []
  selectBadge: [path: string]
  togglePin: [path: string]
  rename: []
  remove: []
}>()
</script>

<template>
  <header class="editoro-main-header">
    <UButton
      v-if="props.showExpandSidebarButton"
      size="xs"
      color="neutral"
      variant="soft"
      icon="i-lucide-panel-left-open"
      :aria-label="t('sidebar.expand')"
      @click="emit('expandSidebar')"
    />

    <EditoroHeaderModeToggle
      :label="props.editorModeLabel"
      :icon="props.editorModeIcon"
      :tooltip="props.editorModeTooltip"
      @toggle="emit('toggleMode')"
    />

    <EditoroHeaderPinnedBadges
      :badges="props.headerBadges"
      @select="(path) => emit('selectBadge', path)"
      @toggle-pin="(path) => emit('togglePin', path)"
    />

    <EditoroHeaderNodeActions
      :can-rename-or-delete="props.canRenameOrDelete"
      :is-saving="props.isSaving"
      :save-status-color="props.saveStatusColor"
      :save-status-icon="props.saveStatusIcon"
      :save-status-hint="props.saveStatusHint"
      @rename="emit('rename')"
      @remove="emit('remove')"
    />
  </header>
</template>

<style scoped>
.editoro-main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--ui-border-muted);
}
</style>
