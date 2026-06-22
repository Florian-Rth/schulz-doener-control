import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { PageLayout } from "@/components";
import { tiereCopy } from "../../copy";
import { useAdminTierePage } from "../../hooks/use-admin-tiere-page";
import { AdminTiereHeader } from "./internal/AdminTiereHeader";
import { AdminTiereList } from "./internal/AdminTiereList";

// The read-only Döner-Tiere admin screen (/admin/tiere). The data query and the
// back-to-hub navigate live in `useAdminTierePage`; this body composes the red
// header, the intro line, the window basis and the catalog list.
export const AdminTierePage: FC = () => {
  const { tiers, windowDays, isLoading, isError, goBack } = useAdminTierePage();

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <AdminTiereHeader onBack={goBack} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {tiereCopy.intro}
        </Typography>

        {windowDays !== undefined ? (
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "muted.main", px: 0.25 }}>
            {tiereCopy.windowBasis(windowDays)}
          </Typography>
        ) : null}

        <AdminTiereList tiers={tiers} isLoading={isLoading} isError={isError} />
      </PageLayout.Content>
    </PageLayout>
  );
};
