# AGENTS.md

This document gives AI agents a practical map of the `editoro` codebase.

## 1) Project Overview

- Stack: `Nuxt 4`, `Nuxt UI 4`, `Pinia`, `@nuxtjs/i18n`.
- Purpose: local markdown workspace similar to Obsidian.
- Storage: all user files are on disk in `data/`.
- Main UI:
  - left: file tree with DnD, create/rename/delete.
  - right: editor / image preview / folder browser.
- Supported locales: `en` (default), `ru`.

## 2) Key Runtime Flows

1. App mounts `app/pages/index.vue` -> renders `EditoroWorkspace`.
2. `useEditoro()` (`app/composables/useEditoro.ts`) returns grouped API.
3. `useEditoroState()` composes stores + lifecycle + view model + actions.
4. Tree and route query `?file=...` are synchronized in `useEditoroFileSelection`.
5. Markdown content autosaves via editor persistence composable.
6. Image uploads go to sibling `.media` folder of current markdown file.

## 3) Architecture (Current)

### UI Components

- `app/components/editoro/Workspace.vue`: top-level layout composition.
- `app/components/editoro/Sidebar.vue`: tree panel + settings modal.
- `app/components/editoro/MainHeader.vue`: file/folder title + actions + save status.
- `app/components/editoro/MainContent.vue`: folder browser / image preview / editor.
- `app/components/editoro/Modals.vue`: create/rename/delete dialogs.

### Stores

- `app/stores/editoroTree.ts`: tree state, loading, selection, DnD.
- `app/stores/editoroEditor.ts`: editor content, mode, save state, upload API.
- `app/stores/editoroPreferences.ts`: locale, color mode, hidden entries.
- `app/stores/editoroUi.ts`: modals and other UI control state.

### Composable Layers

- `app/composables/useEditoroState.ts`: orchestration root.
- `app/composables/useEditoroContext.ts`: internal wiring of stores/actions/view-model.
- `app/composables/useEditoroLifecycle.ts`: SSR+mount hooks/watchers.
- `app/composables/useEditoroFileSelection.ts`: selected node <-> route file query logic.
- `app/composables/useEditoroEntryActions.ts`: create/rename/delete flows.
- `app/composables/useEditoroViewModel.ts`: computed UI-facing derived data.
- `app/composables/api/*`: builders of final public grouped API.
- `app/composables/workspace/*Bindings.ts`: binds state to component props/events.

### Server

- `server/utils/data-storage.ts`: all filesystem operations and invariants.
- `server/api/files/*.ts`: tree/content/create/move/delete/image/media endpoints.
- `app/services/files-api.ts`: client API wrappers for server endpoints.

## 4) Critical Invariants (Do Not Break)

1. Security/path safety:
   - Any filesystem path must remain inside `data/`.
   - Use existing helpers (`normalizeRelativePath`, `resolveDataPath`).
2. Markdown editing:
   - Only markdown files are editable/savable (`.md`).
   - Non-markdown files show unsupported format or preview (for images).
3. Route sync:
   - Opened file must be reflected in `?file=...`.
   - On refresh, restore selection if file exists; clear query if invalid.
4. Tree UX:
   - Preserve expanded paths on reload.
   - Keep selected node and ancestors expanded when possible.
5. Media handling:
   - Uploaded images go to `<markdown-folder>/.media`.
   - On markdown save, remove orphan media files.
   - Remove empty `.media` directories after cleanup.
6. SSR/hydration:
   - Avoid client-only state mismatches that cause hydration warnings.
   - Keep lifecycle hooks inside proper setup/composable execution flow.

## 5) File Map for Common Tasks

- Change tree behavior/icons: `server/utils/data-storage.ts`, `Sidebar.vue`, `app/utils/editoro-tree.ts`.
- Change selection/query behavior: `useEditoroFileSelection.ts`, `useEditoroLifecycle.ts`.
- Change autosave/status: `useEditoroEditorPersistence.ts`, `useEditoroEditorStatus.ts`, `MainHeader.vue`.
- Change image upload/DnD in editor: `useEditoroMainContentMedia.ts`, `useEditoroEditorUploads.ts`, `server/api/files/image.post.ts`.
- Change i18n/settings: `editoroPreferences.ts`, `nuxt.config.ts`, `i18n/locales/*.json`.

## 6) Development Commands

Use `pnpm` in normal environment:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## 7) Change Checklist for Agents

Before coding:
- Identify impacted layer(s): component, store, composable, server API.
- Prefer existing abstractions over adding logic to `Workspace.vue`.

While coding:
- Keep strict TypeScript typing; avoid `any`.
- In composables/helpers, keep comments in English.
- Preserve existing public API shape of `useEditoro()` unless refactor requires migration everywhere.

After coding:
- Run `lint` + `typecheck`.
- Manually verify:
  - tree selection and expansion,
  - route `?file=...` restore on refresh,
  - create/rename/delete for files and folders,
  - markdown autosave indicator behavior,
  - image upload, preview, and orphan cleanup.

## 8) Preferred Refactoring Direction

- Keep `Workspace.vue` declarative (bindings only).
- Move heavy logic from components to composables.
- Keep stores focused:
  - tree-only concerns in tree store/composables,
  - editor-only concerns in editor store/composables,
  - preferences-only concerns in preferences store.
- Keep server filesystem logic centralized in `data-storage.ts`.

## 9) Notes About Existing UX Decisions

- Default locale is English.
- Hidden entries toggle exists and hidden folders use a different folder icon.
- Sidebar width is persisted and restored.
- Rich/raw is handled as a toggle mode.
- For folders, right panel shows folder contents with navigation to parent.

