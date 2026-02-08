import { createError, getQuery, setHeader } from 'h3'
import { getMediaFile } from '../../utils/data-storage'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = String(query.path || '')

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Параметр path обязателен'
    })
  }

  const media = await getMediaFile(path)
  setHeader(event, 'content-type', media.contentType)
  setHeader(event, 'cache-control', 'public, max-age=3600')

  return media.data
})
