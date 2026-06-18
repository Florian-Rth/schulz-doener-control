import ButtonBase from "@mui/material/ButtonBase";
import type { FC } from "react";
import { MaterialIcon, TierCard } from "@/components";
import { homeCopy, tierOrderCountSentence } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

// The navy Döner-Tier card driven by the dashboard tier slice, with the
// "Alle Tiere ansehen" footer link that navigates to the catalog.
export const TierSection: FC = () => {
  const { tier, goTiere } = useDashboardContext();

  return (
    <TierCard
      emoji={tier.emoji}
      name={tier.name}
      tagline={tier.tagline}
      tags={tier.tags}
      orderCountLabel={tierOrderCountSentence(tier.orderCount)}
      eyebrow={homeCopy.tierEyebrow}
      footer={
        <ButtonBase
          onClick={goTiere}
          sx={{
            color: "rgba(255,255,255,.6)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            gap: 0.375,
            "&:hover": { color: "primary.contrastText" },
          }}
        >
          {homeCopy.tierFooter}
          <MaterialIcon name="chevron_right" sx={{ fontSize: 14 }} />
        </ButtonBase>
      }
    />
  );
};
