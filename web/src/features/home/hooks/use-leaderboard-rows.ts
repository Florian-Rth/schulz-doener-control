import { useState } from "react";
import type { LeaderboardRow } from "../types";

interface LeaderboardRowsState {
  rows: LeaderboardRow[];
  isExpanded: boolean;
  /** True when collapsing actually hides someone — otherwise no expander is needed. */
  canExpand: boolean;
  total: number;
  toggle: () => void;
}

// Collapsed: the top 3 (medalled) plus the caller's own row when they sit
// outside the podium (mock parity — the highlighted "4." row).
const podiumRows = (rows: readonly LeaderboardRow[]): LeaderboardRow[] => {
  const top = rows.filter((row) => row.medal !== null);
  const me = rows.find((row) => row.isMe);
  if (me !== undefined && !top.some((row) => row.userId === me.userId)) {
    return [...top, me];
  }
  return top;
};

// The Bestenliste shows the podium by default and the full field on demand.
export const useLeaderboardRows = (allRows: readonly LeaderboardRow[]): LeaderboardRowsState => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const podium = podiumRows(allRows);
  const canExpand = podium.length < allRows.length;

  return {
    rows: isExpanded ? [...allRows] : podium,
    isExpanded,
    canExpand,
    total: allRows.length,
    toggle: (): void => {
      setIsExpanded((previous) => !previous);
    },
  };
};
