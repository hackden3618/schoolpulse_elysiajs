import { AppError } from "@/common/errors";

export function tenantGuard(app: any): any {
  return app.derive(({ params, headers }: any) => {
    const schoolId = params?.schoolId || headers["x-school-id"];
    if (!schoolId) {
      throw AppError.forbidden("School context is required");
    }
    return { schoolId };
  });
}
