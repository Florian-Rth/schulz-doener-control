import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import logoTight from "@/assets/logo-tight.png";
import { IconChipBox, LiveDot, RedChromeSurface } from "@/components";
import { UserProfileButton } from "@/features/auth";
import { homeCopy } from "../../../copy";

interface DashboardHeaderProps {
  /** True while today's Döner-Tag is open — drives the honest LIVE indicator. */
  isDayOpen: boolean;
}

// The red chrome app header: brand logo tile + title block + status pill. The
// pill is honest: it pulses "LIVE" only while a day is open, otherwise it shows
// a static "Kein Döner-Tag" with no pulsing dot.
export const DashboardHeader: FC<DashboardHeaderProps> = ({ isDayOpen }) => {
  return (
    <RedChromeSurface
      start={
        <IconChipBox tint="none" size={6} sx={{ backgroundColor: "common.white", px: 0.5 }}>
          <Box
            component="img"
            src={logoTight}
            alt={homeCopy.headerLogoAlt}
            sx={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }}
          />
        </IconChipBox>
      }
      end={
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
          <Stack
            direction="row"
            sx={(theme) => ({
              alignItems: "center",
              gap: 0.75,
              backgroundColor: "rgba(255,255,255,.16)",
              borderRadius: `${theme.radii.pill}px`,
              px: 1.375,
              py: 0.625,
            })}
          >
            {isDayOpen ? <LiveDot color="live" size={7} /> : null}
            <Typography
              sx={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "primary.contrastText",
                letterSpacing: ".04em",
              }}
            >
              {isDayOpen ? homeCopy.live : homeCopy.noDayPill}
            </Typography>
          </Stack>
          <UserProfileButton size={36} />
        </Stack>
      }
    >
      <Typography
        sx={{
          fontSize: "1.0625rem",
          fontWeight: 700,
          color: "primary.contrastText",
          lineHeight: 1.15,
        }}
      >
        {homeCopy.headerTitle}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "rgba(255,255,255,.78)",
          letterSpacing: ".03em",
        }}
      >
        {homeCopy.headerSubline}
      </Typography>
    </RedChromeSurface>
  );
};
