import type { ContentResponse, CreateTargetType, FileUploadResponse, ImageUploadResponse, PathResponse, TreeResponse } from '~/types/editoro'

export async function fetchTree(includeHidden: boolean) {
  return await $fetch<TreeResponse>('/api/files/tree', {
    query: {
      hidden: includeHidden ? '1' : '0'
    }
  })
}

export async function fetchFileContent(path: string) {
  return await $fetch<ContentResponse>('/api/files/content', { query: { path } })
}

export async function saveFileContent(path: string, content: string) {
  return await $fetch('/api/files/content', { method: 'PUT', body: { path, content } })
}

export async function createEntryApi(type: CreateTargetType, path: string) {
  return await $fetch<PathResponse>('/api/files/create', {
    method: 'POST',
    body: { type, path }
  })
}

export async function moveEntryApi(from: string, to: string) {
  return await $fetch<PathResponse>('/api/files/move', {
    method: 'POST',
    body: { from, to }
  })
}

export async function deleteEntryApi(path: string) {
  return await $fetch('/api/files/delete', { method: 'POST', body: { path } })
}

export async function uploadImageApi(path: string, file: File) {
  const formData = new FormData()
  formData.set('path', path)
  formData.set('file', file)

  return await $fetch<ImageUploadResponse>('/api/files/image', {
    method: 'POST',
    body: formData
  })
}

export async function uploadFileApi(path: string, file: File) {
  const formData = new FormData()
  formData.set('path', path)
  formData.set('file', file)

  return await $fetch<FileUploadResponse>('/api/files/file', {
    method: 'POST',
    body: formData
  })
}
