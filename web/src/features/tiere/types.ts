import type { z } from "zod";
import type { TierCatalogEntrySchema, TierCatalogSchema } from "./schemas";

export type TierCatalogEntry = z.infer<typeof TierCatalogEntrySchema>;
export type TierCatalog = z.infer<typeof TierCatalogSchema>;
