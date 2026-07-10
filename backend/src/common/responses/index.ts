import type { PaginatedResult, SuccessResponse, ErrorResponse } from "@/shared/types";
import { generateRequestId, calculateTotalPages } from "@/shared/utils";

export function success<T>(data: T, schoolId?: string): SuccessResponse<T> {
  return {
    data,
    meta: {
      requestId: generateRequestId(),
      ...(schoolId ? { schoolId } : {}),
    },
  };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  schoolId?: string
): PaginatedResult<T> {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: calculateTotalPages(total, pageSize),
    },
    meta: {
      requestId: generateRequestId(),
      ...(schoolId ? { schoolId } : {}),
    },
  };
}

export function error(
  code: string,
  message: string,
  details?: { field?: string; issue: string }[]
): ErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      requestId: generateRequestId(),
    },
  };
}
