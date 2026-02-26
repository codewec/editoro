import { createError, readMultipartFormData } from 'h3'
import { saveAttachmentForMarkdownFile } from '../../utils/data-storage'

type MultipartField = {
  name?: string
  filename?: string
  data: Uint8Array
}

function getStringValue(field?: MultipartField) {
  if (!field) {
    return ''
  }

  return Buffer.from(field.data).toString('utf8').trim()
}

export default defineEventHandler(async (event) => {
  const form = (await readMultipartFormData(event)) as MultipartField[] | undefined

  if (!form || form.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Тело multipart/form-data обязательно'
    })
  }

  const pathField = form.find(field => field.name === 'path')
  const fileField = form.find(field => field.name === 'file' && field.filename)
  const markdownPath = getStringValue(pathField)

  if (!markdownPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поле path обязательно'
    })
  }

  if (!fileField) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поле file обязательно'
    })
  }

  const storedPath = await saveAttachmentForMarkdownFile(
    markdownPath,
    fileField.filename || 'file',
    fileField.data
  )

  return {
    ok: true,
    path: storedPath,
    url: `/api/files/file?path=${encodeURIComponent(storedPath)}`
  }
})
