import { createError, readBody } from 'h3'
import { deleteEntry } from '../../utils/data-storage'

type DeleteBody = {
  path?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<DeleteBody>(event)
  const path = String(body?.path || '')

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поле path обязательно'
    })
  }

  await deleteEntry(path)
  return { ok: true }
})
