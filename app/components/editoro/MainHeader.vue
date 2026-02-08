<script setup lang="ts">
import type { SaveStatusColor } from '~/types/editoro'

const { t } = useI18n()

const props = defineProps<{
  editorTitle: string
  editorModeLabel: string
  editorModeIcon: string
  editorModeTooltip: string
  canRenameOrDelete: boolean
  isSaving: boolean
  saveStatusColor: SaveStatusColor
  saveStatusIcon: string
  saveStatusHint: string
}>()

const emit = defineEmits<{
  toggleMode: []
  rename: []
  remove: []
}>()
</script>

<template>
  <header class="editoro-main-header">
    <UTooltip :text="props.editorModeTooltip">
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        :icon="props.editorModeIcon"
        @click="emit('toggleMode')"
      >
        {{ props.editorModeLabel }}
      </UButton>
    </UTooltip>

    <div class="editoro-main-heading">
      <div class="editoro-main-title">
        {{ props.editorTitle }}
      </div>
    </div>

    <div class="editoro-node-actions">
      <template v-if="props.canRenameOrDelete">
        <UTooltip :text="props.saveStatusHint">
          <UBadge
            size="md"
            :color="props.saveStatusColor"
            variant="soft"
            square
            class="editoro-save-indicator"
            :aria-label="t('main.saveStatus')"
          >
            <UIcon
              :name="props.isSaving ? 'i-lucide-loader-circle' : props.saveStatusIcon"
              :class="{ 'editoro-save-spinner': props.isSaving }"
            />
          </UBadge>
        </UTooltip>

        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          icon="i-lucide-pencil"
          :aria-label="t('main.rename')"
          @click="emit('rename')"
        />

        <UButton
          size="xs"
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          :aria-label="t('main.remove')"
          @click="emit('remove')"
        />
      </template>
    </div>
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

.editoro-main-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  justify-content: center;
}

.editoro-main-title {
  min-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.875rem;
}

.editoro-node-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.375rem;
  min-width: 230px;
}

.editoro-save-indicator {
  cursor: default;
}

.editoro-save-spinner {
  animation: editoro-spin 0.9s linear infinite;
}

@keyframes editoro-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
