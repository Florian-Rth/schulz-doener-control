import type { z } from "zod";
import type {
  GameLeaderboardSchema,
  GameScoreEntrySchema,
  SubmittedGameScoreSchema,
} from "./schemas";

export type GameScoreEntry = z.infer<typeof GameScoreEntrySchema>;
export type GameLeaderboard = z.infer<typeof GameLeaderboardSchema>;
export type SubmittedGameScore = z.infer<typeof SubmittedGameScoreSchema>;

export interface GameRoundResult {
  score: number;
  hits: number;
  misses: number;
}
