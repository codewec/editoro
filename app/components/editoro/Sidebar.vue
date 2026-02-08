<script setup lang="ts">
import type { ColorModePreference, CreateTargetType, SelectOption, TreeNode } from '~/types/editoro'
import { useEditoroSidebarDnDHandlers } from '~/composables/workspace/useEditoroSidebarDnDHandlers'
import { getTreeNodeIcon } from '~/utils/editoro-tree'

const { t } = useI18n()

const props = defineProps<{
  width: number
  minWidth: number
  maxWidth: number
  isLoadingTree: boolean
  showHiddenEntries: boolean
  settingsModalOpen: boolean
  settingsLocale: string
  settingsColorMode: ColorModePreference
  localeOptions: SelectOption[]
  colorModeOptions: SelectOption[]
  draggingPath: string
  dragOverTargetPath: string
  treeItems: TreeNode[]
}>()

const selectedNode = defineModel<TreeNode | undefined>('selectedNode', { required: true })
const expandedTreePaths = defineModel<string[]>('expandedTreePaths', { required: true })

const emit = defineEmits<{
  create: [type: CreateTargetType]
  sidebarResizeStart: [event: MouseEvent]
  rootDrop: [event: DragEvent]
  treeDragStart: [item: TreeNode, event: DragEvent]
  treeDragEnd: []
  treeDragOver: [item: TreeNode, event: DragEvent]
  treeDrop: [item: TreeNode, event: DragEvent]
  treeDragLeave: []
  refresh: []
  toggleHidden: []
  collapse: []
  openSettings: []
  closeSettings: []
  changeLocale: [value: string]
  changeColorMode: [value: string]
}>()

function getIconName(item: TreeNode, expanded: boolean) {
  return getTreeNodeIcon(item, expanded)
}

const {
  emitDragStart,
  emitDragOver,
  emitDrop
} = useEditoroSidebarDnDHandlers({
  getTreeItems: () => props.treeItems,
  onDragStart: (item, event) => emit('treeDragStart', item, event),
  onDragOver: (item, event) => emit('treeDragOver', item, event),
  onDrop: (item, event) => emit('treeDrop', item, event)
})
</script>

