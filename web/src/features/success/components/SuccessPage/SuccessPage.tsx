import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { GhostButton, PageLayout } from "@/components";
import { useOrderResult } from "../../api";
import { successCopy } from "../../copy";
import { OrderSummaryCard } from "./internal/OrderSummaryCard";
import { PaymentSection } from "./internal/PaymentSection";
import { SuccessHeader } from "./internal/SuccessHeader";

interface SuccessPageProps {
  orderId: string;
}

// The success screen. URL-driven: the validated `orderId` search param feeds the
// server-fetched result (product summary + payment branch). Logic (the query)
// + Layout (the card stack); the payment branch is chosen by PaymentSection.
// On load failure the celebratory header is withheld and an error Alert with a
// retry replaces the summary.
export const SuccessPage: FC<SuccessPageProps> = ({ orderId }) => {
  const navigate = useNavigate();
  const resultQuery = useOrderResult(orderId);

  const goHome = (): void => {
    void navigate({ to: "/" });
  };

  const retry = (): void => {
    void resultQuery.refetch();
  };

  return (
    <PageLayout bg="app">
      <PageLayout.Content sx={{ gap: 2 }}>
        {resultQuery.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={retry}>
                {successCopy.retry}
              </Button>
            }
          >
            {successCopy.loadError}
          </Alert>
        ) : (
          <SuccessHeader />
        )}
        {resultQuery.isPending ? (
          <Typography sx={{ fontSize: "0.875rem", color: "muted.main", textAlign: "center" }}>
            {successCopy.loading}
          </Typography>
        ) : null}
        {resultQuery.data !== undefined ? (
          <>
            <OrderSummaryCard
              lines={resultQuery.data.lines}
              priceCents={resultQuery.data.priceCents}
            />
            <PaymentSection result={resultQuery.data} />
          </>
        ) : null}
        <Stack sx={{ pt: 0.5 }}>
          <GhostButton onClick={goHome}>{successCopy.back}</GhostButton>
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
};
