import type { FC } from "react";
import { PageLayout, PushToast } from "@/components";
import { useDashboardContext } from "../../dashboard-context";
import { DashboardHeader } from "./internal/DashboardHeader";
import { DoenerTagSection } from "./internal/DoenerTagSection";
import { GreetingBar } from "./internal/GreetingBar";
import { LeaderboardCard } from "./internal/LeaderboardCard";
import { MyRecentPaymentsCard } from "./internal/MyRecentPaymentsCard";
import { OpenPaymentsCard } from "./internal/OpenPaymentsCard";
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
        {/* The time-sensitive ritual leads: the running/open-day card sits first
            under the greeting, above the tier + stats overview. */}
        <DoenerTagSection />
        <TierSection />
        <StatsGrid />
        <LeaderboardCard />
        <OpenPaymentsCard />
        <MyRecentPaymentsCard />
      </PageLayout.Content>
    </PageLayout>
  );
};
