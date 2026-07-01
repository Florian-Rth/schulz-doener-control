import type { FC } from "react";
import { PageLayout, PushToast } from "@/components";
import { useDashboardContext } from "../../dashboard-context";
import { DashboardHeader } from "./internal/DashboardHeader";
import { DoenerTagSection } from "./internal/DoenerTagSection";
import { GreetingBar } from "./internal/GreetingBar";
import { LeaderboardCard } from "./internal/LeaderboardCard";
import { MyRecentPaymentsCard } from "./internal/MyRecentPaymentsCard";
import { OpenPaymentsCard } from "./internal/OpenPaymentsCard";
import { PayPalNudge } from "./internal/PayPalNudge";
import { PushNudge } from "./internal/PushNudge";
import { ReceivablesCard } from "./internal/ReceivablesCard";
import { StatsGrid } from "./internal/StatsGrid";
import { TierSection } from "./internal/TierSection";

// Pure slot shell for the dashboard. Each section reads the dashboard context
// directly (no prop drilling); the only piece this layer touches is the toast.
export const DashboardPage: FC = () => {
  const { toast, dismissToast, day } = useDashboardContext();

  return (
    <PageLayout bg="app">
      <PageLayout.Content sx={{ gap: 1.75 }}>
        {toast !== null ? <PushToast message={toast} onDismiss={dismissToast} /> : null}
        <DashboardHeader isDayOpen={day.isOpen} />
        <GreetingBar />
        <PushNudge />
        <PayPalNudge />
        {/* The time-sensitive ritual leads: the running/open-day card sits first
            under the greeting, with the open payments right beneath it (they
            self-hide when empty), above the tier + stats overview. */}
        <DoenerTagSection />
        <OpenPaymentsCard />
        <TierSection />
        <StatsGrid />
        <LeaderboardCard />
        <MyRecentPaymentsCard />
        {/* Self-fetches its own receivables query and self-hides when empty;
            deliberately NOT part of the dashboard aggregate / context. */}
        <ReceivablesCard />
      </PageLayout.Content>
    </PageLayout>
  );
};
