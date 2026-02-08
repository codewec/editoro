<script setup lang="ts">
import { createEditorSuggestionItems, createEditorToolbarItems } from '~/constants/editoro'
import { useEditoro } from '~/composables/useEditoro'
const { t } = useI18n()
const translate = (key: string, params?: Record<string, unknown>) => String(t(key as never, params as never))
const editorToolbarItems = computed(() => createEditorToolbarItems(translate))
const editorSuggestionItems = computed(() => createEditorSuggestionItems(translate))

const {
  treeItems,
  selectedNode,
  expandedTreePaths,
  activeFilePath,
  editorContent,
  editorViewMode,
  isLoadingTree,
  isLoadingFile,
  minSidebarWidth,
  maxSidebarWidth,
  sidebarWidth,
  createModalOpen,
  createTargetType,
  createInputPath,
  renameModalOpen,
  renameInputName,
  deleteModalOpen,
  draggingPath,
  dragOverTargetPath,
  showHiddenEntries,
  settingsModalOpen,
  settingsLocale,
  settingsColorMode,
  localeOptions,
  colorModeOptions,
  selectedFolder,
  browserItems,
  selectedFolderParentPath,
  selectedNodeType,
  selectedIsImage,
  selectedImageUrl,
  selectedFileExtension,
  canRenameOrDelete,
  editorTitle,
  selectedPath,
  createTitle,
  createButtonLabel,
  createInputLabel,
  createPathPreview,
  renameTitle,
  deleteTitle,
  isSaving,
  saveStatusColor,
  saveStatusIcon,
  saveStatusHint,
  editorModeLabel,
  editorModeIcon,
  editorModeTooltip,
  uploadImage,
  toggleEditorMode,
  openCreateModal,
  createEntry,
  openRenameModal,
  renameSelectedEntry,
  deleteSelectedEntry,
  refreshTree,
  toggleShowHiddenEntries,
  openSettingsModal,
  closeSettingsModal,
  setLocalePreference,
  setColorModePreference,
  selectNodeByPath,
  goToFolderParent,
  onSidebarResizeStart,
  onTreeDragStart,
  onTreeDragEnd,
  onTreeDragOver,
  onTreeDrop,
  onRootDrop
} = await useEditoro()
</script>

<template>
  <div class="editoro-layout">
    <EditoroSidebar
      v-model:selected-node="selectedNode"
      v-model:expanded-tree-paths="expandedTreePaths"
      :width="sidebarWidth"
      :min-width="minSidebarWidth"
      :max-width="maxSidebarWidth"
      :is-loading-tree="isLoadingTree"
      :show-hidden-entries="showHiddenEntries"
      :settings-modal-open="settingsModalOpen"
      :settings-locale="settingsLocale"
      :settings-color-mode="settingsColorMode"
      :locale-options="localeOptions"
      :color-mode-options="colorModeOptions"
      :dragging-path="draggingPath"
      :drag-over-target-path="dragOverTargetPath"
      :tree-items="treeItems"
      @create="openCreateModal"
      @refresh="refreshTree"
      @toggle-hidden="toggleShowHiddenEntries"
      @open-settings="openSettingsModal"
      @close-settings="closeSettingsModal"
      @change-locale="setLocalePreference"
      @change-color-mode="setColorModePreference"
      @sidebar-resize-start="onSidebarResizeStart"
      @root-drop="onRootDrop"
      @tree-drag-start="onTreeDragStart"
      @tree-drag-end="onTreeDragEnd"
      @tree-drag-over="onTreeDragOver"
      @tree-drop="onTreeDrop"
      @tree-drag-leave="dragOverTargetPath = ''"
    />

    <main class="editoro-main">
      <EditoroMainHeader
        :editor-title="editorTitle"
        :editor-mode-label="editorModeLabel"
        :editor-mode-icon="editorModeIcon"
        :editor-mode-tooltip="editorModeTooltip"
        :can-rename-or-delete="canRenameOrDelete"
        :is-saving="isSaving"
        :save-status-color="saveStatusColor"
        :save-status-icon="saveStatusIcon"
        :save-status-hint="saveStatusHint"
        @toggle-mode="toggleEditorMode"
        @rename="openRenameModal"
        @remove="deleteModalOpen = true"
      />

      <EditoroMainContent
        :is-loading-tree="isLoadingTree"
        :is-loading-file="isLoadingFile"
        :selected-node-type="selectedNodeType"
        :selected-path="selectedPath"
        :selected-folder="selectedFolder"
        :selected-folder-parent-path="selectedFolderParentPath"
        :browser-items="browserItems"
        :selected-is-image="selectedIsImage"
        :selected-image-url="selectedImageUrl"
        :selected-file-extension="selectedFileExtension"
        :editor-view-mode="editorViewMode"
        :editor-content="editorContent"
        :editor-toolbar-items="editorToolbarItems"
        :editor-suggestion-items="editorSuggestionItems"
        :can-upload-image="!!activeFilePath"
        :upload-image="uploadImage"
        @update-editor-content="editorContent = $event"
        @select-path="selectNodeByPath"
        @go-parent="goToFolderParent"
      />
    </main>

    <EditoroModals
      :create-modal-open="createModalOpen"
      :create-title="createTitle"
      :create-input-label="createInputLabel"
      :create-input-path="createInputPath"
      :create-button-label="createButtonLabel"
      :create-path-preview="createPathPreview"
      :create-target-type="createTargetType"
      :rename-modal-open="renameModalOpen"
      :rename-title="renameTitle"
      :rename-input-name="renameInputName"
      :delete-modal-open="deleteModalOpen"
      :delete-title="deleteTitle"
      :selected-path="selectedPath"
      @update:create-modal-open="createModalOpen = $event"
      @update:create-input-path="createInputPath = $event"
      @create="createEntry"
      @update:rename-modal-open="renameModalOpen = $event"
      @update:rename-input-name="renameInputName = $event"
      @rename="renameSelectedEntry"
      @update:delete-modal-open="deleteModalOpen = $event"
      @remove="deleteSelectedEntry"
    />
  </div>
</template>

<style scoped>
.editoro-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.editoro-main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}
</style>
