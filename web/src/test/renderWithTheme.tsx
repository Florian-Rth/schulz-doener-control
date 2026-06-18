import { ThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { theme } from "@/styles/theme";

// Shared render helper: every design-system primitive reads theme tokens, so
// tests must mount them inside the real Schulz theme rather than the MUI
// default — otherwise `theme.schraege`/`theme.radii` are undefined.
export const renderWithTheme = (ui: ReactElement): ReturnType<typeof render> =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
