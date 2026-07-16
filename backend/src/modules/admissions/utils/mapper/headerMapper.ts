import { prisma } from "@/infrastructure/database/prisma"
import type { ColumnMapping } from "../../types"

const DEFAULT_MAPPINGS: Record<string, string> = {
  "adm no": "admissionNumber",
  "admission number": "admissionNumber",
  "admission no": "admissionNumber",
  "admno": "admissionNumber",
  "admission": "admissionNumber",
  "admission_no": "admissionNumber",
  "first name": "firstName",
  "firstname": "firstName",
  "given name": "firstName",
  "middle name": "middleName",
  "middlename": "middleName",
  "middle": "middleName",
  "last name": "lastName",
  "lastname": "lastName",
  "surname": "lastName",
  "family name": "lastName",
  "gender": "gender",
  "sex": "gender",
  "date of birth": "dateOfBirth",
  "dob": "dateOfBirth",
  "birth date": "dateOfBirth",
  "birthdate": "dateOfBirth",
  "stream": "stream",
  "class": "className",
  "grade": "className",
  "form": "className",
  "academic year": "academicYearName",
  "year": "academicYearName",
  "term": "termName",
  "guardian name": "guardianName",
  "parent name": "guardianName",
  "guardian": "guardianName",
  "parent": "guardianName",
  "guardian phone": "guardianPhone",
  "parent phone": "guardianPhone",
  "phone": "guardianPhone",
  "mobile": "guardianPhone",
  "telephone": "guardianPhone",
  "guardian email": "guardianEmail",
  "parent email": "guardianEmail",
  "email": "guardianEmail",
  "relationship": "relationship",
  "relation": "relationship",
  "primary guardian": "isPrimaryGuardian",
  "primary": "isPrimaryGuardian",
  "medical": "medicalInfo",
  "medical info": "medicalInfo",
  "medical information": "medicalInfo",
  "transport": "transport",
  "dormitory": "dormitory",
  "boarding": "dormitory",
  "remarks": "remarks",
  "previous balance": "previousBalance",
  "balance": "previousBalance",
  "fee balance": "previousBalance",
  "scholarship": "scholarship",
  "status": "status",
  "student status": "status",
}

const SIMILARITY_THRESHOLD = 0.6

export function normalizeHeaders(rawHeaders: string[]): ColumnMapping[] {
  return rawHeaders.map((header) => {
    const cleaned = header.trim().toLowerCase()
    const exact = DEFAULT_MAPPINGS[cleaned]
    if (exact) {
      return { source: header, target: exact, confidence: 1, manual: false }
    }

    let bestMatch: string | null = null
    let bestScore = 0

    for (const [key, target] of Object.entries(DEFAULT_MAPPINGS)) {
      const score = similarity(cleaned, key)
      if (score > bestScore) {
        bestScore = score
        bestMatch = target
      }
    }

    const confidence = bestScore >= SIMILARITY_THRESHOLD ? Math.round(bestScore * 100) / 100 : 0
    return {
      source: header,
      target: bestMatch ?? cleaned,
      confidence,
      manual: false,
    }
  })
}

export async function saveColumnMapping(
  schoolId: string,
  mappings: ColumnMapping[]
): Promise<void> {
  const existing = await prisma.importSession.findFirst({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })
}

export function buildTargetToSourceMap(
  mappings: ColumnMapping[]
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const m of mappings) {
    map[m.target] = m.source
  }
  return map
}

function similarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a

  if (longer.length === 0) return 1

  const editDist = levenshteinDistance(longer, shorter)
  return 1 - editDist / longer.length
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost
      )
    }
  }

  return matrix[b.length]![a.length]!
}
