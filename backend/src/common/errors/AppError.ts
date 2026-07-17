import { ERROR_CODES } from "@/shared/constants";
import type { ErrorDetail } from "@/shared/types";

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: ErrorDetail[];

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: ErrorDetail[]
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "AppError";
  }

  static validation(message: string, details?: ErrorDetail[]): AppError {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
  }

  static unauthenticated(message: string = "Authentication required"): AppError {
    return new AppError(ERROR_CODES.UNAUTHENTICATED, message, 401);
  }

  static forbidden(message: string = "Access denied"): AppError {
    return new AppError(ERROR_CODES.FORBIDDEN, message, 403);
  }

  static notFound(message: string = "Resource not found"): AppError {
    return new AppError(ERROR_CODES.NOT_FOUND, message, 404);
  }

  static conflict(message: string, details?: ErrorDetail[]): AppError {
    return new AppError(ERROR_CODES.CONFLICT, message, 409, details);
  }

  static badRequest(message: string, details?: ErrorDetail[]): AppError {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
  }

  static internal(message: string = "An unexpected error occurred"): AppError {
    return new AppError(ERROR_CODES.INTERNAL_ERROR, message, 500);
  }

  static provider(message: string): AppError {
    return new AppError(ERROR_CODES.PROVIDER_ERROR, message, 502);
  }
}
