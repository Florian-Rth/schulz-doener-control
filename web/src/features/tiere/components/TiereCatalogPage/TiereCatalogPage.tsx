import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PageLayout } from "@/components";
import { tiereCopy } from "../../copy";
import { useTiereCatalog } from "../../hooks/use-tiere-catalog";
import { TiereHeader } from "./internal/TiereHeader";
import { TiereList } from "./internal/TiereList";

// The Döner-Tiere catalog screen. Logic lives in `useTiereCatalog`; this body
// composes the red header, the intro line, the catalog list and the back CTA.
export const TiereCatalogPage: FC = () => {
  const { entries, isPending, isError, goHome } = useTiereCatalog();

  return (
    <PageLayout bg="app" safeAreaTop={54}>
      <PageLayout.Header>
        <TiereHeader onBack={goHome} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.75 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {tiereCopy.intro}
        </Typography>
        {isPending ? (
          <Typography sx={{ fontSize: "0.875rem", color: "muted.main", textAlign: "center" }}>
            {tiereCopy.loading}
          </Typography>
        ) : null}
        {isError ? (
          <Typography sx={{ fontSize: "0.875rem", color: "primary.main", textAlign: "center" }}>
            {tiereCopy.error}
          </Typography>
        ) : null}
        {entries !== undefined ? <TiereList entries={entries} /> : null}
        <GhostButton onClick={goHome} sx={{ mt: 0.75 }}>
          {tiereCopy.back}
        </GhostButton>
      </PageLayout.Content>
    </PageLayout>
  );
};
