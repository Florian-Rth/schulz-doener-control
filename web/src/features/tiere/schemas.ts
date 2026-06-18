import { z } from "zod";

// GET /api/tiere — the Döner-Tiere catalog. The list is returned in priority
// order; exactly one entry carries `isMine` (the caller's computed tier). Copy
// (emoji/name/tagline) is single-sourced from the backend tier service.
export const TierCatalogEntrySchema = z.object({
  emoji: z.string(),
  name: z.string(),
  tagline: z.string(),
  isMine: z.boolean(),
});

export const TierCatalogSchema = z.array(TierCatalogEntrySchema);
