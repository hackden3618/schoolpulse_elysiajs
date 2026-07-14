import { PAGINATION_DEFAULTS } from "@/shared/constants";
import type { PaginationParams } from "@/shared/types";

export function parsePagination(query: {
  page?: string | number;
  pageSize?: string | number;
}): PaginationParams {
  const page = Math.max(1, Number(query.page) || PAGINATION_DEFAULTS.page);
  const pageSize = Math.min(
    PAGINATION_DEFAULTS.maxPageSize,
    Math.max(1, Number(query.pageSize) || PAGINATION_DEFAULTS.pageSize)
  );
  return { page, pageSize };
}

export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export { calculateGsm7Segments, segmentCostTable } from "./gsm7";
export type { Gsm7SegmentInfo } from "./gsm7";
