import { getQuery } from 'h3'
import { requireMoveJob } from '../../utils/move-jobs'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const jobId = String(query?.jobId || '')
  const job = requireMoveJob(jobId)

  return {
    ok: true,
    state: job.state,
    progress: job.progress,
    stage: job.stage,
    path: job.path,
    sharedAttachmentCount: job.sharedAttachmentCount,
    error: job.error
  }
})
