import GlobalStyles from "@mui/material/GlobalStyles";
import { useTheme } from "@mui/material/styles";
import type { FC } from "react";

// Registers the three Machine-Eye keyframes once, application-wide, so any
// component can reference them by the name token in `theme.keyframes`. Also
// roots the document at full height so that the `100%`/`100dvh` page shells
// resolve against the viewport rather than an auto-height body. Under
// `prefers-reduced-motion: reduce` the decorative/infinite animations (the
// pulsing LiveDot, the toast slide-in and any spinner) are switched off so the
// app respects the OS-level motion preference.
export const AppGlobalStyles: FC = () => {
  const theme = useTheme();

  return (
    <GlobalStyles
      styles={{
        "html, body": { height: "100%", margin: 0 },
        // `#root` carries the height + viewport fallback chain so every page
        // shell's `minHeight: 100%`/`100dvh` resolves against the viewport
        // instead of an auto-height body. The array is an emotion CSS fallback
        // (last understood value wins), not a responsive breakpoint set.
        "#root": { height: "100%", minHeight: ["100%", "100vh", "100dvh"] },
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
        // Honour the OS "reduce motion" setting. Emotion hashes the keyframe
        // class names, so we cannot target them by token; instead we neutralise
        // animations app-wide (covers the infinite pulseDot, the slideDown toast
        // entrance and any spin360 spinner) with the standard near-instant reset.
        // The LiveDot keeps its colour but stops pulsing — its lingering ring
        // box-shadow is cleared so it reads as a plain static dot.
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
            scrollBehavior: "auto !important",
          },
          '[data-testid="live-dot"]': {
            animation: "none !important",
            boxShadow: "none !important",
          },
        },
      }}
    />
  );
};
