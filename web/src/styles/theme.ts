import { createTheme } from "@mui/material/styles";

// Schulz Machine-Eye design tokens. These are the single source of truth for
// brand colors — components must never hardcode hex values or px, only read
// from the theme.
const SCHULZ_RED = "#C90023";
const SCHULZ_NAVY = "#002230";

// Module augmentation: register the custom "navy" palette color so it is fully
// typed everywhere the theme is consumed.
declare module "@mui/material/styles" {
  interface Palette {
    navy: Palette["primary"];
  }
  interface PaletteOptions {
    navy?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    navy: true;
  }
}

declare module "@mui/material/AppBar" {
  interface AppBarPropsColorOverrides {
    navy: true;
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: SCHULZ_RED,
      contrastText: "#FFFFFF",
    },
    navy: {
      main: SCHULZ_NAVY,
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F4F5F6",
      paper: "#FFFFFF",
    },
    text: {
      primary: SCHULZ_NAVY,
    },
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: ['"Open Sans"', "system-ui", "Arial", "sans-serif"].join(","),
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
      letterSpacing: "-0.01em",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2rem",
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          // No gradients anywhere — keep surfaces flat per the design system.
          backgroundImage: "none",
        },
      },
    },
  },
});
