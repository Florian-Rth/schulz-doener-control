import type { z } from "zod";
import type { DashboardSchema, PaymentHistorySchema, ReceivablesSchema } from "./schemas";

export type Dashboard = z.infer<typeof DashboardSchema>;
export type DashboardStats = Dashboard["stats"];
export type DashboardTier = Dashboard["tier"];
export type DashboardLeaderboard = Dashboard["leaderboard"];
export type LeaderboardRow = DashboardLeaderboard["rows"][number];
export type DashboardDay = Dashboard["day"];
export type DayAbholer = NonNullable<DashboardDay["abholer"]>;
export type OrderRow = DashboardDay["orders"][number];
export type PrintLine = DashboardDay["printLines"][number];
export type PrintSummaryLine = DashboardDay["printSummary"][number];
export type DashboardDebts = Dashboard["debts"];
export type DebtRow = DashboardDebts["rows"][number];

export type PaymentHistory = z.infer<typeof PaymentHistorySchema>;
export type PaymentHistoryRow = PaymentHistory["payments"][number];

export type Receivables = z.infer<typeof ReceivablesSchema>;
export type ReceivableRow = Receivables["rows"][number];
