import Dialog from "@mui/material/Dialog";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { PrimaryButton } from "@/components";
import type { Celebration } from "../../celebration";
import { bestellFeierCopy } from "../../copy";
import { useBestellFeier } from "../../hooks/use-bestell-feier";
import { FeierDoener } from "./internal/FeierDoener";
import { FeierIcon } from "./internal/FeierIcon";

interface BestellFeierProps {
  celebration: Celebration;
  /** Called once when the celebration ends (tap, "Weiter", Escape or timeout). */
  onDone: () => void;
}

// The short full-screen party after "Bestellung abgeben": the colleague's own
// Döner spins on the turntable (or their product icon in a confetti shower)
// under one big random line. Tap anywhere to skip; it moves on by itself.
export const BestellFeier: FC<BestellFeierProps> = ({ celebration, onDone }) => {
  const { seed, line, reducedMotion, finish } = useBestellFeier(onDone);
  // Reduced motion: no spinning 3D, just the static card.
  const build = reducedMotion ? null : celebration.build;

  return (
    <Dialog
      fullScreen
      open
      onClose={finish}
      aria-labelledby="bestell-feier-line"
      slotProps={{
        paper: {
          onClick: finish,
          sx: { backgroundColor: "navy.main", cursor: "pointer" },
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack sx={{ gap: 1, px: 3, pt: 5, textAlign: "center" }}>
          <Typography variant="eyebrow" sx={{ color: "gold.main" }}>
            {bestellFeierCopy.eyebrow}
          </Typography>
          <Typography
            id="bestell-feier-line"
            component="h2"
            sx={{
              fontSize: "1.875rem",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "navy.contrastText",
            }}
          >
            {line}
          </Typography>
        </Stack>

        {build !== null ? (
          <FeierDoener build={build} seed={seed} />
        ) : (
          <FeierIcon icon={celebration.icon} confetti={!reducedMotion} />
        )}

        <Stack sx={{ gap: 1.25, px: 3, pb: 4, alignItems: "center" }}>
          <PrimaryButton onClick={finish}>{bestellFeierCopy.next}</PrimaryButton>
          <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,.6)" }}>
            {bestellFeierCopy.skipHint}
          </Typography>
        </Stack>
      </Stack>
    </Dialog>
  );
};
