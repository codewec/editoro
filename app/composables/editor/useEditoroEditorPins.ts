import type { Ref } from 'vue'

type EditoroEditorPinsOptions = {
  activeFilePath: Ref<string>
}

const PINNED_FILES_COOKIE_KEY = 'editoro.pinned-files'

function parsePinnedFilePaths(raw: string | undefined) {
  if (!raw) {
    return []
  }

  let candidate: unknown = raw

  // Support both direct JSON arrays and accidentally double-stringified values.
  for (let index = 0; index < 2; index += 1) {
    if (Array.isArray(candidate)) {
      return Array.from(new Set(candidate.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)))
    }

    if (typeof candidate !== 'string') {
      return []
    }

    try {
      candidate = JSON.parse(candidate) as unknown
    } catch {
      return []
    }
  }

  return []
}

function areSamePaths(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

/**
 * Handles pinned file tabs persistence and mutation.
 * Used by `app/stores/editoroEditor.ts`.
 */
export function useEditoroEditorPins(options: EditoroEditorPinsOptions) {
  const pinnedFilesCookie = useCookie<string>(PINNED_FILES_COOKIE_KEY, { path: '/', sameSite: 'lax' })
  const pinnedFilePaths = ref<string[]>(parsePinnedFilePaths(pinnedFilesCookie.value))

  function persistPinnedPaths(nextPaths: string[]) {
    pinnedFilePaths.value = nextPaths
    pinnedFilesCookie.value = JSON.stringify(nextPaths)
  }

  watch(pinnedFilesCookie, (rawValue) => {
    const parsed = parsePinnedFilePaths(rawValue)
    if (areSamePaths(parsed, pinnedFilePaths.value)) {
      return
    }

    pinnedFilePaths.value = parsed
  }, { immediate: true })

  function isPinned(path: string) {
    return pinnedFilePaths.value.includes(path)
  }

  function pinFile(path: string) {
    if (!path || isPinned(path)) {
      return
    }

    persistPinnedPaths([...pinnedFilePaths.value, path])
  }

  function unpinFile(path: string) {
    if (!path) {
      return
    }

    const nextPaths = pinnedFilePaths.value.filter(entry => entry !== path)
    if (nextPaths.length === pinnedFilePaths.value.length) {
      return
    }

    persistPinnedPaths(nextPaths)
  }

  function togglePinnedFile(path: string) {
    if (!path) {
      return
    }

    if (isPinned(path)) {
      unpinFile(path)
      return
    }

    pinFile(path)
  }

  function toggleCurrentFilePin() {
    if (!options.activeFilePath.value) {
      return
    }

    togglePinnedFile(options.activeFilePath.value)
  }

  function reconcilePinnedFiles(existingFilePaths: Set<string>) {
    const nextPaths = pinnedFilePaths.value.filter(path => existingFilePaths.has(path))
    if (nextPaths.length === pinnedFilePaths.value.length) {
      return
    }

    persistPinnedPaths(nextPaths)
  }

  return {
    pinnedFilePaths,
    isPinned,
    pinFile,
    unpinFile,
    togglePinnedFile,
    toggleCurrentFilePin,
    reconcilePinnedFiles
  }
}
