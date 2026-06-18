import { useNavigate } from "@tanstack/react-router";

export interface PushNavigation {
  goHome: () => void;
}

// Logic layer: navigation actions for the notification-settings screen.
export const usePushNavigation = (): PushNavigation => {
  const navigate = useNavigate();
  return {
    goHome: () => {
      void navigate({ to: "/" });
    },
  };
};
