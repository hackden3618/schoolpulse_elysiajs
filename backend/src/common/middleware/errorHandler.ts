import { AppError } from "@/common/errors";
import { error } from "@/common/responses";

export function errorHandler(app: any): any {
  return app.onError(({ code, error: err, set }: any) => {
    if (err instanceof AppError) {
      set.status = err.statusCode;
      return error(err.code, err.message, err.details);
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return error("VALIDATION_ERROR", "Request validation failed");
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return error("NOT_FOUND", "Route not found");
    }

    console.error("Unhandled error:", err);
    set.status = 500;
    return error("INTERNAL_ERROR", "An unexpected error occurred");
  });
}
