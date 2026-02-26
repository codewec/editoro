import { readBody } from 'h3'
import { startMoveJob } from '../../utils/move-jobs'

type MoveStartBody = {
  from?: string
  to?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<MoveStartBody>(event)
  const from = String(body?.from || '')
  const to = String(body?.to || '')

  const job = startMoveJob(from, to)
  return {
    ok: true,
    jobId: job.id
  }
})
