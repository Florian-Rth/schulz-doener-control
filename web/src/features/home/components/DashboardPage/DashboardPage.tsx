import type { FC } from "react";
import { PageLayout, PushToast } from "@/components";
import { useDashboardContext } from "../../dashboard-context";
import { DashboardHeader } from "./internal/DashboardHeader";
import { DoenerTagSection } from "./internal/DoenerTagSection";
import { GreetingBar } from "./internal/GreetingBar";
import { LeaderboardCard } from "./internal/LeaderboardCard";
import { OpenPaymentsCard } from "./internal/OpenPaymentsCard";
import { StatsGrid } from "./internal/StatsGrid";
import { TierSection } from "./internal/TierSection";

// Pure slot shell for the dashboard. Each section reads the dashboard context
// directly (no prop drilling); the only piece this layer touches is the toast.
export const DashboardPage: FC = () => {
  const { toast, dismissToast } = useDashboardContext();

  return (
    <PageLayout bg="app" safeAreaTop={54}>
      <PageLayout.Content sx={{ gap: 1.75 }}>
        {toast !== null ? <PushToast message={toast} onDismiss={dismissToast} /> : null}
        <DashboardHeader />
        <GreetingBar />
        <TierSection />
        <StatsGrid />
        <DoenerTagSection />
        <LeaderboardCard />
        <OpenPaymentsCard />
      </PageLayout.Content>
    </PageLayout>
  );
};
