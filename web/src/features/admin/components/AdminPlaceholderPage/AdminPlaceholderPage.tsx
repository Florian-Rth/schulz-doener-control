import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { GhostButton, PageLayout } from "@/components";
import { adminCopy } from "../../copy";

interface AdminPlaceholderPageProps {
  /** Section heading shown on the stub (e.g. "Benutzer"). */
  title: string;
}

// STUB — temporary placeholder for an admin sub-area whose real screen ships in
// C2/C3/C4. It keeps the hub's navigation links live (and the route tree typed)
// until the feature lands; replace the component wired to each child route then.
export const AdminPlaceholderPage: FC<AdminPlaceholderPageProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <PageLayout bg="app" safeAreaTop={54}>
      <PageLayout.Content
        sx={{ gap: 1.5, alignItems: "center", justifyContent: "center", flex: 1 }}
      >
        <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "navy.main" }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "muted.main", textAlign: "center" }}>
          Dieser Bereich wird noch gebaut, Chef.
        </Typography>
        <GhostButton onClick={() => void navigate({ to: "/admin" })}>{adminCopy.back}</GhostButton>
      </PageLayout.Content>
    </PageLayout>
  );
};
