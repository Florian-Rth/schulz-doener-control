import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { IconChipBox, MaterialIcon } from "@/components";

interface AdminNavCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

// One navigation tile on the admin hub: tinted icon, title + description, and a
// trailing chevron. A full-width ButtonBase so the whole card is the hit target.
export const AdminNavCard: FC<AdminNavCardProps> = ({ icon, title, description, onClick }) => {
  return (
    <ButtonBase
      onClick={onClick}
      sx={(theme) => ({
        width: "100%",
        textAlign: "left",
        p: 1.75,
        borderRadius: `${theme.radii.lg}px`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 1px 3px rgba(0,0,0,.10)",
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, width: "100%" }}>
        <IconChipBox tint="pink" size={5.25}>
          <MaterialIcon name={icon} color="primary" sx={{ fontSize: 23 }} />
        </IconChipBox>
        <Stack sx={{ minWidth: 0, flex: 1, gap: 0.25 }}>
          <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "muted.main", lineHeight: 1.4 }}>
            {description}
          </Typography>
        </Stack>
        <MaterialIcon name="chevron_right" sx={{ fontSize: 22, color: "label.main" }} />
      </Stack>
    </ButtonBase>
  );
};
