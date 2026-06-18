import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PageLayout } from "@/components";
import { pushCopy } from "../../copy";
import { usePushNavigation } from "../../hooks/use-push-navigation";
import { PushSubscribeCard } from "../PushSubscribeCard";
import { PushPageHeader } from "./internal/PushPageHeader";

// The notification-settings screen: red header, intro, the subscribe card and a
// back CTA. Routes compose this; the card owns the Web-Push logic internally.
export const BenachrichtigungenPage: FC = () => {
  const { goHome } = usePushNavigation();

  return (
    <PageLayout bg="app" safeAreaTop={54}>
      <PageLayout.Header>
        <PushPageHeader onBack={goHome} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.75 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {pushCopy.pageIntro}
        </Typography>
        <PushSubscribeCard />
        <GhostButton onClick={goHome} sx={{ mt: 0.75 }}>
          {pushCopy.back}
        </GhostButton>
      </PageLayout.Content>
    </PageLayout>
  );
};
