import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import {
  GhostButton,
  LiveDot,
  MaterialIcon,
  PayPalButton,
  PrimaryButton,
  RedChromeSurface,
} from "@/components";
import {
  cutoffSentence,
  homeCopy,
  participantPill,
  payAbholerLabel,
  payCashAbholer,
} from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";
import { useDayStatus } from "../../../hooks/use-day-status";
import type { DashboardDay } from "../../../types";
import { AdminEndDayButton } from "./AdminEndDayButton";
import { OrderRowItem } from "./OrderRowItem";
import { TakeOverCollectorButton } from "./TakeOverCollectorButton";

interface DayOpenCardProps {
  day: DashboardDay;
}

// OPEN-state Döner-Tag card: red running-day sub-header (LiveDot + cutoff +
// "{n} dabei"), personal status eyebrow, notification preview, the abholer
// block (or a no-collector warning), the order rows, and the order CTA.
export const DayOpenCard: FC<DayOpenCardProps> = ({ day }) => {
  const {
    goOrder,
    goPrint,
    closeOrdering,
    isClosingOrdering,
    closeDay,
    isClosingDay,
    claimCollector,
  } = useDashboardContext();
  const { statusLine, iHaveOrdered, hasNoCollector, canTakeOver, isEmpty } = useDayStatus(day);

  // Subtitle is purely state-driven, never time-based: the "Bestellschluss"
  // line only appears once the collector has closed ordering (cutoffLabel is
  // then the close moment "HH:mm"); while open we show a neutral running line.
  const subtitle =
    day.isOrderingClosed && day.cutoffLabel !== null
      ? cutoffSentence(day.cutoffLabel)
      : homeCopy.orderingOpenSubtitle;

  // Collector-only close controls. day.id is only read here, inside this
  // open-state card; while ordering is open the collector locks ordering, once
  // locked they close the whole day (creating the debts).
  const dayId = day.id;
  const collectorControls =
    day.amICollector && dayId !== null ? (
      <PrimaryButton
        onClick={() => {
          if (day.isOrderingClosed) {
            closeDay(dayId);
          } else {
            closeOrdering(dayId);
          }
        }}
        loading={day.isOrderingClosed ? isClosingDay : isClosingOrdering}
        startIcon={day.isOrderingClosed ? "lock" : "lock_clock"}
        sx={{ mt: 1 }}
      >
        {day.isOrderingClosed ? homeCopy.closeDay : homeCopy.closeOrdering}
      </PrimaryButton>
    ) : null;

  return (
    <Paper
      sx={(theme) => ({
        borderRadius: `${theme.radii.xl}px`,
        boxShadow: "0 2px 6px rgba(0,0,0,.10)",
        overflow: "hidden",
      })}
    >
      <RedChromeSurface
        sx={{ borderRadius: 0 }}
        start={<LiveDot color="live" size={9} />}
        end={
          <Typography
            sx={(theme) => ({
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "primary.contrastText",
              backgroundColor: "rgba(255,255,255,.18)",
              borderRadius: `${theme.radii.pill}px`,
              px: 1.25,
              py: 0.5,
            })}
          >
            {participantPill(day.participantCount)}
          </Typography>
        }
      >
        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "primary.contrastText" }}>
          {homeCopy.dayRunningTitle}
        </Typography>
        <Typography sx={{ fontSize: "0.6875rem", color: "rgba(255,255,255,.8)" }}>
          {subtitle}
        </Typography>
      </RedChromeSurface>

      <Stack sx={{ p: 2, gap: 0 }}>
        <Typography
          variant="eyebrow"
          sx={{ fontSize: "0.625rem", letterSpacing: ".08em", mb: 1.5 }}
        >
          {statusLine}
        </Typography>

        {hasNoCollector ? (
          <Stack
            role="alert"
            sx={(theme) => ({
              gap: 1,
              backgroundColor: "warning.main",
              borderRadius: `${theme.radii.sm - 1}px`,
              p: 1.25,
              mb: 1.75,
            })}
          >
            <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1.25 }}>
              <MaterialIcon
                name="directions_car"
                sx={{ fontSize: 22, color: "warning.contrastText" }}
              />
              <Stack sx={{ minWidth: 0, gap: 0.25 }}>
                <Typography
                  sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "warning.contrastText" }}
                >
                  {homeCopy.noCollectorTitle}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.75rem", color: "warning.contrastText", lineHeight: 1.4 }}
                >
                  {iHaveOrdered ? homeCopy.noCollectorBody : homeCopy.noCollectorOrderFirst}
                </Typography>
              </Stack>
            </Stack>
            {iHaveOrdered && dayId !== null ? (
              <PrimaryButton
                onClick={() => {
                  claimCollector(dayId);
                }}
                startIcon="directions_car"
              >
                {homeCopy.claimCollector}
              </PrimaryButton>
            ) : null}
          </Stack>
        ) : null}

        {day.pickupNames.length > 0 ? (
          <Stack
            sx={(theme) => ({
              gap: 1,
              backgroundColor: "pinkTint.main",
              borderRadius: `${theme.radii.sm - 1}px`,
              p: 1.25,
              mb: 1.75,
            })}
          >
            <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
              <MaterialIcon name="directions_car" sx={{ fontSize: 22, color: "primary.main" }} />
              <Typography sx={{ flex: 1, fontSize: "0.8125rem", color: "navy.main" }}>
                <Typography component="b" sx={{ fontWeight: 700 }}>
                  {homeCopy.abholerLabel}
                </Typography>{" "}
                {day.pickupNames.join(", ")}
              </Typography>
            </Stack>
            {canTakeOver && day.abholer !== null ? (
              day.abholer.payPalUrl !== null ? (
                <Stack sx={{ gap: 0.5 }}>
                  <PayPalButton href={day.abholer.payPalUrl}>
                    {payAbholerLabel(day.abholer.name)}
                  </PayPalButton>
                  <Typography
                    sx={{ fontSize: "0.6875rem", color: "muted.main", textAlign: "center" }}
                  >
                    {homeCopy.payAbholerCaption}
                  </Typography>
                </Stack>
              ) : (
                <Typography
                  role="alert"
                  sx={{ fontSize: "0.75rem", fontWeight: 600, color: "primary.main" }}
                >
                  {payCashAbholer(day.abholer.name)}
                </Typography>
              )
            ) : null}
            {canTakeOver && iHaveOrdered && dayId !== null && day.abholer !== null ? (
              <TakeOverCollectorButton dayId={dayId} currentCollectorName={day.abholer.name} />
            ) : null}
          </Stack>
        ) : null}

        {isEmpty ? (
          <Typography
            sx={{ fontSize: "0.8125rem", color: "muted.main", textAlign: "center", py: 1.5 }}
          >
            {homeCopy.noOrdersYet}
          </Typography>
        ) : (
          <Stack sx={{ gap: 0.25 }}>
            {day.orders.map((order) => (
              <OrderRowItem key={order.orderId} order={order} />
            ))}
          </Stack>
        )}

        <PrimaryButton
          onClick={goOrder}
          disabled={!day.iCanStillOrder}
          startIcon={day.iCanStillOrder ? "add" : "lock"}
          sx={{ mt: 2 }}
        >
          {day.iCanStillOrder
            ? iHaveOrdered
              ? homeCopy.editOrder
              : homeCopy.goOrder
            : homeCopy.orderingClosedCta}
        </PrimaryButton>
        {!day.iCanStillOrder ? (
          <Stack
            direction="row"
            sx={(theme) => ({
              gap: 1,
              alignItems: "center",
              backgroundColor: "pinkTint.main",
              borderRadius: `${theme.radii.sm - 1}px`,
              p: 1.25,
              mt: 1,
            })}
          >
            <MaterialIcon name="lock" sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography sx={{ fontSize: "0.75rem", color: "navy.main", lineHeight: 1.4 }}>
              {homeCopy.orderingClosedInfo}
            </Typography>
          </Stack>
        ) : null}
        {day.orders.length > 0 ? (
          <GhostButton onClick={goPrint} sx={{ mt: 1 }}>
            {homeCopy.printList}
          </GhostButton>
        ) : null}
        {collectorControls}
        <AdminEndDayButton />
      </Stack>
    </Paper>
  );
};
