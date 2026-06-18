import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";

interface ProductCardProps {
  icon: string;
  name: string;
  /** Sub line — price label or a note like "Pommes · Fleisch · Soße". */
  sub: string;
  selected: boolean;
  onSelect: () => void;
  /** Shows the red "INSIDER" badge. */
  insider?: boolean;
  sx?: SxProps<Theme>;
}

// One order-grid product card. Red border + pink fill + red icon when selected.
export const ProductCard: FC<ProductCardProps> = ({
  icon,
  name,
  sub,
  selected,
  onSelect,
  insider = false,
  sx,
}) => {
  return (
    <ButtonBase
      aria-pressed={selected}
      onClick={onSelect}
      sx={[
        (theme) => ({
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 0.75,
          p: 1.75,
          minHeight: 92,
          width: "100%",
          borderRadius: `${theme.radii.lg}px`,
          border: "2px solid",
          borderColor: selected ? theme.palette.primary.main : "rgba(0,34,48,0.10)",
          backgroundColor: selected ? theme.palette.pinkTint.main : theme.palette.background.paper,
          boxShadow: "0 1px 3px rgba(0,0,0,.10)",
          transition: "all .12s",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack
        direction="row"
        sx={{ width: "100%", justifyContent: "space-between", alignItems: "center" }}
      >
        <MaterialIcon
          name={icon}
          sx={(theme) => ({
            fontSize: 26,
            color: selected ? theme.palette.primary.main : theme.palette.muted.main,
          })}
        />
        {insider ? (
          <Typography
            component="span"
            sx={(theme) => ({
              fontSize: "0.5rem",
              fontWeight: 800,
              letterSpacing: ".08em",
              color: theme.palette.primary.contrastText,
              backgroundColor: theme.palette.primary.main,
              borderRadius: `${theme.radii.pill}px`,
              px: 0.875,
              py: 0.25,
            })}
          >
            INSIDER
          </Typography>
        ) : null}
      </Stack>
      <Typography
        sx={(theme) => ({
          fontSize: "0.9375rem",
          fontWeight: 700,
          color: selected ? theme.palette.primary.main : theme.palette.navy.main,
        })}
      >
        {name}
      </Typography>
      <Typography sx={{ fontSize: "0.6875rem", fontWeight: 600, color: "muted.main" }}>
        {sub}
      </Typography>
    </ButtonBase>
  );
};
