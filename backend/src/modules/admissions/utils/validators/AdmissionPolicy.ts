import { prisma } from "@/infrastructure/database/prisma"
import { normalizePhone } from "@/common/validation"
import type { ParsedRow, ValidatedRow, NormalizedRow, ValidationError } from "../../types"

const VALID_RELATIONSHIPS = [
  "father", "mother", "sibling", "emergency", "sponsor",
  "legal_guardian", "step_parent", "relative", "other",
]

const VALID_GENDERS = ["male", "female"]

export class AdmissionPolicy {
  private schoolId: string
  private existingAdmissionNumbers: Set<string>
  private existingClasses: Map<string, { id: string; name: string }>
  private existingStreams: Map<string, { id: string; streamName: string; classId: string }>
  private existingAcademicYears: Map<string, { id: string; name: string; active: boolean }>
  private existingTerms: Map<string, { id: string; name: string; academicYearId: string; active: boolean }>

  private constructor(
    schoolId: string,
    existingAdmissionNumbers: Set<string>,
    existingClasses: Map<string, { id: string; name: string }>,
    existingStreams: Map<string, { id: string; streamName: string; classId: string }>,
    existingAcademicYears: Map<string, { id: string; name: string; active: boolean }>,
    existingTerms: Map<string, { id: string; name: string; academicYearId: string; active: boolean }>
  ) {
    this.schoolId = schoolId
    this.existingAdmissionNumbers = existingAdmissionNumbers
    this.existingClasses = existingClasses
    this.existingStreams = existingStreams
    this.existingAcademicYears = existingAcademicYears
    this.existingTerms = existingTerms
  }

