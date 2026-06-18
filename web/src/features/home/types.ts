import type { z } from "zod";
import type { DashboardSchema } from "./schemas";

export type Dashboard = z.infer<typeof DashboardSchema>;
export type DashboardStats = Dashboard["stats"];
export type DashboardTier = Dashboard["tier"];
export type DashboardLeaderboard = Dashboard["leaderboard"];
export type LeaderboardRow = DashboardLeaderboard["rows"][number];
export type DashboardDay = Dashboard["day"];
export type OrderRow = DashboardDay["orders"][number];
export type DashboardDebts = Dashboard["debts"];
export type DebtRow = DashboardDebts["rows"][number];
