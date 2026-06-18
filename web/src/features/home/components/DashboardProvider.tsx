import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { PageLayout } from "@/components";
import { useDashboard } from "../api";
import { homeCopy } from "../copy";
import { DashboardContext, type DashboardContextValue } from "../dashboard-context";
import { useDashboardOperations } from "../hooks/use-dashboard-operations";
import type { Dashboard } from "../types";
import { DashboardPage } from "./DashboardPage";

// A minimal centered message shell for the loading / error states.
const DashboardMessage: FC<{ message: string }> = ({ message }) => {
  return (
    <PageLayout bg="app" safeAreaTop={54}>
      <PageLayout.Content>
        <Stack sx={{ gap: 2, alignItems: "center", pt: 6 }}>
          <Typography
            sx={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "label.main",
              textAlign: "center",
            }}
          >
            {message}
          </Typography>
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
};

interface ReadyProps {
  dashboard: Dashboard;
}

// Inner provider — mounted only once the dashboard payload resolved. Wires the
// data slices + the action operations into the context and renders the page.
const DashboardReady: FC<ReadyProps> = ({ dashboard }) => {
  const operations = useDashboardOperations({ serverToast: dashboard.toast });

  const value: DashboardContextValue = {
    firstName: dashboard.firstName,
    displayName: dashboard.displayName,
    avatarColorHex: dashboard.avatarColorHex,
    stats: dashboard.stats,
    tier: dashboard.tier,
    leaderboard: dashboard.leaderboard,
    day: dashboard.day,
    debts: dashboard.debts,
    toast: operations.toast,
    dismissToast: operations.dismissToast,
    openDay: operations.openDay,
    isOpeningDay: operations.isOpeningDay,
    goOrder: operations.goOrder,
    goTiere: operations.goTiere,
  };

  return (
    <DashboardContext.Provider value={value}>
      <DashboardPage />
    </DashboardContext.Provider>
  );
};

// Logic layer for the home screen: fetches the aggregate dashboard payload and
// only mounts the provider once it resolved. Guards the loading / error states.
export const DashboardProvider: FC = () => {
  const dashboardQuery = useDashboard();

  if (dashboardQuery.isPending) {
    return <DashboardMessage message={homeCopy.loading} />;
  }

  if (dashboardQuery.isError || dashboardQuery.data === undefined) {
    return <DashboardMessage message={homeCopy.loadFailed} />;
  }

  return <DashboardReady dashboard={dashboardQuery.data} />;
};
