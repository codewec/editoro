import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { assertMoveSource, moveEntryWithMarkdownRewrite } from './move-markdown'

export type MoveJobState = 'running' | 'done' | 'error'

export type MoveJob = {
  id: string
  from: string
  to: string
  state: MoveJobState
  progress: number
  stage: string
  path: string
  sharedAttachmentCount: number
  error: string
  createdAt: number
}

const jobs = new Map<string, MoveJob>()
const JOB_TTL_MS = 1000 * 60 * 10

function createJob(from: string, to: string): MoveJob {
  return {
    id: randomUUID(),
    from,
    to,
    state: 'running',
    progress: 0,
    stage: 'Queued',
    path: '',
    sharedAttachmentCount: 0,
    error: '',
    createdAt: Date.now()
  }
}

function cleanupExpiredJobs() {
  const now = Date.now()
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(id)
    }
  }
}

export function getMoveJob(jobId: string) {
  cleanupExpiredJobs()
  return jobs.get(jobId)
}

export function startMoveJob(from: string, to: string) {
  assertMoveSource(from)
  const job = createJob(from, to)
  jobs.set(job.id, job)

  queueMicrotask(async () => {
    try {
      const result = await moveEntryWithMarkdownRewrite(from, to, (progress, stage) => {
        job.progress = progress
        job.stage = stage
      })

      job.path = result.path
      job.sharedAttachmentCount = result.sharedAttachmentCount
      job.state = 'done'
      job.progress = 100
      job.stage = 'Done'
    } catch (error) {
      job.state = 'error'
      job.stage = 'Failed'
      if (error instanceof Error) {
        job.error = error.message
      } else {
        job.error = 'Move operation failed'
      }
    }
  })

  return job
}

export function requireMoveJob(jobId: string) {
  const job = getMoveJob(jobId)
  if (!job) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Move job not found'
    })
  }

  return job
}
