import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { useInstallGuideContext } from "../../../install-guide-context";
import { InstallStep } from "./InstallStep";

// The platform-specific numbered steps card. Consumes the guide context; renders the platform
// title, the ordered steps, and the desktop fallback note when present. Pure UI.
export const InstallSteps: FC = () => {
  const { title, steps, note } = useInstallGuideContext();

  return (
    <Stack
      sx={(theme) => ({
        gap: 1.5,
        p: 2,
        borderRadius: `${theme.radii.lg}px`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 1px 3px rgba(0,34,48,.08)",
      })}
    >
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "label.main",
        }}
      >
        {title}
      </Typography>
      <Stack sx={{ gap: 1.25 }}>
        {steps.map((step, index) => (
          <InstallStep key={step} index={index + 1} text={step} />
        ))}
      </Stack>
      {note !== null ? (
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5 }}>
          {note}
        </Typography>
      ) : null}
    </Stack>
  );
};
