import { prisma } from "@/infrastructure/database/prisma"

/**
 * Deactivates Academic Years and Terms whose endDate has passed.
 * This job runs on application startup and can also be wired to a cron scheduler.
 */
export async function deactivateExpiredAcademicPeriods() {
  const now = new Date()

  const expiredYearsResult = await prisma.academicYear.updateMany({
    where: {
      active: true,
      endDate: { lt: now },
      deletedAt: null,
    },
    data: { active: false },
  })

  const expiredTermsResult = await prisma.term.updateMany({
    where: {
      active: true,
      endDate: { lt: now },
      deletedAt: null,
    },
    data: { active: false },
  })

  if (expiredYearsResult.count > 0 || expiredTermsResult.count > 0) {
    console.log(
      `[AcademicDeactivator] Deactivated ${expiredYearsResult.count} academic year(s) and ${expiredTermsResult.count} term(s).`
    )
  }
}

/**
 * Sets up a daily cron schedule using Bun's built-in scheduler.
 * Runs at 00:05 every day to catch midnight rollovers.
 */
export function scheduleAcademicDeactivator() {
  // Run immediately on startup to catch any missed deactivations
  deactivateExpiredAcademicPeriods().catch(console.error)

  // Schedule to run daily at 00:05 AM
  const MS_PER_DAY = 24 * 60 * 60 * 1000

  const now = new Date()
  const nextRun = new Date(now)
  nextRun.setHours(0, 5, 0, 0)
  if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1)

  const msUntilFirstRun = nextRun.getTime() - now.getTime()

  setTimeout(() => {
    deactivateExpiredAcademicPeriods().catch(console.error)
    // Then repeat every 24 hours
    setInterval(() => {
      deactivateExpiredAcademicPeriods().catch(console.error)
    }, MS_PER_DAY)
  }, msUntilFirstRun)

  console.log(`[AcademicDeactivator] Scheduled. Next run: ${nextRun.toISOString()}`)
}
