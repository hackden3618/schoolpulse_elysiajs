export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  meta: {
    requestId: string;
    schoolId?: string;
  };
}

export interface SuccessResponse<T> {
  data: T;
  meta: {
    requestId: string;
    schoolId?: string;
  };
}

export interface ErrorDetail {
  field?: string;
  issue: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    requestId: string;
  };
}

export interface SortParam {
  field: string;
  direction: "asc" | "desc";
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: SortParam[];
  filter?: Record<string, string>;
}
