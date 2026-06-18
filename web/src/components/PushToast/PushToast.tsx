import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { IconChipBox } from "@/components/IconChipBox";
import { MaterialIcon } from "@/components/MaterialIcon";

interface PushToastProps {
  message: string;
  onDismiss: () => void;
  /** Header line; defaults to the app name + relative time. */
  title?: string;
  sx?: SxProps<Theme>;
}

// Sticky navy toast: red icon tile + title + message. Tapping anywhere
// dismisses it. Uses the `slideDown` keyframe.
export const PushToast: FC<PushToastProps> = ({
  message,
  onDismiss,
  title = "Schulz Döner Control · jetzt",
  sx,
}) => {
  return (
    <Stack
      direction="row"
      role="status"
      onClick={onDismiss}
      sx={[
        (theme) => ({
          position: "sticky",
          top: 8,
          zIndex: 60,
          gap: 1.375,
          alignItems: "flex-start",
          p: 1.5,
          borderRadius: `${theme.radii.lg}px`,
          backgroundColor: theme.palette.navy.main,
          color: theme.palette.navy.contrastText,
          boxShadow: "0 12px 34px rgba(0,0,0,.34)",
          cursor: "pointer",
          animation: `${theme.keyframes.slideDown} .3s ease`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <IconChipBox
        tint="none"
        size={3.75}
        sx={(theme) => ({ backgroundColor: theme.palette.primary.main })}
      >
        <MaterialIcon name="notifications_active" sx={{ fontSize: 18, color: "#FFFFFF" }} />
      </IconChipBox>
      <Stack sx={{ minWidth: 0, gap: 0.25 }}>
        <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "muted.main" }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: "0.8125rem", lineHeight: 1.4 }}>{message}</Typography>
      </Stack>
    </Stack>
  );
};
