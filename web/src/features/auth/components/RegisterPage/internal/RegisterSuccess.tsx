import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { PrimaryButton } from "@/components/buttons";
import { useFunnyLine } from "@/lib/use-funny-line";
import { authCopy } from "../../../copy";

// Presentational success panel shown after a colleague has self-registered.
// No session is issued by the backend, so the only next step is to log in.
export const RegisterSuccess: FC = () => {
  const title = useFunnyLine(authCopy.registerSuccessTitles);
  const body = useFunnyLine(authCopy.registerSuccessBodies);

  return (
    <Stack sx={{ width: "100%", alignItems: "center", gap: 1 }}>
      <Typography
        component="h1"
        sx={{ fontSize: 22, fontWeight: 700, color: "navy.main", letterSpacing: "-0.01em" }}
      >
        {title}
      </Typography>
      <Typography
        sx={{ fontSize: 13, color: "muted.main", maxWidth: 260, lineHeight: 1.45, mb: 1 }}
      >
        {body}
      </Typography>
      <PrimaryButton component={Link} to="/login" aria-label={authCopy.toLogin}>
        {authCopy.toLogin}
      </PrimaryButton>
    </Stack>
  );
};
