import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, LiveDot, MaterialIcon, PrimaryButton, RedChromeSurface } from "@/components";
import { cutoffSentence, homeCopy, participantPill } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";
import type { DashboardDay } from "../../../types";
import { OrderRowItem } from "./OrderRowItem";

interface DayOpenCardProps {
  day: DashboardDay;
}

// OPEN-state Döner-Tag card: red running-day sub-header (LiveDot + cutoff +
// "{n} dabei"), notification preview, the abholer line, the order rows, and the
// "Meine Bestellung abgeben" CTA.
export const DayOpenCard: FC<DayOpenCardProps> = ({ day }) => {
  const { goOrder, goPrint } = useDashboardContext();
  const cutoff = day.cutoffLabel ?? "";

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
          {cutoffSentence(cutoff)}
        </Typography>
      </RedChromeSurface>

      <Stack sx={{ p: 2, gap: 0 }}>
        {day.pushText !== null ? (
          <Stack
            direction="row"
            sx={(theme) => ({
              gap: 1.25,
              alignItems: "flex-start",
              backgroundColor: "subtle.main",
              border: "1px solid rgba(0,34,48,.08)",
              borderRadius: `${theme.radii.sm - 1}px`,
              p: 1.25,
              mb: 1.5,
            })}
          >
            <MaterialIcon name="notifications_active" sx={{ fontSize: 20, color: "muted.main" }} />
            <Stack sx={{ minWidth: 0, gap: 0.25 }}>
              <Typography variant="eyebrow" sx={{ fontSize: "0.625rem", letterSpacing: ".04em" }}>
                {homeCopy.notifEyebrow}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "navy.main", lineHeight: 1.4 }}>
                {day.pushText}
              </Typography>
            </Stack>
          </Stack>
        ) : null}

        {day.pickupNames.length > 0 ? (
          <Stack
            direction="row"
            sx={(theme) => ({
              alignItems: "center",
              gap: 1.25,
              backgroundColor: "pinkTint.main",
              borderRadius: `${theme.radii.sm - 1}px`,
              p: 1.25,
              mb: 1.75,
            })}
          >
            <MaterialIcon name="directions_car" sx={{ fontSize: 22, color: "primary.main" }} />
            <Typography sx={{ flex: 1, fontSize: "0.8125rem", color: "navy.main" }}>
              <Typography component="b" sx={{ fontWeight: 700 }}>
                {homeCopy.abholerLabel}
              </Typography>{" "}
              {day.pickupNames.join(", ")}
            </Typography>
          </Stack>
        ) : null}

        <Stack sx={{ gap: 0.25 }}>
          {day.orders.map((order) => (
            <OrderRowItem key={order.orderId} order={order} />
          ))}
        </Stack>

        <PrimaryButton onClick={goOrder} startIcon="add" sx={{ mt: 2 }}>
          {homeCopy.goOrder}
        </PrimaryButton>
        {day.orders.length > 0 ? (
          <GhostButton onClick={goPrint} sx={{ mt: 1 }}>
            {homeCopy.printList}
          </GhostButton>
        ) : null}
      </Stack>
    </Paper>
  );
};
