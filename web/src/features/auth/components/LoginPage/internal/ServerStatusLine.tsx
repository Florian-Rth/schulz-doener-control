import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { LiveDot } from "@/components/LiveDot";

interface ServerStatusLineProps {
  label: string;
}

// The reassuring "Döner-Server erreichbar" status line under the login form.
export const ServerStatusLine: FC<ServerStatusLineProps> = ({ label }) => {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <LiveDot color="success" />
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "muted.main" }}>{label}</Typography>
    </Stack>
  );
};
