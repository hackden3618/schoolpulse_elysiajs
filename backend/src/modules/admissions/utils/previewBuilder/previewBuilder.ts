import type { ValidatedRow, PreviewData, PreviewSummary } from "../../types"

export class PreviewBuilder {
  buildPreview(rows: ValidatedRow[]): PreviewData {
    const summary = this.buildSummary(rows)

    const sorted = [...rows].sort((a, b) => {
      const order = { error: 0, warning: 1, valid: 2, skipped: 3 }
      return (order[a.status] ?? 0) - (order[b.status] ?? 0)
    })

    return { summary, rows: sorted }
  }

  private buildSummary(rows: ValidatedRow[]): PreviewSummary {
    const validStudents = rows.filter((r) => r.status === "valid").length
    const warnings = rows.filter((r) => r.status === "warning").length
    const errors = rows.filter((r) => r.status === "error").length

    const guardianSet = new Set<string>()
    let duplicateGuardians = 0
    let newGuardians = 0
    let existingGuardians = 0

    for (const row of rows) {
      if (!row.guardianInfo) continue
      const key = row.guardianInfo.phone
      if (guardianSet.has(key)) {
        duplicateGuardians++
      } else {
        guardianSet.add(key)
        if (row.guardianInfo.isExisting) {
          existingGuardians++
        } else {
          newGuardians++
        }
      }
    }

    return {
      totalRows: rows.length,
      validStudents,
      warnings,
      errors,
      duplicateGuardians,
      newGuardians,
      existingGuardians,
      studentsToImport: validStudents,
      studentsSkipped: errors,
    }
  }
}
