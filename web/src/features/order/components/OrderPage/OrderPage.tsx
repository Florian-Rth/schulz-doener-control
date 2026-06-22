import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { GhostButton, PageLayout, PrimaryButton } from "@/components";
import { orderCopy } from "../../copy";
import { centsToLabel } from "../../money";
import { useOrderFormContext } from "../../order-context";
import { OrderHeader } from "./internal/OrderHeader";
import { OrderLineCard } from "./internal/OrderLineCard";
import { PickupToggleCard } from "./internal/PickupToggleCard";

// Layout shell for the order screen. Renders one OrderLineCard per field-array
// entry, an add-line control, the running order total, the pickup toggle and the
// submit CTA. All state comes from the order context — this component holds no
// logic.
export const OrderPage: FC = () => {
  const navigate = useNavigate();
  const {
    fields,
    addLine,
    canAddLine,
    orderTotalCents,
    submitDisabled,
    isSubmitting,
    serverError,
    onSubmit,
  } = useOrderFormContext();

  const goHome = (): void => {
    void navigate({ to: "/" });
  };

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <OrderHeader onBack={goHome} />
      </PageLayout.Header>
      <PageLayout.Content>
        <Stack component="form" onSubmit={onSubmit} sx={{ gap: 2.25 }} noValidate>
          {fields.map((field, index) => (
            <OrderLineCard key={field.key} index={index} />
          ))}

          {canAddLine ? <GhostButton onClick={addLine}>{orderCopy.addLine}</GhostButton> : null}

          <Stack
            direction="row"
            sx={{ alignItems: "baseline", justifyContent: "space-between", px: 0.5 }}
          >
            <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
              {orderCopy.orderTotal}
            </Typography>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, color: "primary.main" }}>
              {centsToLabel(orderTotalCents)}
            </Typography>
          </Stack>

          <PickupToggleCard />

          {serverError !== null ? (
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "primary.main" }}>
              {serverError}
            </Typography>
          ) : null}

          <PrimaryButton
            type="submit"
            disabled={submitDisabled}
            loading={isSubmitting}
            startIcon="check_circle"
          >
            {orderCopy.submit}
          </PrimaryButton>
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
};
