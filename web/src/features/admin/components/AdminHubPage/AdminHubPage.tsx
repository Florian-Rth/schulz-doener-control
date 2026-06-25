import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PageLayout } from "@/components";
import { adminCopy } from "../../copy";
import { useAdminHub } from "../../hooks/use-admin-hub";
import { AdminHubHeader } from "./internal/AdminHubHeader";
import { AdminNavCard } from "./internal/AdminNavCard";

// The admin hub landing screen: a red header, an intro line, and navigation
// cards into the Benutzer / Menü / Döner-Tiere sub-areas. Logic (navigation)
// lives in `useAdminHub`; this body only composes the layout.
export const AdminHubPage: FC = () => {
  const { goHome, goTo } = useAdminHub();
  const { cards } = adminCopy;

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <AdminHubHeader onBack={goHome} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {adminCopy.intro}
        </Typography>
        <AdminNavCard
          icon={cards.benutzer.icon}
          title={cards.benutzer.title}
          description={cards.benutzer.description}
          onClick={() => goTo("/admin/benutzer")}
        />
        <AdminNavCard
          icon={cards.menue.icon}
          title={cards.menue.title}
          description={cards.menue.description}
          onClick={() => goTo("/admin/menue")}
        />
        <AdminNavCard
          icon={cards.pizzaVariants.icon}
          title={cards.pizzaVariants.title}
          description={cards.pizzaVariants.description}
          onClick={() => goTo("/admin/pizza-variants")}
        />
        <AdminNavCard
          icon={cards.tiere.icon}
          title={cards.tiere.title}
          description={cards.tiere.description}
          onClick={() => goTo("/admin/tiere")}
        />
        <AdminNavCard
          icon={cards.benachrichtigungen.icon}
          title={cards.benachrichtigungen.title}
          description={cards.benachrichtigungen.description}
          onClick={() => goTo("/admin/benachrichtigungen")}
        />
        <AdminNavCard
          icon={cards.registrierung.icon}
          title={cards.registrierung.title}
          description={cards.registrierung.description}
          onClick={() => goTo("/admin/registrierung")}
        />
        <GhostButton onClick={goHome} sx={{ mt: 0.75 }}>
          {adminCopy.back}
        </GhostButton>
      </PageLayout.Content>
    </PageLayout>
  );
};
