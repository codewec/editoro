import { createError, getQuery } from 'h3'
import { getFileContent } from '../../utils/data-storage'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = String(query.path || '')

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Параметр path обязателен'
    })
  }

  const content = await getFileContent(path)
  return { content }
})
