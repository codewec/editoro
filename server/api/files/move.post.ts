import { createError, readBody } from 'h3'
import { moveEntryWithMarkdownRewrite } from '../../utils/move-markdown'

type MoveBody = {
  from?: string
  to?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<MoveBody>(event)
  const from = String(body?.from || '')
  const to = String(body?.to || '')

  if (!from) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поле from обязательно'
    })
  }

  const result = await moveEntryWithMarkdownRewrite(from, to)
  return {
    ok: true,
    path: result.path,
    sharedAttachmentCount: result.sharedAttachmentCount
  }
})
