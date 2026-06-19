import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { tiereCopy } from "../../../copy";
import type { AdminTier } from "../../../types";
import { AdminTierRow } from "./AdminTierRow";

interface AdminTiereListProps {
  tiers: AdminTier[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const Notice: FC<{ text: string; isError?: boolean }> = ({ text, isError }) => {
  return (
    <Typography
      role={isError === true ? "alert" : undefined}
      sx={{
        fontSize: "0.875rem",
        color: isError === true ? "primary.main" : "muted.main",
        textAlign: "center",
        py: 3,
      }}
    >
      {text}
    </Typography>
  );
};

// Renders the tier list with its loading / error / empty states. Presentational;
// the tiers arrive in the backend's priority order and are rendered as-is.
export const AdminTiereList: FC<AdminTiereListProps> = ({ tiers, isLoading, isError }) => {
  if (isLoading) {
    return <Notice text={tiereCopy.loading} />;
  }
  if (isError || tiers === undefined) {
    return <Notice text={tiereCopy.loadError} isError />;
  }
  if (tiers.length === 0) {
    return <Notice text={tiereCopy.empty} />;
  }

  return (
    <Stack sx={{ gap: 1.25 }}>
      {tiers.map((tier) => (
        <AdminTierRow key={tier.name} tier={tier} />
      ))}
    </Stack>
  );
};
