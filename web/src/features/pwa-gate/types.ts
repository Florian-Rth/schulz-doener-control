import type { z } from "zod";
import type { ClientConfigSchema, GateSearchSchema } from "./schemas";

export type ClientConfig = z.infer<typeof ClientConfigSchema>;
export type GateSearch = z.infer<typeof GateSearchSchema>;

// Re-exported so the feature's hooks/components reference the platform type from one place.
export type { InstallPlatform } from "@/lib/push";
// Re-exported so consumers reference the registration-mode wire type from one place.
export type { RegistrationModeValue } from "./schemas";

// The gate's decision for the authenticated app shell: wait while the kill-switch config resolves,
// render the app, or replace it with the install guide.
export type GateDecision = "loading" | "allow" | "guide";
