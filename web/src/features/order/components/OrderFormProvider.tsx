import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { GhostButton, PageLayout } from "@/components";
import { useMenu, useMyOrder, useTodayOrderDay } from "../api";
import { orderCopy } from "../copy";
import { useOrderForm } from "../hooks/use-order-form";
import { OrderFormContext, type OrderFormContextValue } from "../order-context";
import type { Menu } from "../types";
import { OrderPage } from "./OrderPage";

interface ReadyProps {
  dayId: string;
  menu: Menu;
}

// Inner provider — mounted only once dayId + menu are resolved so the form hook
// runs with stable defaults. Wires the order context and renders the page.
const OrderFormReady: FC<ReadyProps> = ({ dayId, menu }) => {
  const myOrderQuery = useMyOrder(dayId);
  const form = useOrderForm({ dayId, menu, existing: myOrderQuery.data });

  const value: OrderFormContextValue = {
    form: form.form,
    menu,
    fields: form.fields,
    addLine: form.addLine,
    removeLine: form.removeLine,
    canAddLine: form.canAddLine,
    selectProduct: form.selectProduct,
    orderTotalCents: form.orderTotalCents,
    submitDisabled: form.submitDisabled,
    isSubmitting: form.isSubmitting,
    serverError: form.serverError,
    onSubmit: form.onSubmit,
    canRemove: form.canRemove,
    removeOrder: form.removeOrder,
    isRemoving: form.isRemoving,
    removeError: form.removeError,
  };

  return (
    <OrderFormContext.Provider value={value}>
      <OrderPage />
    </OrderFormContext.Provider>
  );
};

// A minimal centered message shell for the loading / no-open-day states.
const OrderMessage: FC<{ message: string; showBack?: boolean }> = ({ message, showBack }) => {
  const navigate = useNavigate();
  return (
    <PageLayout bg="app">
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
          {showBack === true ? (
            <GhostButton
              onClick={() => {
                void navigate({ to: "/" });
              }}
            >
              Zurück zur Übersicht
            </GhostButton>
          ) : null}
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
};

// Logic layer for the order screen: resolves the open Döner-Tag id, loads the
// menu, and only then mounts the form provider. Guards the "no open day" and
// "cutoff passed" states the route on its own cannot know about.
export const OrderFormProvider: FC = () => {
  const menuQuery = useMenu();
  const todayQuery = useTodayOrderDay();

  if (menuQuery.isPending || todayQuery.isPending) {
    return <OrderMessage message="Lädt …" />;
  }

  if (menuQuery.isError || todayQuery.isError || menuQuery.data === undefined) {
    return <OrderMessage message={orderCopy.submitFailed} showBack />;
  }

  const today = todayQuery.data;
  const day = today?.day ?? null;
  if (today === undefined || !today.isOpen || day === null) {
    return <OrderMessage message={orderCopy.noOpenDay} showBack />;
  }

  if (!day.iCanStillOrder) {
    return <OrderMessage message={orderCopy.cutoffPassed} showBack />;
  }

  return <OrderFormReady dayId={day.id} menu={menuQuery.data} />;
};
