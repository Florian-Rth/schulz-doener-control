import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { pickLine } from "@/lib/funny-lines";
import { thekenCopy } from "../../../copy";
import { useThekenContext } from "../theken-context";
import { ThekenDoenerStage } from "./ThekenDoenerStage";
import { ThekenProductCard } from "./ThekenProductCard";

// The sheet description joins its parts with " · " — one part per line reads
// far better from arm's length.
const descriptionParts = (description: string): string[] =>
  description
    .split(" · ")
    .map((part) => part.trim())
    .filter((part) => part !== "");

// One order, readable from across the counter: the big package number, who it
// is for, the product, the 3D Döner (or a product card) and the details in
// very large type.
export const ThekenOrderScreen: FC = () => {
  const { current, index, seed } = useThekenContext();

  if (current === null) {
    return null;
  }

  const productLabel =
    current.quantity > 1 ? `${current.quantity}× ${current.productLabel}` : current.productLabel;

  return (
    <Stack sx={{ flex: 1, minHeight: 0, gap: 1.5 }}>
      <Stack direction="row" sx={{ px: 2.25, gap: 2, alignItems: "center" }}>
        <Stack
          aria-label={`${thekenCopy.numberLabel} ${current.number}`}
          sx={(theme) => ({
            minWidth: 88,
            height: 88,
            px: 1.5,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${theme.radii.xl}px`,
            backgroundColor: "primary.main",
            boxShadow: "0 6px 16px rgba(201,0,35,.35)",
          })}
        >
          <Typography
            sx={{
              fontSize: "3.25rem",
              fontWeight: 800,
              lineHeight: 1,
              color: "primary.contrastText",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {current.number}
          </Typography>
        </Stack>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.25 }}>
          <Typography sx={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.7)" }}>
            {pickLine(thekenCopy.readOut, seed + index)}
          </Typography>
          <Typography
            sx={{
              fontSize: "1.75rem",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "navy.contrastText",
              wordBreak: "break-word",
            }}
          >
            {productLabel}
          </Typography>
          <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Typography
              sx={{ fontSize: "1.0625rem", fontWeight: 600, color: "rgba(255,255,255,.85)" }}
            >
              {current.personName}
            </Typography>
            {current.isPickup ? (
              <Typography
                sx={(theme) => ({
                  px: 1,
                  py: 0.25,
                  borderRadius: `${theme.radii.pill}px`,
                  backgroundColor: "rgba(255,255,255,.14)",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "navy.contrastText",
                })}
              >
                {thekenCopy.pickupBadge}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Stack>

      <Stack sx={{ flex: 1, minHeight: 160 }}>
        {current.isBreadDoener ? (
          <ThekenDoenerStage line={current} />
        ) : (
          <ThekenProductCard line={current} />
        )}
      </Stack>

      <Stack component="ul" sx={{ m: 0, px: 2.25, gap: 0.5, listStyle: "none" }}>
        {descriptionParts(current.description).map((part) => (
          <Typography
            key={part}
            component="li"
            sx={{
              fontSize: "clamp(1.625rem, 7.5vw, 3rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "navy.contrastText",
              wordBreak: "break-word",
            }}
          >
            {part}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
};
