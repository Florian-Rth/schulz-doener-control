import { homeCopy } from "../copy";
import type { DashboardDay } from "../types";

export interface DayStatus {
  /** Personal status eyebrow line derived from the running day. */
  statusLine: string;
  /** True once the caller has placed their own order on this day. */
  iHaveOrdered: boolean;
  /** True while there is no designated Abholer yet. */
  hasNoCollector: boolean;
  /** True when a foreign Abholer is set and the caller could take over. */
  canTakeOver: boolean;
  /** True when the running day has no orders at all. */
  isEmpty: boolean;
}

// Pure presentation-state derivation for the open-day card. Keeps the boolean
// branches + the German status eyebrow out of the JSX.
export const useDayStatus = (day: DashboardDay): DayStatus => {
  const iHaveOrdered = day.orders.some((order) => order.isMine);

  let statusLine: string;
  if (!day.iCanStillOrder) {
    statusLine = homeCopy.statusOrderingClosed;
  } else if (iHaveOrdered) {
    statusLine = homeCopy.statusOrderingInfo;
  } else {
    statusLine = homeCopy.statusOrderingMissing;
  }

  return {
    statusLine,
    iHaveOrdered,
    hasNoCollector: day.abholer === null,
    canTakeOver: day.abholer !== null && !day.amICollector,
    isEmpty: day.orders.length === 0,
  };
};
