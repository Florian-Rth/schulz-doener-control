import GlobalStyles from "@mui/material/GlobalStyles";
import { useTheme } from "@mui/material/styles";
import type { FC } from "react";

// Registers the three Machine-Eye keyframes once, application-wide, so any
// component can reference them by the name token in `theme.keyframes`.
export const AppGlobalStyles: FC = () => {
  const theme = useTheme();

  return (
    <GlobalStyles
      styles={{
        [`@keyframes ${theme.keyframes.pulseDot}`]: {
          "0%": { boxShadow: "0 0 0 0 rgba(46,125,50,.55)" },
          "70%": { boxShadow: "0 0 0 7px rgba(46,125,50,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(46,125,50,0)" },
        },
        [`@keyframes ${theme.keyframes.slideDown}`]: {
          from: { opacity: 0, transform: "translateY(-14px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        [`@keyframes ${theme.keyframes.spin360}`]: {
          to: { transform: "rotate(360deg)" },
        },
      }}
    />
  );
};
