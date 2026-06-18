import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { pushCopy } from "../../../copy";
import { usePushContext } from "../../../push-context";

const Notice: FC<{ title: string; body: string }> = ({ title, body }) => {
  return (
    <Stack role="status" sx={{ gap: 0.25 }}>
      <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5 }}>
        {body}
      </Typography>
    </Stack>
  );
};

// The status-dependent control: the enable/disable button or a graceful-
// degradation notice. Consumes the push context.
export const PushControl: FC = () => {
  const { status, isBusy, subscribe, unsubscribe } = usePushContext();

  switch (status) {
    case "unsupported":
      return <Notice title={pushCopy.unsupportedTitle} body={pushCopy.unsupported} />;
    case "denied":
      return <Notice title={pushCopy.deniedTitle} body={pushCopy.denied} />;
    case "subscribed":
      return (
        <Stack sx={{ gap: 1 }}>
          <Typography
            role="status"
            sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "success.main" }}
          >
            {pushCopy.subscribed}
          </Typography>
          <GhostButton onClick={unsubscribe}>{pushCopy.disable}</GhostButton>
        </Stack>
      );
    default:
      return (
        <Stack sx={{ gap: 1 }}>
          {status === "error" ? (
            <Typography
              role="alert"
              sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "primary.main" }}
            >
              {pushCopy.error}
            </Typography>
          ) : null}
          <PrimaryButton onClick={subscribe} loading={isBusy} startIcon="notifications_active">
            {isBusy ? pushCopy.enabling : pushCopy.enable}
          </PrimaryButton>
        </Stack>
      );
  }
};
