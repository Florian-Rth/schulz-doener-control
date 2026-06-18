import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/home";

const IndexRoute = () => {
  // The home greeting uses the user's real name; once auth is wired up this
  // will come from the session. Placeholder for now.
  return <HomePage greetingName="Florian" />;
};

export const Route = createFileRoute("/")({
  component: IndexRoute,
});
