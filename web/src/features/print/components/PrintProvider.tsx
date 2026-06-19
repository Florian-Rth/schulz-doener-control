import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { GhostButton, PageLayout } from "@/components";
import { type DashboardDay, useDashboard } from "@/features/home";
import { printCopy } from "../copy";
import { usePrintList } from "../hooks/use-print-list";
import { PrintListContext } from "../print-context";
import { PrintListPage } from "./PrintListPage";

// A centered message shell for the loading / error / no-open-day / empty states.
// Carries a back link so the Chef is never stranded on a dead page.
const PrintMessage: FC<{ message: string }> = ({ message }) => {
  const navigate = useNavigate();
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
          <Stack sx={{ width: "100%", maxWidth: 320 }}>
            <GhostButton onClick={() => void navigate({ to: "/" })}>{printCopy.back}</GhostButton>
          </Stack>
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
};

// Inner provider — mounted only once an open day with orders is resolved. Wires
// the derived view model into the context and renders the print page.
const PrintReady: FC<{ day: DashboardDay }> = ({ day }) => {
  const value = usePrintList({ day });
  return (
    <PrintListContext.Provider value={value}>
      <PrintListPage />
    </PrintListContext.Provider>
  );
};

// Logic layer for the print screen: fetches the dashboard aggregate and guards
// the states (loading / error / no open day / no orders) before mounting the
// list. Reuses the home feature's dashboard query — no extra round-trip and no
// backend change.
export const PrintProvider: FC = () => {
  const dashboardQuery = useDashboard();

  if (dashboardQuery.isPending) {
    return <PrintMessage message={printCopy.loading} />;
  }

  if (dashboardQuery.isError || dashboardQuery.data === undefined) {
    return <PrintMessage message={printCopy.loadFailed} />;
  }

  const { day } = dashboardQuery.data;

  if (!day.isOpen) {
    return <PrintMessage message={printCopy.noOpenDay} />;
  }

  if (day.orders.length === 0) {
    return <PrintMessage message={printCopy.noOrders} />;
  }

  return <PrintReady day={day} />;
};
