import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { IconChipBox, LiveDot, MaterialIcon, RedChromeSurface } from "@/components";
import { UserProfileButton } from "@/features/auth";
import { homeCopy } from "../../../copy";

// The red chrome app header: kebab icon tile + title block + LIVE pill.
export const DashboardHeader: FC = () => {
  return (
    <RedChromeSurface
      start={
        <IconChipBox tint="none" size={5.25} sx={{ backgroundColor: "rgba(255,255,255,.16)" }}>
          <MaterialIcon name="kebab_dining" sx={{ fontSize: 26, color: "primary.contrastText" }} />
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
            <LiveDot color="live" size={7} />
            <Typography
              sx={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "primary.contrastText",
                letterSpacing: ".04em",
              }}
            >
              {homeCopy.live}
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
