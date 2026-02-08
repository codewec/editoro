import { createError, readBody } from 'h3'
import { saveFileContent } from '../../utils/data-storage'

type SaveFileBody = {
  path?: string
  content?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SaveFileBody>(event)
  const path = String(body?.path || '')
  const content = String(body?.content || '')

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поле path обязательно'
    })
  }

  await saveFileContent(path, content)
  return { ok: true }
})
