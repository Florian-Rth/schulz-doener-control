import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC, ReactNode } from "react";

interface PageLayoutContentProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

// Content slot of the page shell — the scrolling column of cards/sections.
export const PageLayoutContent: FC<PageLayoutContentProps> = ({ children, sx }) => {
  return (
    <Stack component="main" sx={[{ width: "100%", gap: 1.5 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {children}
    </Stack>
  );
};
