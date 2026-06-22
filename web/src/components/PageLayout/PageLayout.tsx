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
  sx?: SxProps<Theme>;
}

interface PageLayoutComponent extends FC<PageLayoutProps> {
  Header: typeof PageLayoutHeader;
  Content: typeof PageLayoutContent;
}

// Mobile-first column page shell. The top inset is a small base gap plus the
// device-driven safe-area inset (zero on a normal browser, the real notch inset on a
// standalone iOS PWA). Compound: compose with PageLayout.Header + PageLayout.Content. Layout only.
const PageLayoutBase: FC<PageLayoutProps> = ({ children, bg = "app", sx }) => {
  return (
    <Stack
      sx={[
        (theme) => ({
          minHeight: "100%",
          width: "100%",
          px: 2,
          pb: 4.5,
          gap: 1.5,
          paddingTop: `calc(${theme.spacing(2)} + env(safe-area-inset-top, 0px))`,
          backgroundColor: theme.palette.background[bg],
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Stack>
  );
};

export const PageLayout: PageLayoutComponent = Object.assign(PageLayoutBase, {
  Header: PageLayoutHeader,
  Content: PageLayoutContent,
});
