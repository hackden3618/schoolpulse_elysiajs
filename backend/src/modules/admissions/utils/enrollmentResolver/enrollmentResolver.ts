import { prisma } from "@/infrastructure/database/prisma"
import type { ValidatedRow, ResolvedEnrollmentInfo } from "../../types"

export class EnrollmentResolver {
  private schoolId: string

  constructor(schoolId: string) {
    this.schoolId = schoolId
  }

  async resolveEnrollments(rows: ValidatedRow[]): Promise<ValidatedRow[]> {
    const [classes, classInstances, academicYears, terms] = await Promise.all([
      prisma.class.findMany({
        where: { schoolId: this.schoolId, deletedAt: null },
        select: { id: true, name: true },
      }),
      prisma.classInstance.findMany({
        where: { schoolId: this.schoolId, deletedAt: null },
        select: { id: true, streamName: true, classId: true },
      }),
      prisma.academicYear.findMany({
        where: { schoolId: this.schoolId, deletedAt: null },
        select: { id: true, name: true, active: true },
      }),
      prisma.term.findMany({
        where: { schoolId: this.schoolId, deletedAt: null },
        select: { id: true, name: true, academicYearId: true, active: true },
      }),
    ])

    const classMap = new Map(classes.map((c) => [c.name.toLowerCase(), c]))
    const streamMap = new Map(classInstances.map((ci) => [ci.streamName.toLowerCase(), ci]))
    const yearMap = new Map(academicYears.map((ay) => [ay.name.toLowerCase(), ay]))
    const termMap = new Map(terms.map((t) => [t.name.toLowerCase(), t]))

    const activeYear = academicYears.find((ay) => ay.active)
    const activeTerm = terms.find((t) => t.active)

    return rows.map((row) => {
      let enrollmentInfo: ResolvedEnrollmentInfo = {}

      const className = row.data.className?.toLowerCase().trim()
      const streamName = row.data.stream?.toLowerCase().trim()
      const yearName = row.data.academicYearName?.toLowerCase().trim()
      const termName = row.data.termName?.toLowerCase().trim()

      const matchedClass = className ? classMap.get(className) : undefined
      const matchedYear = yearName ? yearMap.get(yearName) : activeYear
      const matchedTerm = termName ? termMap.get(termName) : activeTerm

      let classInstanceId: string | undefined

      if (matchedClass && matchedYear) {
        const matchingStream = streamName
          ? classInstances.find(
              (ci) =>
                ci.streamName.toLowerCase() === streamName &&
                ci.classId === matchedClass.id
            )
          : classInstances.find(
              (ci) => ci.classId === matchedClass.id
            )

        if (matchingStream) {
          classInstanceId = matchingStream.id
          enrollmentInfo = {
            ...enrollmentInfo,
            classInstanceId: matchingStream.id,
            classInstanceName: `${matchedClass.name} ${matchingStream.streamName}`,
          }
        }
      }

      enrollmentInfo = {
        ...enrollmentInfo,
        academicYearId: matchedYear?.id,
        academicYearName: matchedYear?.name,
        termId: matchedTerm?.id,
        termName: matchedTerm?.name,
      }

      return { ...row, enrollmentInfo }
    })
  }
}
