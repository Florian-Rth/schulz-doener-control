import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import {
  ConfirmDialog,
  FortuneWheel,
  GhostButton,
  MaterialIcon,
  PrimaryButton,
  SecondaryButton,
} from "@/components";
import { homeCopy } from "../../../copy";
import { usePickupWheel } from "../../../hooks/use-pickup-wheel";
import type { PickupWheel } from "../../../types";

interface PickupWheelCardProps {
  wheel: PickupWheel;
  dayId: string;
  sx?: SxProps<Theme>;
}

// The Abholer-Glücksrad: nobody volunteered by 12:00, so the server drew an Abholer. Each device
// watches the draw once ("Rad drehen" — the tap also unlocks the sound), then sees the verdict.
// The chosen one gets one funny way out per person and day.
export const PickupWheelCard: FC<PickupWheelCardProps> = ({ wheel, dayId, sx }) => {
  const state = usePickupWheel(wheel, dayId);

  return (
    <Stack
      sx={[
        (theme) => ({
          gap: 1.25,
          backgroundColor: "pinkTint.main",
          borderRadius: `${theme.radii.sm - 1}px`,
          p: 1.5,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <MaterialIcon name="casino" sx={{ fontSize: 20, color: "primary.main" }} />
        <Typography variant="eyebrow" sx={{ fontSize: "0.625rem", letterSpacing: ".08em" }}>
          {homeCopy.wheelTitle}
        </Typography>
      </Stack>

      <Typography
        aria-live="polite"
        sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main", lineHeight: 1.35 }}
      >
        {state.headline}
      </Typography>

      <FortuneWheel
        slices={state.slices}
        rotation={state.rotation}
        highlightIndex={state.highlightIndex}
        ariaLabel={homeCopy.wheelTitle}
        sx={{ maxWidth: 260, alignSelf: "center" }}
      />

      {state.phase === "revealed" ? (
        <GhostButton onClick={state.spin} startIcon="replay">
          {homeCopy.wheelReplay}
        </GhostButton>
      ) : (
        <PrimaryButton
          onClick={state.spin}
          loading={state.phase === "spinning"}
          disabled={state.phase === "spinning"}
          startIcon="casino"
        >
          {homeCopy.wheelSpin}
        </PrimaryButton>
      )}

      {state.canExcuse ? (
        <SecondaryButton onClick={state.openExcuseDialog} disabled={state.isExcusing}>
          {state.excuseLabel}
        </SecondaryButton>
      ) : null}

      {state.hasNoEscape ? (
        <Typography sx={{ fontSize: "0.75rem", color: "navy.main", lineHeight: 1.4 }}>
          {homeCopy.wheelNoEscape}
        </Typography>
      ) : null}

      {state.excusedLine !== null ? (
        <Typography sx={{ fontSize: "0.75rem", color: "muted.main", lineHeight: 1.4 }}>
          {state.excusedLine}
        </Typography>
      ) : null}

      <ConfirmDialog
        open={state.isExcuseDialogOpen}
        onClose={state.closeExcuseDialog}
        title={homeCopy.wheelExcuseDialogTitle}
        body={homeCopy.wheelExcuseDialogBody}
        confirmLabel={homeCopy.wheelExcuseConfirm}
        cancelLabel={homeCopy.wheelExcuseCancel}
        pending={state.isExcusing}
        onConfirm={state.confirmExcuse}
      />
    </Stack>
  );
};
