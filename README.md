# Editoro

Editoro is a local-first markdown workspace inspired by Obsidian, built with Nuxt 4 and Nuxt UI 4.  
It stores project files directly on disk in the `data/` directory and provides a two-panel experience:
file tree on the left, editor/browser on the right.

## Features

- Full-height split workspace (resizable sidebar with persisted width).
- File tree with create/rename/delete, drag-and-drop move, hidden files toggle.
- Markdown editor for `.md`/`.markdown` files.
- Image preview for image files.
- Folder browser view for directories.
- Rich markdown editor with slash menu, toolbar, link popover, image upload.
- Raw markdown mode toggle.
- Auto-save with status indicator.
- Pinned items (files/folders/images) persisted in cookies.
- Route sync via `?file=...` with restore on refresh.
- i18n support (`en` default, `ru`) and color mode preferences.

## Quick Start (Docker)

Run a prebuilt image from GHCR:

```bash
docker run --name editoro \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NUXT_PUBLIC_SITE_URL=http://localhost:3000 \
  ghcr.io/codewec/editoro:dev
```

Then open `http://localhost:3000`.

Run with Docker Compose:

```bash
docker compose up -d
```

LXD quick start (example):

```bash
lxc profile create editoro
lxc profile edit editoro < deploy/lxc/lxd-editoro.yaml
lxc launch images:ubuntu/24.04 editoro --profile default --profile editoro
```

## Technical Info

### Stack

- Nuxt 4
- Nuxt UI 4
- Pinia
- @nuxtjs/i18n
- Tailwind CSS 4
- TypeScript + ESLint

### Storage Model

- All user content is stored under `data/`.
- Markdown media is stored in sibling `.media` directories.
- Server-side filesystem logic is centralized in `server/utils/data-storage.ts`.

### Local Development

```bash
pnpm install
pnpm dev
```

### Validation

```bash
pnpm lint
pnpm typecheck
```

### Production Build

```bash
pnpm build
pnpm preview
```

### Changelog (changelogen)

- Generate/update changelog from commits:

```bash
pnpm changelog
```

- Prepare release changelog:

```bash
pnpm changelog:release
```

### CI/CD (GitHub Actions)

- Push to `main` builds and publishes Docker image to `ghcr.io` with tag `dev`.
- Push git tag (for example `v1.2.0`) builds and publishes Docker image with tags `latest` and `<git-tag>`.

### Container Files

- `Dockerfile` - production image for Nuxt server output.
- `docker-compose.yml` - local container orchestration.
- `deploy/lxc/lxd-editoro.yaml` - LXD profile/cloud-init example.
- `deploy/lxc/lxc.conf` - classic LXC config example.
