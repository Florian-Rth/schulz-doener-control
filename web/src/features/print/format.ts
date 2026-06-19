// The open Döner-Tag is always "today" (this is a today-tool and the dashboard
// payload carries no explicit date). Render the German long form, e.g.
// "Donnerstag, 18. Juni 2026", for the printed sheet's header.
export const formatGermanDate = (date: Date): string =>
  date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