<template>
  <aside
    class="editoro-sidebar"
    :style="{
      width: `${props.width}px`,
      minWidth: `${props.minWidth}px`,
      maxWidth: `${props.maxWidth}px`
    }"
  >
    <div class="editoro-sidebar-header">
      <h1 class="editoro-title">
        Editoro
        <UIcon
          v-if="props.isLoadingTree"
          name="i-lucide-loader-circle"
          class="editoro-title-spinner"
        />
      </h1>

      <div class="editoro-actions">
        <UButton
          icon="i-lucide-panel-left-close"
          size="xs"
          color="neutral"
          variant="soft"
          :aria-label="t('sidebar.collapse')"
          @click="emit('collapse')"
        />

        <UButton
          icon="i-lucide-settings-2"
          size="xs"
          color="neutral"
          variant="soft"
          :aria-label="t('sidebar.settings')"
          @click="emit('openSettings')"
        />

        <UButton
          icon="i-lucide-refresh-cw"
          size="xs"
          color="neutral"
          variant="soft"
          :aria-label="t('sidebar.refresh')"
          @click="emit('refresh')"
        />

        <UButton
          :icon="props.showHiddenEntries ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          size="xs"
          color="neutral"
          variant="soft"
          :aria-label="props.showHiddenEntries ? t('sidebar.hideHidden') : t('sidebar.showHidden')"
          @click="emit('toggleHidden')"
        />

        <UButton
          icon="i-lucide-file-plus-2"
          size="xs"
          variant="soft"
          color="neutral"
          :aria-label="t('sidebar.createFile')"
          @click="emit('create', 'file')"
        />

        <UButton
          icon="i-lucide-folder-plus"
          size="xs"
          color="neutral"
          variant="soft"
          :aria-label="t('sidebar.createFolder')"
          @click="emit('create', 'directory')"
        />
      </div>
    </div>

    <div class="editoro-tree">
      <div
        v-if="props.isLoadingTree"
        class="editoro-loading-state"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="editoro-loading-spinner"
        />
        <span class="editoro-loading-label">{{ t('sidebar.loadingTree') }}</span>
      </div>

      <template v-else>
        <div
          class="editoro-root-drop"
          :class="{ 'editoro-root-drop-active': !!props.draggingPath }"
          @dragover.prevent
          @drop="emit('rootDrop', $event)"
        >
          {{ t('sidebar.moveToRoot') }}
        </div>

        <UTree
          v-model="selectedNode"
          v-model:expanded="expandedTreePaths"
          :items="props.treeItems"
          :get-key="(item) => item.path"
          selection-behavior="replace"
        >
          <template #item-leading="{ item, expanded }">
            <span
              class="editoro-tree-handle"
              :data-path="item.path"
              draggable="true"
              @dragstart="emitDragStart(item.path, $event)"
              @dragend="emit('treeDragEnd')"
              @dragover="emitDragOver(item.path, $event)"
              @dragleave="emit('treeDragLeave')"
              @drop="emitDrop(item.path, $event)"
            >
              <UIcon
                :name="getIconName(item, expanded)"
                class="editoro-tree-leading-icon"
              />
            </span>
          </template>

          <template #item-label="{ item }">
            <span
              class="editoro-tree-handle editoro-tree-label"
              :data-path="item.path"
              :class="{
                'editoro-tree-label-drag-over': props.dragOverTargetPath === item.path
              }"
              draggable="true"
              @dragstart="emitDragStart(item.path, $event)"
              @dragend="emit('treeDragEnd')"
              @dragover="emitDragOver(item.path, $event)"
              @dragleave="emit('treeDragLeave')"
              @drop="emitDrop(item.path, $event)"
            >
              {{ item.label }}
            </span>
          </template>

          <template #item-trailing="{ item, expanded }">
            <span
              v-if="item.type === 'directory'"
              class="editoro-tree-handle editoro-tree-trailing"
              :data-path="item.path"
              draggable="true"
              @dragstart="emitDragStart(item.path, $event)"
              @dragend="emit('treeDragEnd')"
              @dragover="emitDragOver(item.path, $event)"
              @dragleave="emit('treeDragLeave')"
              @drop="emitDrop(item.path, $event)"
            >
              <UIcon
                name="i-lucide-chevron-down"
                class="editoro-tree-trailing-icon"
                :class="{ 'editoro-tree-trailing-icon-collapsed': !expanded }"
              />
            </span>
          </template>
        </UTree>
      </template>
    </div>
  </aside>

  <div
    class="editoro-resize-handle"
    @mousedown.prevent="emit('sidebarResizeStart', $event)"
  />

  <UModal
    :open="props.settingsModalOpen"
    :title="t('settings.title')"
    @update:open="(value) => { if (!value) emit('closeSettings') }"
  >
    <template #body>
      <div class="editoro-settings-body">
        <div class="editoro-settings-section">
          <div class="editoro-settings-title">
            {{ t('settings.language') }}
          </div>
          <div class="editoro-settings-actions">
            <UButton
              v-for="option in props.localeOptions"
              :key="option.value"
              size="sm"
              :variant="props.settingsLocale === option.value ? 'solid' : 'soft'"
              color="neutral"
              @click="emit('changeLocale', option.value)"
            >
              {{ option.label }}
            </UButton>
          </div>
        </div>

        <div class="editoro-settings-section">
          <div class="editoro-settings-title">
            {{ t('settings.colorMode') }}
          </div>
          <div class="editoro-settings-actions">
            <UButton
              v-for="option in props.colorModeOptions"
              :key="option.value"
              size="sm"
              :variant="props.settingsColorMode === option.value ? 'solid' : 'soft'"
              color="neutral"
              @click="emit('changeColorMode', option.value)"
            >
              {{ option.label }}
            </UButton>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="editoro-settings-footer">
        <UButton
          color="neutral"
          variant="soft"
          @click="emit('closeSettings')"
        >
          {{ t('settings.close') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.editoro-sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--ui-border-muted);
}

.editoro-resize-handle {
  width: 6px;
  cursor: col-resize;
  background: transparent;
}

.editoro-resize-handle:hover {
  background: color-mix(in oklab, var(--ui-border-muted) 65%, transparent);
}

.editoro-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--ui-border-muted);
}

.editoro-title {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  font-size: 1rem;
}

.editoro-title-spinner {
  animation: editoro-spin 0.9s linear infinite;
}

.editoro-actions {
  display: flex;
  gap: 0.5rem;
}

.editoro-settings-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editoro-settings-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editoro-settings-title {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.editoro-settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.editoro-settings-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.editoro-tree {
  position: relative;
  flex: 1;
  overflow: auto;
  padding: 0.5rem;
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

.editoro-root-drop {
  margin-bottom: 0.5rem;
  padding: 0.4rem 0.5rem;
  border: 1px dashed var(--ui-border-muted);
  border-radius: 0.375rem;
  font-size: 0.7rem;
  color: var(--ui-text-muted);
}

.editoro-root-drop-active {
  border-color: var(--ui-primary);
  color: var(--ui-primary);
}

.editoro-tree-label {
  display: inline-flex;
  flex: 1;
  min-width: 0;
  padding: 0.125rem 0.125rem;
  border-radius: 0.25rem;
}

.editoro-tree-handle {
  display: inline-flex;
  align-items: center;
}

.editoro-tree-leading-icon {
  width: 1rem;
  height: 1rem;
}

.editoro-tree-trailing {
  padding-left: 0.125rem;
}

.editoro-tree-trailing-icon {
  width: 0.9rem;
  height: 0.9rem;
  transition: transform 0.12s ease;
}

.editoro-tree-trailing-icon-collapsed {
  transform: rotate(-90deg);
}

.editoro-tree-label-drag-over {
  outline: 1px dashed var(--ui-primary);
  background-color: color-mix(in oklab, var(--ui-primary) 12%, transparent);
}

@keyframes editoro-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .editoro-resize-handle {
    display: none;
  }

  .editoro-actions {
    flex-direction: column;
  }
}
</style>
