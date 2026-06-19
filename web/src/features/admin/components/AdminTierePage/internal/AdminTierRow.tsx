import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { tiereCopy } from "../../../copy";
import type { AdminTier } from "../../../types";

interface AdminTierRowProps {
  tier: AdminTier;
}

// One read-only tier row: emoji tile + name + tagline, the 3 descriptor tags as
// chips, and the German trigger condition under a small label. Presentational.
export const AdminTierRow: FC<AdminTierRowProps> = ({ tier }) => {
  return (
    <Paper
      sx={(theme) => ({
        p: 1.5,
        borderRadius: `${theme.radii.lg}px`,
        border: "1.5px solid transparent",
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 1px 3px rgba(0,0,0,.08)",
      })}
    >
      <Stack direction="row" sx={{ gap: 1.5, alignItems: "flex-start" }}>
        <Stack
          sx={(theme) => ({
            width: theme.spacing(5.5),
            height: theme.spacing(5.5),
            borderRadius: `${theme.radii.md}px`,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "1.5rem",
            backgroundColor: theme.palette.subtle.main,
          })}
        >
          <span aria-hidden>{tier.emoji}</span>
        </Stack>
        <Stack sx={{ minWidth: 0, gap: 0.5, flex: 1 }}>
          <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
            {tier.name}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "muted.main", lineHeight: 1.45 }}>
            {tier.tagline}
          </Typography>

          {tier.tags.length > 0 ? (
            <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap", mt: 0.25 }}>
              {tier.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={(theme) => ({
                    backgroundColor: theme.palette.subtle.main,
                    color: theme.palette.label.main,
                    fontWeight: 600,
                    fontSize: "0.6875rem",
                  })}
                />
              ))}
            </Stack>
          ) : null}

          <Stack sx={{ gap: 0.25, mt: 0.5 }}>
            <Typography variant="eyebrow" sx={{ color: "muted.main" }}>
              {tiereCopy.conditionLabel}
            </Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.45 }}>
              {tier.condition}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};
