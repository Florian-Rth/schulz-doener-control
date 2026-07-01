import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { PageLayout } from "@/components";
import { printCopy } from "../../copy";
import { PrintActions } from "./internal/PrintActions";
import { PrintHeader } from "./internal/PrintHeader";
import { PrintStyles } from "./internal/PrintStyles";
import { PrintSummary } from "./internal/PrintSummary";
import { PrintTable } from "./internal/PrintTable";

// Layout layer for the printable Abholer list. The white card is the print
// sheet (data-print-sheet): header + the order table + grand total. The action
// bar sits below it and is hidden in print. The same markup renders on the
// phone and on paper — only PrintStyles' @media print rules differ.
export const PrintListPage: FC = () => {
  return (
    <PageLayout bg="app">
      <PrintStyles />
      <PageLayout.Content sx={{ gap: 2 }}>
        <Paper
          data-print-sheet
          sx={(theme) => ({
            borderRadius: `${theme.radii.xl}px`,
            boxShadow: "0 2px 6px rgba(0,0,0,.10)",
            p: 2.5,
            overflowX: "auto",
          })}
        >
          <Stack sx={{ gap: 2 }}>
            <PrintHeader />
            <PrintSummary />
            <PrintTable />
            <Stack
              sx={{
                pt: 1,
                borderTop: "1px solid rgba(0,34,48,.12)",
                fontSize: "0.6875rem",
                color: "muted.main",
                textAlign: "center",
              }}
            >
              {printCopy.footer}
            </Stack>
          </Stack>
        </Paper>
        <PrintActions />
      </PageLayout.Content>
    </PageLayout>
  );
};
