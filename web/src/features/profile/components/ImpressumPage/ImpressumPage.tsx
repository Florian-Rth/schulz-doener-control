import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout } from "@/components";
import { impressumCopy } from "../../copy";
import { ImpressumField } from "./internal/ImpressumField";
import { ImpressumHeader } from "./internal/ImpressumHeader";
import { ImpressumSection } from "./internal/ImpressumSection";

// Auth-guarded German legal notice (Impressum) per §5 DDG. Layout only: red
// header + the legally required sections.
//
// IMPORTANT: every value below is a TODO PLACEHOLDER. Before this app is exposed
// to anyone outside the office, replace the placeholders in `impressumCopy`
// (web/src/features/profile/copy.ts) with the operator's real legal details
// (Firmenname, Anschrift, Kontakt, vertretungsberechtigte Person, ggf.
// USt-IdNr., inhaltlich Verantwortlicher).
export const ImpressumPage: FC = () => {
  const navigate = useNavigate();

  const goHome = (): void => {
    void navigate({ to: "/" });
  };

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <ImpressumHeader onBack={goHome} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.75 }}>
        <Typography sx={{ fontSize: "0.875rem", color: "label.main", px: 0.25 }}>
          {impressumCopy.intro}
        </Typography>

        <ImpressumSection
          eyebrow={impressumCopy.providerEyebrow}
          title={impressumCopy.providerTitle}
        >
          <Stack sx={{ gap: 0.25 }}>
            <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
              {impressumCopy.companyName}
            </Typography>
            <Typography sx={{ fontSize: "0.9375rem", color: "navy.main" }}>
              {impressumCopy.streetLine}
            </Typography>
            <Typography sx={{ fontSize: "0.9375rem", color: "navy.main" }}>
              {impressumCopy.cityLine}
            </Typography>
          </Stack>
        </ImpressumSection>

        <ImpressumSection eyebrow={impressumCopy.contactEyebrow} title={impressumCopy.contactTitle}>
          <ImpressumField label={impressumCopy.emailLabel} value={impressumCopy.emailValue} />
          <ImpressumField label={impressumCopy.phoneLabel} value={impressumCopy.phoneValue} />
        </ImpressumSection>

        <ImpressumSection
          eyebrow={impressumCopy.representationEyebrow}
          title={impressumCopy.representationTitle}
        >
          <ImpressumField
            label={impressumCopy.representativeLabel}
            value={impressumCopy.representativeValue}
          />
          <ImpressumField label={impressumCopy.vatLabel} value={impressumCopy.vatValue} />
          <ImpressumField
            label={impressumCopy.responsibleLabel}
            value={impressumCopy.responsibleValue}
          />
        </ImpressumSection>
      </PageLayout.Content>
    </PageLayout>
  );
};
