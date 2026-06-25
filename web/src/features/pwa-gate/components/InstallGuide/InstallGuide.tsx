import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { IconChipBox, MaterialIcon, PageLayout, RedChromeSurface } from "@/components";
import { installGuideCopy } from "../../copy";
import { useInstallGuide } from "../../hooks/use-install-guide";
import { InstallGuideContext } from "../../install-guide-context";
import { InstallCta } from "./internal/InstallCta";
import { InstallSteps } from "./internal/InstallSteps";

// Full-screen install guide shown to browser users when the gate is active. Mounts the logic hook,
// provides it via context, and composes the page shell + branded header + steps (UI). Layout is
// delegated to PageLayout; no hardcoded positioning here.
export const InstallGuide: FC = () => {
  const guide = useInstallGuide();

  return (
    <InstallGuideContext.Provider value={guide}>
      <PageLayout bg="login">
        <PageLayout.Header>
          <RedChromeSurface
            start={
              <IconChipBox tint="none">
                <MaterialIcon
                  name="takeout_dining"
                  sx={{ fontSize: 26, color: "primary.contrastText" }}
                />
              </IconChipBox>
            }
          >
            <Typography variant="eyebrow" sx={{ color: "primary.contrastText", opacity: 0.85 }}>
              {installGuideCopy.eyebrow}
            </Typography>
            <Typography
              sx={{ fontSize: "1.25rem", fontWeight: 700, color: "primary.contrastText" }}
            >
              {installGuideCopy.title}
            </Typography>
          </RedChromeSurface>
        </PageLayout.Header>
        <PageLayout.Content>
          <Typography sx={{ fontSize: "0.9375rem", color: "label.main", lineHeight: 1.6 }}>
            {installGuideCopy.intro}
          </Typography>
          <InstallCta />
          <InstallSteps />
        </PageLayout.Content>
      </PageLayout>
    </InstallGuideContext.Provider>
  );
};
