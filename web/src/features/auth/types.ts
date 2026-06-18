import type { z } from "zod";
import type { LoginFormSchema, LoginResponseSchema, SessionSchema } from "./schemas";

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type LoginForm = z.infer<typeof LoginFormSchema>;

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  status: AuthStatus;
  user: Session | null;
  /** Re-fetches the session (used after login/change-password). */
  refresh: () => Promise<void>;
  /** Clears the session locally (used on logout / hard 401). */
  clear: () => void;
}
