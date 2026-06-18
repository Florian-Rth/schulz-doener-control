import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { IconChipBox, MaterialIcon } from "@/components";
import { pushCopy } from "../../../copy";

// Eyebrow + title + intro with the notifications icon tile. Pure UI.
export const PushHeader: FC = () => {
  return (
    <Stack direction="row" sx={{ gap: 1.5, alignItems: "flex-start" }}>
      <IconChipBox tint="pink" size={4.75}>
        <MaterialIcon name="notifications_active" color="primary" sx={{ fontSize: 24 }} />
      </IconChipBox>
      <Stack sx={{ gap: 0.25, minWidth: 0 }}>
        <Typography variant="eyebrow" sx={{ color: "primary.main" }}>
          {pushCopy.eyebrow}
        </Typography>
        <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "navy.main" }}>
          {pushCopy.title}
        </Typography>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5 }}>
          {pushCopy.intro}
        </Typography>
      </Stack>
    </Stack>
  );
};
