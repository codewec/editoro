import { createError, readBody } from 'h3'
import { createDirectory, createMarkdownFile } from '../../utils/data-storage'

type CreateBody = {
  type?: 'file' | 'directory'
  path?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateBody>(event)
  const type = body?.type
  const path = String(body?.path || '')

  if (!type || !['file', 'directory'].includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поле type должно быть file или directory'
    })
  }

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поле path обязательно'
    })
  }

  if (type === 'directory') {
    await createDirectory(path)
    return { ok: true, path }
  }

  const filePath = await createMarkdownFile(path)
  return { ok: true, path: filePath }
})
