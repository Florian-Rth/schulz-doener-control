import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC, ReactNode } from "react";

interface PageLayoutHeaderProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

// Header slot of the page shell — typically holds a RedChromeSurface. Layout
// only; sets no positioning margin (the shell controls spacing).
export const PageLayoutHeader: FC<PageLayoutHeaderProps> = ({ children, sx }) => {
  return (
    <Stack component="header" sx={[{ width: "100%" }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {children}
    </Stack>
  );
};
