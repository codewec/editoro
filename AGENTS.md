# AGENTS.md

This file is a practical operating guide for AI agents working on `editoro`.

## 1. Product Summary

- App type: local-first markdown workspace (Obsidian-like UX).
- Frontend stack: `Nuxt 4`, `Nuxt UI 4`, `Pinia`, `@nuxtjs/i18n`.
- Storage: filesystem-backed content in `data/`.
- Left panel: tree, DnD, create/rename/delete, hidden files toggle.
- Right panel: markdown editor, image preview, folder browser.
- Locales: `en` (default), `ru`.

## 2. Runtime Architecture

### Composition Root

- `app/pages/index.vue` renders `EditoroWorkspace`.
- `app/composables/useEditoro.ts` exposes grouped public API.
- `app/composables/useEditoroState.ts` orchestrates stores + logic.

### Core Components

- `app/components/editoro/Workspace.vue` - page-level layout shell.
- `app/components/editoro/Sidebar.vue` - tree panel and sidebar controls.
- `app/components/editoro/MainHeader.vue` - active item title, pinning, actions.
- `app/components/editoro/MainContent.vue` - editor/browser/preview surface.
- `app/components/editoro/Modals.vue` - create/rename/delete/settings modals.

### Stores

- `app/stores/editoroTree.ts` - tree items, selection, expansion, tree loading.
- `app/stores/editoroEditor.ts` - editor content, view mode, save state, media upload.
- `app/stores/editoroPreferences.ts` - locale, theme, hidden files settings.
- `app/stores/editoroUi.ts` - modal states and workspace UI flags.

### Server Layer

- `server/utils/data-storage.ts` - path validation + filesystem operations.
- `server/api/files/*.ts` - content/tree/create/rename/delete/move/image endpoints.
- `app/services/files-api.ts` - client wrappers for server API.

## 3. Non-Negotiable Invariants

1. Keep all file operations inside `data/`.
2. Preserve `?file=...` sync with selected file.
3. Keep SSR/hydration stable (no client-only mismatch regressions).
4. Preserve tree expansion/selection behavior across refresh/actions.
5. Markdown media rules: uploads go to sibling `.media`.
6. Markdown media rules: orphan media is removed only when truly unreferenced.
7. Markdown media rules: empty `.media` directory should be removed.

## 4. Release and Deployment Surface

- `Dockerfile` builds and runs Nuxt production output.
- `docker-compose.yml` runs app with `./data:/app/data`.
- `deploy/lxc/lxd-editoro.yaml` provides LXD cloud-init profile.
- `deploy/lxc/lxc.conf` provides classic LXC config example.
- CI workflow: `.github/workflows/docker-publish.yml`.
- Push to `main` publishes `ghcr.io/codewec/editoro:dev`.
- Push tag publishes `ghcr.io/codewec/editoro:latest` and `:<tag>`.

## 5. Changelog Workflow

- Tool: `changelogen`.
- Config: `.changelogenrc`.
- Commands: `pnpm changelog`, `pnpm changelog:release`.
- Conventional commits are expected for clean release notes.

## 6. Development Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm changelog
```

## 7. Agent Working Rules

- Prefer existing composables/stores over adding logic into large UI components.
- Keep strict TypeScript typing, avoid `any`.
- Keep comments in English (especially in composables/helpers).
- For refactors, preserve existing public contracts used by `useEditoro()` and workspace bindings.
- Validate critical flows after changes: tree open/select/expand.
- Validate critical flows after changes: route restore on refresh.
- Validate critical flows after changes: create/rename/delete/move.
- Validate critical flows after changes: markdown autosave and status indicator.
- Validate critical flows after changes: image upload/preview/cleanup.
