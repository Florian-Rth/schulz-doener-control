import { z } from "zod";

// RFC 7807 ProblemDetails — the backend's error envelope. All fields optional
// because not every error source fills every member; we only rely on what is
// present for messaging.
export const ProblemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

// Typed transport error thrown by the apiClient. Carries the HTTP status and a
// best-effort parsed ProblemDetails so feature hooks can branch on `status`.
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(status: number, problem: ProblemDetails | null) {
    super(problem?.detail ?? problem?.title ?? `Anfrage fehlgeschlagen (${status}).`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}
