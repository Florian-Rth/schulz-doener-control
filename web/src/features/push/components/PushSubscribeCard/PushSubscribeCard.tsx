import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC } from "react";
import { usePushOperations } from "../../hooks/use-push-operations";
import { PushContext } from "../../push-context";
import { PushControl } from "./internal/PushControl";
import { PushHeader } from "./internal/PushHeader";

interface PushSubscribeCardProps {
  sx?: SxProps<Theme>;
}

// White card hosting the Web-Push subscribe flow. Mounts the operations hook
// (Logic), provides it via context, and composes the header + status control
// (UI). Positioning is the parent's concern via `sx`.
export const PushSubscribeCard: FC<PushSubscribeCardProps> = ({ sx }) => {
  const operations = usePushOperations();

  return (
    <PushContext.Provider value={operations}>
      <Stack
        sx={[
          (theme) => ({
            gap: 1.5,
            p: 2,
            borderRadius: `${theme.radii.lg}px`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: "0 1px 3px rgba(0,34,48,.08)",
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <PushHeader />
        <PushControl />
      </Stack>
    </PushContext.Provider>
  );
};
