import { createTheme } from "@mui/material/styles";

// Schulz Machine-Eye design tokens. These are the single source of truth for
// brand colors, radii and the Schräge bevel recipe — components must never
// hardcode hex values, px or clip-path polygons, only read from the theme.
const SCHULZ_RED = "#C90023";
const SCHULZ_RED_HOVER = "#A8001D";
const SCHULZ_NAVY = "#002230";
const SCHULZ_TEAL = "#00728E";
const SCHULZ_MUTED = "#8898a6";
const SCHULZ_LABEL = "#4a6573";
const SCHULZ_SUCCESS = "#2E7D32";
const SCHULZ_ORANGE = "#ED701C";
const SCHULZ_GOLD = "#FAB014";
const SCHULZ_PAYPAL = "#0070BA";
const SCHULZ_PAYPAL_HOVER = "#005ea0";
const SCHULZ_PINK_TINT = "#FCE9EC";
const SCHULZ_SUBTLE = "#F4F6F8";
const SCHULZ_GREEN_TINT = "#E6F4EA";
const SCHULZ_ORANGE_TINT = "#FFF3E0";
const SCHULZ_BG_LOGIN = "#FBF7F6";
const SCHULZ_BG_APP = "#ECEAEA";
const SCHULZ_LIVE_GREEN = "#7CFFA0";
const SCHULZ_DISABLED_RED = "#d8a3ac";
const INPUT_BORDER = "rgba(0,34,48,.14)";

// Single-sourced bevel ("Schräge") recipe + keyframe names + custom radii.
// Co-located as plain objects so the module augmentation below can type them.
const schraege = {
  clip: "polygon(82% 0,100% 0,100% 100%,75% 100%)",
  clipDeep: "polygon(78% 0,100% 0,100% 100%,62% 100%)",
  overlay: "rgba(0,0,0,.18)",
  overlayLight: "rgba(255,255,255,.04)",
} as const;

const radii = {
  sm: 11,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 20,
} as const;

const keyframes = {
  pulseDot: "pulseDot",
  slideDown: "slideDown",
  spin360: "spin360",
} as const;

const dsTokens = {
  redHover: SCHULZ_RED_HOVER,
  paypalHover: SCHULZ_PAYPAL_HOVER,
  liveGreen: SCHULZ_LIVE_GREEN,
  disabledRed: SCHULZ_DISABLED_RED,
  greenTint: SCHULZ_GREEN_TINT,
  orangeTint: SCHULZ_ORANGE_TINT,
  inputBorder: INPUT_BORDER,
} as const;

type Schraege = typeof schraege;
type Radii = typeof radii;
type Keyframes = typeof keyframes;
type DsTokens = typeof dsTokens;

// Module augmentation: register custom palette colors, the Schräge recipe, the
// radii scale, the keyframe-name tokens and the brand-specific tokens so they
// are fully typed everywhere the theme is consumed.
declare module "@mui/material/styles" {
  interface Palette {
    navy: Palette["primary"];
    teal: Palette["primary"];
    muted: Palette["primary"];
    label: Palette["primary"];
    gold: Palette["primary"];
    paypal: Palette["primary"];
    pinkTint: Palette["primary"];
    subtle: Palette["primary"];
  }
  interface PaletteOptions {
    navy?: PaletteOptions["primary"];
    teal?: PaletteOptions["primary"];
    muted?: PaletteOptions["primary"];
    label?: PaletteOptions["primary"];
    gold?: PaletteOptions["primary"];
    paypal?: PaletteOptions["primary"];
    pinkTint?: PaletteOptions["primary"];
    subtle?: PaletteOptions["primary"];
  }
  interface TypeBackground {
    login: string;
    app: string;
  }
  interface Theme {
    schraege: Schraege;
    radii: Radii;
    keyframes: Keyframes;
    ds: DsTokens;
  }
  interface ThemeOptions {
    schraege?: Schraege;
    radii?: Radii;
    keyframes?: Keyframes;
    ds?: DsTokens;
  }
  interface TypographyVariants {
    eyebrow: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    eyebrow?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    eyebrow: true;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    navy: true;
    teal: true;
    paypal: true;
  }
}

declare module "@mui/material/AppBar" {
  interface AppBarPropsColorOverrides {
    navy: true;
  }
}

declare module "@mui/material/SvgIcon" {
  interface SvgIconPropsColorOverrides {
    navy: true;
    teal: true;
    muted: true;
    label: true;
    gold: true;
    paypal: true;
  }
}

export const theme = createTheme({
  schraege,
  radii,
  keyframes,
  ds: dsTokens,
  palette: {
    primary: {
      main: SCHULZ_RED,
      dark: SCHULZ_RED_HOVER,
      contrastText: "#FFFFFF",
    },
    navy: {
      main: SCHULZ_NAVY,
      contrastText: "#FFFFFF",
    },
    teal: {
      main: SCHULZ_TEAL,
      contrastText: "#FFFFFF",
    },
    muted: {
      main: SCHULZ_MUTED,
      contrastText: "#FFFFFF",
    },
    label: {
      main: SCHULZ_LABEL,
      contrastText: "#FFFFFF",
    },
    success: {
      main: SCHULZ_SUCCESS,
      contrastText: "#FFFFFF",
    },
    warning: {
      main: SCHULZ_ORANGE,
      contrastText: "#FFFFFF",
    },
    gold: {
      main: SCHULZ_GOLD,
      contrastText: "#FFFFFF",
    },
    paypal: {
      main: SCHULZ_PAYPAL,
      dark: SCHULZ_PAYPAL_HOVER,
      contrastText: "#FFFFFF",
    },
    pinkTint: {
      main: SCHULZ_PINK_TINT,
      contrastText: SCHULZ_RED,
    },
    subtle: {
      main: SCHULZ_SUBTLE,
      contrastText: SCHULZ_NAVY,
    },
    background: {
      default: SCHULZ_BG_APP,
      paper: "#FFFFFF",
      login: SCHULZ_BG_LOGIN,
      app: SCHULZ_BG_APP,
    },
    text: {
      primary: SCHULZ_NAVY,
      secondary: SCHULZ_MUTED,
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
      fontWeight: 700,
      textTransform: "none",
    },
    eyebrow: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: SCHULZ_MUTED,
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
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          eyebrow: "div",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          backgroundColor: "#FFFFFF",
          "& .MuiOutlinedInput-notchedOutline": {
            borderWidth: "1.5px",
            borderColor: INPUT_BORDER,
          },
        },
      },
    },
  },
});
