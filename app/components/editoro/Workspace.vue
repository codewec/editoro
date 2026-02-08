<script setup lang="ts">
import { createEditorSuggestionItems, createEditorToolbarItems } from '~/constants/editoro'
import { useEditoro } from '~/composables/useEditoro'
import { useEditoroWorkspaceBindings } from '~/composables/useEditoroWorkspaceBindings'

const { t } = useI18n()
const translate = (key: string, params?: Record<string, unknown>) => String(t(key as never, params as never))
const editorToolbarItems = computed(() => createEditorToolbarItems(translate))
const editorSuggestionItems = computed(() => createEditorSuggestionItems(translate))

const editoro = await useEditoro()

// Keep layout components declarative by grouping view props and handlers.
const bindings = useEditoroWorkspaceBindings({
  state: editoro,
  editorToolbarItems,
  editorSuggestionItems
})

const {
  selectedNode,
  expandedPaths
} = editoro.tree

const {
  sidebarProps,
  mainHeaderProps,
  mainContentProps,
  modalsProps,
  sidebarHandlers,
  mainHeaderHandlers,
  mainContentHandlers,
  modalsHandlers
} = bindings
</script>

<template>
  <div class="editoro-layout">
    <EditoroSidebar
      v-if="!editoro.ui.isSidebarCollapsed.value"
      v-model:selected-node="selectedNode"
      v-model:expanded-tree-paths="expandedPaths"
      v-bind="sidebarProps"
      @create="sidebarHandlers.create"
      @refresh="sidebarHandlers.refresh"
      @toggle-hidden="sidebarHandlers.toggleHidden"
      @open-settings="sidebarHandlers.openSettings"
      @close-settings="sidebarHandlers.closeSettings"
      @change-locale="sidebarHandlers.changeLocale"
      @change-color-mode="sidebarHandlers.changeColorMode"
      @collapse="sidebarHandlers.collapse"
      @sidebar-resize-start="sidebarHandlers.sidebarResizeStart"
      @root-drop="sidebarHandlers.rootDrop"
      @tree-drag-start="sidebarHandlers.treeDragStart"
      @tree-drag-end="sidebarHandlers.treeDragEnd"
      @tree-drag-over="sidebarHandlers.treeDragOver"
      @tree-drop="sidebarHandlers.treeDrop"
      @tree-drag-leave="sidebarHandlers.treeDragLeave"
    />

    <main class="editoro-main">
      <EditoroMainHeader
        v-bind="mainHeaderProps"
        :show-expand-sidebar-button="editoro.ui.isSidebarCollapsed.value"
        @expand-sidebar="mainHeaderHandlers.expandSidebar"
        @toggle-mode="mainHeaderHandlers.toggleMode"
        @select-badge="mainHeaderHandlers.selectBadge"
        @toggle-pin="mainHeaderHandlers.togglePin"
        @rename="mainHeaderHandlers.rename"
        @remove="mainHeaderHandlers.remove"
      />

      <EditoroMainContent
        v-bind="mainContentProps"
        @update-editor-content="mainContentHandlers.updateEditorContent"
        @select-path="mainContentHandlers.selectPath"
        @go-parent="mainContentHandlers.goParent"
      />
    </main>

    <EditoroModals
      v-bind="modalsProps"
      @update:create-modal-open="modalsHandlers.updateCreateModalOpen"
      @update:create-input-path="modalsHandlers.updateCreateInputPath"
      @create="modalsHandlers.create"
      @update:rename-modal-open="modalsHandlers.updateRenameModalOpen"
      @update:rename-input-name="modalsHandlers.updateRenameInputName"
      @rename="modalsHandlers.rename"
      @update:delete-modal-open="modalsHandlers.updateDeleteModalOpen"
      @remove="modalsHandlers.remove"
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
