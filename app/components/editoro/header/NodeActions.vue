<script setup lang="ts">
import type { SaveStatusColor } from '~/types/editoro'

const { t } = useI18n()

const props = defineProps<{
  canRenameOrDelete: boolean
  isSaving: boolean
  saveStatusColor: SaveStatusColor
  saveStatusIcon: string
  saveStatusHint: string
}>()

const emit = defineEmits<{
  rename: []
  remove: []
}>()
</script>

<template>
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
</template>

<style scoped>
.editoro-node-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.375rem;
  min-width: 170px;
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
