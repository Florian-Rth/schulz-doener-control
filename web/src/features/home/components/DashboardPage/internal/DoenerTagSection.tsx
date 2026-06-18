import type { FC } from "react";
import { useDashboardContext } from "../../../dashboard-context";
import { DayClosedCard } from "./DayClosedCard";
import { DayOpenCard } from "./DayOpenCard";

// Picks the OPEN (running-day) card or the CLOSED (open-day CTA) card from the
// dashboard day slice. Pure render-phase switch — no effect.
export const DoenerTagSection: FC = () => {
  const { day } = useDashboardContext();

  if (day.isOpen) {
    return <DayOpenCard day={day} />;
  }
  return <DayClosedCard />;
};
