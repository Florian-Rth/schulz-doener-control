import { useNavigate } from "@tanstack/react-router";

export interface AdminHubNavTarget {
  to: "/admin/benutzer" | "/admin/menue" | "/admin/tiere" | "/admin/benachrichtigungen";
}

interface UseAdminHubResult {
  /** Routes back to the home dashboard. */
  goHome: () => void;
  /** Routes to one of the admin sub-areas. */
  goTo: (target: AdminHubNavTarget["to"]) => void;
}

// Logic layer for the admin hub: owns the navigation actions. Holds no JSX; the
// AdminHubPage consumes this and renders the cards.
export const useAdminHub = (): UseAdminHubResult => {
  const navigate = useNavigate();

  return {
    goHome: () => {
      void navigate({ to: "/" });
    },
    goTo: (to) => {
      void navigate({ to });
    },
  };
};
