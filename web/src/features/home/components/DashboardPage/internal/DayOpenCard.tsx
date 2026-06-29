import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import {
  LiveDot,
  MaterialIcon,
  PrimaryButton,
  RedChromeSurface,
  SecondaryButton,
} from "@/components";
import { cutoffSentence, homeCopy, participantPill } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";
import { useDayStatus } from "../../../hooks/use-day-status";
import type { DashboardDay } from "../../../types";
import { AdminEndDayButton } from "./AdminEndDayButton";
import { CollectorControls } from "./CollectorControls";
import { OrderRowItem } from "./OrderRowItem";
import { TakeOverCollectorButton } from "./TakeOverCollectorButton";

interface DayOpenCardProps {
  day: DashboardDay;
}

// OPEN-state Döner-Tag card: red running-day sub-header (LiveDot + cutoff +
// "{n} dabei"), personal status eyebrow, notification preview, the abholer
// block (or a no-collector warning), the order rows, and the order CTA.
export const DayOpenCard: FC<DayOpenCardProps> = ({ day }) => {
  const { goOrder, claimCollector } = useDashboardContext();
  const { statusLine, iHaveOrdered, hasNoCollector, canTakeOver, isEmpty } = useDayStatus(day);

  // Subtitle is purely state-driven, never time-based: the "Bestellschluss"
  // line only appears once the collector has closed ordering (cutoffLabel is
  // then the close moment "HH:mm"); while open we show a neutral running line.
  const subtitle =
    day.isOrderingClosed && day.cutoffLabel !== null
      ? cutoffSentence(day.cutoffLabel)
      : homeCopy.orderingOpenSubtitle;

  // day.id is only read inside this open-state card. The collector's edit CTA
  // is the calmer navy SecondaryButton so the single red primary stays the
  // close action over in CollectorControls.
  const dayId = day.id;

  const orderCtaLabel = day.iCanStillOrder
    ? iHaveOrdered
      ? homeCopy.editOrder
      : homeCopy.goOrder
    : homeCopy.orderingClosedCta;
  const orderCtaIcon = day.iCanStillOrder ? "add" : "lock";

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

        {day.amICollector ? (
          <SecondaryButton
            onClick={goOrder}
            disabled={!day.iCanStillOrder}
            startIcon={orderCtaIcon}
            sx={{ mt: 2 }}
          >
            {orderCtaLabel}
          </SecondaryButton>
        ) : (
          <PrimaryButton
            onClick={goOrder}
            disabled={!day.iCanStillOrder}
            startIcon={orderCtaIcon}
            sx={{ mt: 2 }}
          >
            {orderCtaLabel}
          </PrimaryButton>
        )}
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
        <CollectorControls day={day} />
        {/* A non-collector admin reaches the destructive abort here — the
            collector sees it inside their own CollectorControls subsection. */}
        {!day.amICollector ? <AdminEndDayButton /> : null}
      </Stack>
    </Paper>
  );
};
