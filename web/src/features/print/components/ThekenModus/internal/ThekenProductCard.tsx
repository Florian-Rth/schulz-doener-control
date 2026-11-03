import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import type { PrintLine } from "@/features/home";
import { pickLine } from "@/lib/funny-lines";
import { thekenCopy } from "../../../copy";
import { useThekenContext } from "../theken-context";

interface ThekenProductCardProps {
  line: PrintLine;
}

// Pizza, Dönerbox & Co.: no 3D stage — a big product icon with its article type.
export const ThekenProductCard: FC<ThekenProductCardProps> = ({ line }) => {
  const { seed } = useThekenContext();

  return (
    <Stack
      data-testid="theken-product-card"
      sx={(theme) => ({
        flex: 1,
        mx: 2.25,
        gap: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: `${theme.radii.xl}px`,
        backgroundColor: "rgba(255,255,255,.08)",
      })}
    >
      <MaterialIcon
        name={line.productIcon ?? "restaurant"}
        sx={{ fontSize: "clamp(4.5rem, 24vw, 8rem)", color: "navy.contrastText" }}
      />
      <Typography
        sx={{
          fontSize: "1.25rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "navy.contrastText",
        }}
      >
        {line.section}
      </Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.7)" }}>
        {pickLine(thekenCopy.otherProduct, seed + line.number)}
      </Typography>
    </Stack>
  );
};
