import { createError, getQuery, setHeader } from 'h3'
import { getStoredFile } from '../../utils/data-storage'

function escapeFileName(value: string) {
  return value.replaceAll('"', '\\"')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = String(query.path || '')

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Параметр path обязателен'
    })
  }

  const file = await getStoredFile(path)
  setHeader(event, 'content-type', file.contentType)
  setHeader(event, 'content-disposition', `attachment; filename="${escapeFileName(file.fileName)}"`)
  setHeader(event, 'cache-control', 'no-store')

  return file.data
})
