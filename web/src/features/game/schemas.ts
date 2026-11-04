import { z } from "zod";

// One Weitwurf-Bestenliste row: a colleague's best round in that window.
export const GameScoreEntrySchema = z.object({
  rank: z.number().int(),
  userId: z.string(),
  displayName: z.string(),
  initials: z.string(),
  avatarColorHex: z.string(),
  score: z.number().int(),
  hits: z.number().int(),
  isMe: z.boolean(),
});

// GET /api/game/leaderboard — today's Döner-Tag (top 10, empty without a day
// today) and all time (top 5).
export const GameLeaderboardSchema = z.object({
  today: z.array(GameScoreEntrySchema),
  allTime: z.array(GameScoreEntrySchema),
});

// POST /api/game/scores — the stored round.
export const SubmittedGameScoreSchema = z.object({
  id: z.string(),
  score: z.number().int(),
  isPersonalBest: z.boolean(),
});
