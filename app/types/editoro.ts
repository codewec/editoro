import type { EditorSuggestionMenuItem, EditorToolbarItem } from '@nuxt/ui'

export type TreeNodeType = 'file' | 'directory'

type BaseTreeNode = {
  label: string
  path: string
  icon?: string
}

export type FileTreeNode = BaseTreeNode & {
  type: 'file'
}

export type DirectoryTreeNode = BaseTreeNode & {
  type: 'directory'
  defaultExpanded: boolean
  children: TreeNode[]
}

export type TreeNode = FileTreeNode | DirectoryTreeNode

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'
export type EditorViewMode = 'rich' | 'raw'
export type CreateTargetType = 'file' | 'directory'
export type SaveStatusColor = 'error' | 'neutral' | 'success'
export type ColorModePreference = 'light' | 'dark' | 'system'
export type SelectOption = {
  label: string
  value: string
}

export type EditorPinnedBadge = {
  key: string
  path: string
  label: string
  icon: string
  isCurrent: boolean
  isPinned: boolean
  canPin: boolean
}
export type Translator = (key: string, params?: Record<string, unknown>) => string

export type EditorToolbarItems = EditorToolbarItem[][]
export type EditorSuggestionItems = EditorSuggestionMenuItem[][]

export type TreeResponse = { items: TreeNode[] }
export type ContentResponse = { content: string }
export type PathResponse = { path: string }
export type ImageUploadResponse = {
  path: string
  url: string
}

export type FileUploadResponse = {
  path: string
  url: string
}

export type MoveStartResponse = {
  ok: boolean
  jobId: string
}

export type MoveJobState = 'running' | 'done' | 'error'

export type MoveStatusResponse = {
  ok: boolean
  state: MoveJobState
  progress: number
  stage: string
  path: string
  sharedAttachmentCount: number
  error: string
}