  static async create(schoolId: string): Promise<AdmissionPolicy> {
    const [students, classes, classInstances, academicYears, terms] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId, deletedAt: null },
        select: { admissionNumber: true },
      }),
      prisma.class.findMany({
        where: { schoolId, deletedAt: null },
        select: { id: true, name: true },
      }),
      prisma.classInstance.findMany({
        where: { schoolId, deletedAt: null },
        select: { id: true, streamName: true, classId: true },
      }),
      prisma.academicYear.findMany({
        where: { schoolId, deletedAt: null },
        select: { id: true, name: true, active: true },
      }),
      prisma.term.findMany({
        where: { schoolId, deletedAt: null },
        select: { id: true, name: true, academicYearId: true, active: true },
      }),
    ])

    return new AdmissionPolicy(
      schoolId,
      new Set(students.map((s) => s.admissionNumber.toLowerCase())),
      new Map(classes.map((c) => [c.name.toLowerCase(), { id: c.id, name: c.name }])),
      new Map(classInstances.map((ci) => [ci.streamName.toLowerCase(), { id: ci.id, streamName: ci.streamName, classId: ci.classId }])),
      new Map(academicYears.map((ay) => [ay.name.toLowerCase(), { id: ay.id, name: ay.name, active: ay.active }])),
      new Map(terms.map((t) => [t.name.toLowerCase(), { id: t.id, name: t.name, academicYearId: t.academicYearId, active: t.active }]))
    )
  }

  async validateRows(rows: ParsedRow[]): Promise<ValidatedRow[]> {
    const seenAdmissionNumbers = new Set<string>()
    const fileDuplicates = new Set<string>()

    for (const row of rows) {
      const adm = row.normalized.admissionNumber?.toLowerCase().trim()
      if (adm) {
        if (seenAdmissionNumbers.has(adm)) {
          fileDuplicates.add(adm)
        }
        seenAdmissionNumbers.add(adm)
      }
    }

    return rows.map((row) => this.validateRow(row, fileDuplicates))
  }

  private validateRow(row: ParsedRow, fileDuplicates: Set<string>): ValidatedRow {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const data = row.normalized

    this.validateAdmissionNumber(data, errors, fileDuplicates)
    this.validateNames(data, errors)
    this.validateDateOfBirth(data, errors)
    this.validateGender(data, warnings)
    this.validateClass(data, errors)
    this.validateStream(data, warnings)
    this.validateAcademicYear(data, errors)
    this.validateTerm(data, warnings)
    this.validateGuardian(data, errors, warnings)
    this.validatePreviousBalance(data, warnings)

    const status = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid"

    return {
      rowNumber: row.rowNumber,
      data: row.normalized,
      status,
      errors,
      warnings,
    }
  }

  private validateAdmissionNumber(data: NormalizedRow, errors: ValidationError[], fileDuplicates: Set<string>): void {
    const adm = data.admissionNumber?.trim()
    if (!adm) {
      errors.push({ field: "admissionNumber", message: "Admission number is required", suggestedFix: "Provide an admission number for this student." })
      return
    }

    if (fileDuplicates.has(adm.toLowerCase())) {
      errors.push({ field: "admissionNumber", message: `Duplicate admission number "${adm}" found in file`, suggestedFix: "Remove duplicate rows or assign unique admission numbers." })
    }

    if (this.existingAdmissionNumbers.has(adm.toLowerCase())) {
      errors.push({ field: "admissionNumber", message: `Admission number "${adm}" already exists in the school`, suggestedFix: "Use a different admission number or choose the update/replace strategy." })
    }
  }

  private validateNames(data: NormalizedRow, errors: ValidationError[]): void {
    if (!data.firstName?.trim()) {
      errors.push({ field: "firstName", message: "First name is required", suggestedFix: "Provide the student's first name." })
    }
    if (!data.lastName?.trim()) {
      errors.push({ field: "lastName", message: "Last name is required", suggestedFix: "Provide the student's last name." })
    }
  }

  private validateDateOfBirth(data: NormalizedRow, errors: ValidationError[]): void {
    if (!data.dateOfBirth) return

    const date = new Date(data.dateOfBirth)
    if (isNaN(date.getTime())) {
      errors.push({ field: "dateOfBirth", message: `Invalid date of birth: "${data.dateOfBirth}"`, suggestedFix: "Use a valid date format (e.g., YYYY-MM-DD)." })
      return
    }

    if (date > new Date()) {
      errors.push({ field: "dateOfBirth", message: "Date of birth cannot be in the future", suggestedFix: "Correct the date of birth." })
    }
  }

  private validateGender(data: NormalizedRow, warnings: ValidationError[]): void {
    if (!data.gender?.trim()) return

    const normalized = data.gender.toLowerCase().trim()
    if (!VALID_GENDERS.includes(normalized)) {
      warnings.push({ field: "gender", message: `Unrecognised gender: "${data.gender}". Expected "male" or "female"`, suggestedFix: "Use 'male' or 'female'." })
    }
  }

  private validateClass(data: NormalizedRow, errors: ValidationError[]): void {
    if (!data.className?.trim()) return

    const className = data.className.toLowerCase().trim()
    const classRecord = this.existingClasses.get(className)

    if (!classRecord) {
      errors.push({ field: "className", message: `Class "${data.className}" not found in school`, suggestedFix: "Create the class first or use an existing class name." })
    }
  }

  private validateStream(data: NormalizedRow, warnings: ValidationError[]): void {
    if (!data.stream?.trim()) return

    const streamName = data.stream.toLowerCase().trim()
    const streamRecord = this.existingStreams.get(streamName)

    if (!streamRecord) {
      warnings.push({ field: "stream", message: `Stream "${data.stream}" not found. It will be created if needed.`, suggestedFix: "Create the stream first or use an existing stream name." })
    }
  }

  private validateAcademicYear(data: NormalizedRow, errors: ValidationError[]): void {
    if (!data.academicYearName?.trim()) return

    const yearName = data.academicYearName.toLowerCase().trim()
    const yearRecord = this.existingAcademicYears.get(yearName)

    if (!yearRecord) {
      errors.push({ field: "academicYearName", message: `Academic year "${data.academicYearName}" not found`, suggestedFix: "Create the academic year first." })
    }
  }

  private validateTerm(data: NormalizedRow, warnings: ValidationError[]): void {
    if (!data.termName?.trim()) return

    const termName = data.termName.toLowerCase().trim()
    const termRecord = this.existingTerms.get(termName)

    if (!termRecord) {
      warnings.push({ field: "termName", message: `Term "${data.termName}" not found. It will be resolved to the active term if available.`, suggestedFix: "Create the term first or use an existing term name." })
    }
  }

  private validateGuardian(data: NormalizedRow, errors: ValidationError[], warnings: ValidationError[]): void {
    if (!data.guardianPhone?.trim()) return

    try {
      normalizePhone(data.guardianPhone)
    } catch {
      errors.push({ field: "guardianPhone", message: `Invalid guardian phone number: "${data.guardianPhone}"`, suggestedFix: "Provide a valid phone number with country code (e.g., +254712345678)." })
    }

    if (data.guardianEmail?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.guardianEmail.trim())) {
        errors.push({ field: "guardianEmail", message: `Invalid guardian email: "${data.guardianEmail}"`, suggestedFix: "Provide a valid email address." })
      }
    }

    if (data.relationship?.trim()) {
      const rel = data.relationship.toLowerCase().trim().replace(/ /g, "_")
      if (!VALID_RELATIONSHIPS.includes(rel)) {
        warnings.push({ field: "relationship", message: `Unrecognised relationship: "${data.relationship}"`, suggestedFix: `Use one of: ${VALID_RELATIONSHIPS.join(", ")}` })
      }
    }
  }

  private validatePreviousBalance(data: NormalizedRow, warnings: ValidationError[]): void {
    if (!data.previousBalance?.trim()) return

    const balance = parseFloat(data.previousBalance)
    if (isNaN(balance)) {
      warnings.push({ field: "previousBalance", message: `Invalid previous balance: "${data.previousBalance}"`, suggestedFix: "Provide a valid numeric amount." })
    }
  }
}
