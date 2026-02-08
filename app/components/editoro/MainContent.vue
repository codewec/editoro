<script setup lang="ts">
import { computed } from 'vue'
import type { DirectoryTreeNode, EditorSuggestionItems, EditorToolbarItems, EditorViewMode, TreeNode, TreeNodeType } from '~/types/editoro'
import { useEditoroMainContentMedia } from '~/composables/editor/useEditoroMainContentMedia'

const { t } = useI18n()

const props = defineProps<{
  isLoadingTree: boolean
  isLoadingFile: boolean
  selectedNodeType?: TreeNodeType
  selectedPath: string
  selectedFolder?: DirectoryTreeNode
  selectedFolderParentPath: string
  browserItems: TreeNode[]
  selectedIsImage: boolean
  selectedImageUrl: string
  selectedFileExtension: string
  editorViewMode: EditorViewMode
  editorContent: string
  editorToolbarItems: EditorToolbarItems
  editorSuggestionItems: EditorSuggestionItems
  canUploadImage: boolean
  uploadImage: (file: File) => Promise<string | null>
}>()

const emit = defineEmits<{
  toggleMode: []
  updateEditorContent: [value: string]
  selectPath: [path: string]
  goParent: []
}>()

// Keep editor fallback in loading state during client-only initialization.
const isMarkdownFileSelected = computed(() => {
  if (props.selectedNodeType !== 'file') {
    return false
  }

  const extension = props.selectedFileExtension.toLowerCase()
  return extension === 'md' || extension === 'markdown'
})

const {
  imageInputRef,
  editorHandlers,
  bindEditor,
  onImageInputChange
} = useEditoroMainContentMedia({
  canUploadImage: () => props.canUploadImage,
  uploadImage: props.uploadImage
})

const richEditorHandlers = computed(() => ({
  ...editorHandlers,
  toggleRawMode: {
    canExecute: () => true,
    execute: () => {
      emit('toggleMode')
      return true
    },
    isActive: () => false
  }
}))
</script>

<template>
  <div class="editoro-main-body">
    <div
      v-if="props.isLoadingTree || props.isLoadingFile"
      class="editoro-loading-state"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="editoro-loading-spinner"
      />
      <span class="editoro-loading-label">
        {{ props.isLoadingTree ? t('main.loadingData') : t('main.loadingFile') }}
      </span>
    </div>

    <div
      v-else-if="props.selectedNodeType !== 'file'"
      class="editoro-folder-view"
    >
      <div class="editoro-folder-list">
        <UButton
          v-if="props.selectedFolder"
          variant="ghost"
          color="neutral"
          class="editoro-folder-item"
          icon="i-lucide-arrow-up"
          @click="emit('goParent')"
        >
          {{ props.selectedFolderParentPath ? t('main.goUp') : t('main.toRoot') }}
        </UButton>

        <UButton
          v-for="item in props.browserItems"
          :key="item.path"
          variant="ghost"
          color="neutral"
          class="editoro-folder-item"
          :icon="item.type === 'directory' ? 'i-lucide-folder' : (item.icon || 'i-lucide-file')"
          @click="emit('selectPath', item.path)"
        >
          {{ item.label }}
        </UButton>
      </div>

      <UAlert
        v-if="props.browserItems.length === 0"
        :title="props.selectedFolder ? t('main.folderEmpty') : t('main.rootEmpty')"
        icon="i-lucide-folder-open"
        color="neutral"
        variant="soft"
      />
    </div>

    <div
      v-else-if="props.selectedIsImage"
      class="editoro-image-view"
    >
      <img
        v-if="props.selectedImageUrl"
        :src="props.selectedImageUrl"
        :alt="props.selectedPath"
        class="editoro-image-preview"
      >
      <UAlert
        v-else
        :title="t('main.imagePreviewError')"
        color="warning"
        icon="i-lucide-image-off"
        variant="soft"
      />
    </div>

    <ClientOnly v-else-if="isMarkdownFileSelected">
      <template #fallback>
        <div class="editoro-loading-state">
          <UIcon
            name="i-lucide-loader-circle"
            class="editoro-loading-spinner"
          />
          <span class="editoro-loading-label">{{ t('main.loadingEditor') }}</span>
        </div>
      </template>

      <div
        v-if="props.editorViewMode === 'raw'"
        class="editoro-raw-wrap"
      >
        <div class="editoro-raw-switch-wrap">
          <UButton
            size="xs"
            color="neutral"
            variant="soft"
            class="editoro-raw-switch"
            icon="i-lucide-square-pen"
            :aria-label="t('editorMode.toRich')"
            @click="emit('toggleMode')"
          >
            {{ t('editorMode.rich') }}
          </UButton>
        </div>

        <UTextarea
          :model-value="props.editorContent"
          :rows="30"
          :autoresize="false"
          class="editoro-raw"
          :placeholder="t('main.rawPlaceholder')"
          @update:model-value="emit('updateEditorContent', String($event || ''))"
        />
      </div>

      <UEditor
        v-else
        :model-value="props.editorContent"
        class="editoro-editor"
        content-type="markdown"
        :handlers="richEditorHandlers"
        :placeholder="t('main.editorPlaceholder')"
        @update:model-value="emit('updateEditorContent', String($event || ''))"
      >
        <template #default="{ editor }">
          <span
            v-if="bindEditor(editor)"
            style="display: none;"
          />
          <UEditorToolbar
            :editor="editor"
            :items="props.editorToolbarItems"
            class="editoro-toolbar"
          />
          <UEditorSuggestionMenu
            :editor="editor"
            :items="props.editorSuggestionItems"
          />
          <UEditorDragHandle :editor="editor" />
        </template>
      </UEditor>
    </ClientOnly>

    <UAlert
      v-else-if="props.selectedNodeType === 'file'"
      :title="t('main.unsupportedFormat')"
      :description="t('main.selectedFormat', { ext: props.selectedFileExtension || 'unknown' })"
      color="neutral"
      variant="soft"
      icon="i-lucide-file-warning"
      class="editoro-unsupported-alert"
    />

    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      class="editoro-file-input"
      @change="onImageInputChange"
    >
  </div>
</template>

<style scoped>
.editoro-main-body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 0.75rem;
  overflow: hidden;
}

.editoro-loading-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--ui-text-muted);
}

.editoro-loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  animation: editoro-spin 0.9s linear infinite;
}

.editoro-loading-label {
  font-size: 0.75rem;
}

.editoro-folder-view {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.editoro-image-view {
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 0.5rem;
}

.editoro-image-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 0.5rem;
  border: 1px solid var(--ui-border-muted);
}

.editoro-folder-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.editoro-folder-item {
  justify-content: flex-start;
}

.editoro-editor {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.editoro-editor :deep([data-slot='content']) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-top: 1rem;
}

.editoro-raw {
  height: 100%;
  width: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.editoro-raw-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.editoro-raw-switch-wrap {
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  z-index: 10;
}

.editoro-raw :deep(textarea) {
  height: 100%;
  padding-right: 6.25rem;
}

.editoro-toolbar {
  margin-bottom: 1rem;
}

.editoro-file-input {
  display: none;
}

.editoro-unsupported-alert {
  margin-top: 0.75rem;
}

@media (min-width: 640px) {
  .editoro-toolbar {
    padding-left: calc(var(--spacing) * 8);
    padding-right: calc(var(--spacing) * 8);
  }
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
