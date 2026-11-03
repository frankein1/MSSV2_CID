import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Crons allowed to run before 2 AM Paris, with justification:
// - queuedEmailSender: sub-minute queue processor, no date matching
// - anonymizer: range-based queries only (months scale), 2h offset irrelevant
const ALLOWLISTED_CRONS = new Set(['queuedEmailSender', 'anonymizer'])

type CronJob = { name: string; expression: string; hour: number | null }

function parseCronJobs(source: string) {
  // Match variable declarations like: const at3am = '0 3 * * *'
  const cronVarPattern = /const\s+(\w+)\s*=\s*'([^']+)'/g
  const cronVars = new Map<string, string>()
  for (const match of source.matchAll(cronVarPattern)) {
    cronVars.set(match[1]!, match[2]!)
  }

  // Match new Cron(varName, ..., { ..., name: 'cronName' })
  const cronUsagePattern = /new Cron\(\s*(\w+),[\s\S]*?name:\s*'([^']+)'\s*\}/g
  const jobs: CronJob[] = []
  const unresolved: { varName: string; cronName: string }[] = []

  for (const match of source.matchAll(cronUsagePattern)) {
    const varName = match[1]!
    const cronName = match[2]!
    const expression = cronVars.get(varName)

    if (!expression) {
      unresolved.push({ varName, cronName })
      continue
    }

    const fields = expression.split(' ')
    // 5-field standard cron: min hour day month weekday
    // 6-field cron (with seconds): sec min hour day month weekday
    const hourField = fields.length === 6 ? fields[2] : fields[1]
    const hour =
      hourField && /^\d+$/.test(hourField) ? parseInt(hourField, 10) : null

    jobs.push({ name: cronName, expression, hour })
  }

  return { jobs, unresolved }
}

describe('Scheduler cron hours safety', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf-8')
  const { jobs, unresolved } = parseCronJobs(source)

  it('should resolve all cron variable references', () => {
    expect(
      unresolved,
      `Cron(s) reference undefined variables: ${unresolved.map(u => `${u.cronName} → ${u.varName}`).join(', ')}`
    ).toHaveLength(0)
  })

  it('should find at least one cron job', () => {
    expect(jobs.length).toBeGreaterThan(0)
  })

  it('should not schedule date-sensitive crons before 2 AM Paris', () => {
    const violations = jobs.filter(
      job =>
        !ALLOWLISTED_CRONS.has(job.name) && job.hour !== null && job.hour < 2
    )

    expect(
      violations,
      `Crons running before 2 AM Paris will query the wrong date in summer (CEST). ` +
        `Either move them after 2 AM or add to the allowlist with justification. ` +
        `Violations: ${violations.map(j => `${j.name} (${j.expression})`).join(', ')}`
    ).toHaveLength(0)
  })

  it('should have all allowlisted crons present in the scheduler', () => {
    const cronNames = new Set(jobs.map(j => j.name))
    for (const allowed of ALLOWLISTED_CRONS) {
      expect(
        cronNames.has(allowed),
        `Allowlisted cron '${allowed}' not found in scheduler — remove it from the allowlist`
      ).toBe(true)
    }
  })
})
