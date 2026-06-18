import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC, ReactNode } from "react";
import { PageLayoutContent } from "./PageLayoutContent";
import { PageLayoutHeader } from "./PageLayoutHeader";

type PageBackground = "login" | "app";

interface PageLayoutProps {
  children: ReactNode;
  /** Which background token to paint the mobile column. */
  bg?: PageBackground;
  /** Height of the top safe-area spacer in px (mock uses 54 / 64). */
  safeAreaTop?: number;
  sx?: SxProps<Theme>;
}

interface PageLayoutComponent extends FC<PageLayoutProps> {
  Header: typeof PageLayoutHeader;
  Content: typeof PageLayoutContent;
}

// Mobile-first column page shell with a top safe-area spacer. Compound: compose
// with PageLayout.Header + PageLayout.Content. Layout only.
const PageLayoutBase: FC<PageLayoutProps> = ({ children, bg = "app", safeAreaTop = 54, sx }) => {
  return (
    <Stack
      sx={[
        (theme) => ({
          minHeight: "100%",
          width: "100%",
          px: 2,
          pb: 4.5,
          gap: 1.5,
          backgroundColor: theme.palette.background[bg],
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack sx={{ height: `${safeAreaTop}px`, flexShrink: 0 }} aria-hidden />
      {children}
    </Stack>
  );
};

export const PageLayout: PageLayoutComponent = Object.assign(PageLayoutBase, {
  Header: PageLayoutHeader,
  Content: PageLayoutContent,
});
