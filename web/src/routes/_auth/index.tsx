import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/features/auth";
import { HomePage } from "@/features/home";

const HomeRoute = () => {
  // The home greeting uses the user's real first name from the live session.
  const { user } = useAuth();
  return <HomePage greetingName={user?.firstName ?? "Chef"} />;
};

export const Route = createFileRoute("/_auth/")({
  component: HomeRoute,
});
