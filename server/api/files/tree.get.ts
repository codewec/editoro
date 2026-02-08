import { getQuery } from 'h3'
import { getTree } from '../../utils/data-storage'

function parseBoolean(value: unknown) {
  if (typeof value !== 'string') {
    return false
  }

  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const includeHidden = parseBoolean(query.hidden)
  const items = await getTree(includeHidden)
  return { items }
})
