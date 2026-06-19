import GlobalStyles from "@mui/material/GlobalStyles";
import type { FC } from "react";

// Print-only stylesheet for the Abholer sheet. The same component renders
// on-screen (mobile) and on paper — only these @media print rules retune it:
//   - hide app chrome / nav / buttons (anything marked data-print-hide),
//     including the Drucken button itself;
//   - white background + black text everywhere, no shadows;
//   - narrow page margins + ~10pt body;
//   - keep each order row intact across a page break.
// NOTE: real-device print rendering (iOS Safari / Android Chrome) must still be
// verified manually — print CSS support varies between mobile browsers.
export const PrintStyles: FC = () => {
  return (
    <GlobalStyles
      styles={{
        "@media print": {
          "@page": { margin: "12mm" },
          "html, body": {
            background: "#fff !important",
            color: "#000 !important",
            fontSize: "10pt",
          },
          "[data-print-hide]": { display: "none !important" },
          "[data-print-sheet]": {
            background: "#fff !important",
            color: "#000 !important",
            boxShadow: "none !important",
            padding: 0,
            margin: 0,
          },
          "[data-print-sheet] *": {
            color: "#000 !important",
            boxShadow: "none !important",
          },
          "[data-print-row]": { breakInside: "avoid" },
          "[data-print-table]": { borderColor: "#000 !important" },
        },
      }}
    />
  );
};
