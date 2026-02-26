<script setup lang="ts">
import type { CreateTargetType } from '~/types/editoro'

const { t } = useI18n()

const props = defineProps<{
  createModalOpen: boolean
  createTitle: string
  createInputLabel: string
  createInputPath: string
  createButtonLabel: string
  createPathPreview: string
  createTargetType: CreateTargetType
  renameModalOpen: boolean
  renameTitle: string
  renameInputName: string
  deleteModalOpen: boolean
  deleteTitle: string
  selectedPath: string
  moveProgressModalOpen: boolean
  moveProgressValue: number
  moveProgressStage: string
  moveSharedAttachmentCount: number
}>()

const emit = defineEmits<{
  'update:createModalOpen': [value: boolean]
  'update:createInputPath': [value: string]
  'create': [type: CreateTargetType]
  'update:renameModalOpen': [value: boolean]
  'update:renameInputName': [value: string]
  'rename': []
  'update:deleteModalOpen': [value: boolean]
  'remove': []
}>()
</script>

<template>
  <UModal
    :open="props.createModalOpen"
    :title="props.createTitle"
    :description="t('modals.createDescription')"
    @update:open="emit('update:createModalOpen', $event)"
  >
    <template #body>
      <div class="editoro-modal-body">
        <UFormField
          :label="props.createInputLabel"
          name="path"
        >
          <UInput
            class="w-full"
            :model-value="props.createInputPath"
            autofocus
            :placeholder="t('modals.createPathHintDescription')"
            @update:model-value="emit('update:createInputPath', String($event || ''))"
            @keydown.enter.prevent="emit('create', props.createTargetType)"
          />
        </UFormField>

        <UAlert
          color="primary"
          variant="soft"
          icon="i-lucide-folder-tree"
          :title="t('modals.createPathPreviewTitle')"
          :description="`/${props.createPathPreview}`"
        />
      </div>
    </template>

    <template #footer>
      <div class="editoro-modal-footer">
        <UButton
          color="neutral"
          variant="soft"
          @click="emit('update:createModalOpen', false)"
        >
          {{ t('common.cancel') }}
        </UButton>

        <UButton @click="emit('create', props.createTargetType)">
          {{ props.createButtonLabel }}
        </UButton>
      </div>
    </template>
  </UModal>

  <UModal
    :open="props.renameModalOpen"
    :title="props.renameTitle"
    :description="t('modals.renameDescription')"
    @update:open="emit('update:renameModalOpen', $event)"
  >
    <template #body>
      <div class="editoro-modal-body">
        <UFormField
          :label="t('modals.renameLabel')"
          name="rename"
        >
          <UInput
            :model-value="props.renameInputName"
            autofocus
            @update:model-value="emit('update:renameInputName', String($event || ''))"
            @keydown.enter.prevent="emit('rename')"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="editoro-modal-footer">
        <UButton
          color="neutral"
          variant="soft"
          @click="emit('update:renameModalOpen', false)"
        >
          {{ t('common.cancel') }}
        </UButton>

        <UButton @click="emit('rename')">
          {{ t('common.rename') }}
        </UButton>
      </div>
    </template>
  </UModal>

  <UModal
    :open="props.deleteModalOpen"
    :title="props.deleteTitle"
    :description="props.selectedPath"
    @update:open="emit('update:deleteModalOpen', $event)"
  >
    <template #body>
      <UAlert
        color="error"
        variant="soft"
        icon="i-lucide-alert-triangle"
        :title="t('modals.deleteIrreversible')"
        :description="t('modals.deleteIrreversibleDescription')"
      />
    </template>

    <template #footer>
      <div class="editoro-modal-footer">
        <UButton
          color="neutral"
          variant="soft"
          @click="emit('update:deleteModalOpen', false)"
        >
          {{ t('common.cancel') }}
        </UButton>

        <UButton
          color="error"
          @click="emit('remove')"
        >
          {{ t('common.delete') }}
        </UButton>
      </div>
    </template>
  </UModal>

  <UModal
    :open="props.moveProgressModalOpen"
    :dismissible="false"
    :title="t('move.title')"
    :description="t('move.description')"
  >
    <template #body>
      <div class="editoro-modal-body">
        <div class="editoro-move-stage">
          <UIcon
            name="i-lucide-loader-circle"
            class="editoro-move-spinner"
          />
          <span>{{ props.moveProgressStage }}</span>
        </div>

        <UProgress :value="props.moveProgressValue" />

        <span
          v-if="props.moveSharedAttachmentCount > 0"
          class="editoro-move-note"
        >
          {{ t('move.sharedAttachments', { count: props.moveSharedAttachmentCount }) }}
        </span>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.editoro-modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.editoro-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  width: 100%;
}

.editoro-move-stage {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.editoro-move-spinner {
  width: 1rem;
  height: 1rem;
  animation: editoro-spin 0.9s linear infinite;
}

.editoro-move-note {
  color: var(--ui-text-muted);
  font-size: 0.75rem;
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
