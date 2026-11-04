import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { keyframes } from "@mui/material/styles";
import type { FC } from "react";
import { MaterialIcon } from "@/components";

interface FeierIconProps {
  /** Material icon of the ordered product. */
  icon: string;
  /** Falling confetti behind the icon (off under prefers-reduced-motion). */
  confetti: boolean;
}

const fall = keyframes`
  0% { transform: translateY(-15vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(105vh) rotate(720deg); opacity: 0.85; }
`;

const pop = keyframes`
  0% { transform: scale(0.2) rotate(-20deg); }
  60% { transform: scale(1.15) rotate(6deg); }
  100% { transform: scale(1) rotate(0deg); }
`;

const CONFETTI_COLORS = [
  "primary.main",
  "gold.main",
  "teal.main",
  "success.main",
  "navy.contrastText",
] as const;

// Spread deterministically over the width; staggered so it rains, not drops.
const PIECES = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: (index * 37) % 100,
  delayS: (index % 7) * 0.22,
  durationS: 2.2 + (index % 5) * 0.35,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  round: index % 3 === 0,
}));

// The non-3D celebration (pizza, boxes, reduced motion): a big product icon,
// optionally under a shower of CSS confetti.
export const FeierIcon: FC<FeierIconProps> = ({ icon, confetti }) => (
  <Stack
    sx={{
      flex: 1,
      minHeight: 0,
      position: "relative",
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {confetti
      ? PIECES.map((piece) => (
          <Box
            key={piece.id}
            aria-hidden
            data-testid="konfetti"
            sx={(theme) => ({
              position: "absolute",
              top: 0,
              left: `${piece.left}%`,
              width: theme.spacing(1),
              height: piece.round ? theme.spacing(1) : theme.spacing(1.75),
              borderRadius: piece.round ? "50%" : `${theme.radii.sm / 4}px`,
              backgroundColor: piece.color,
              opacity: 0,
              animation: `${fall} ${piece.durationS}s linear ${piece.delayS}s infinite`,
            })}
          />
        ))
      : null}
    <MaterialIcon
      name={icon}
      sx={{
        fontSize: "9rem",
        color: "primary.main",
        animation: confetti ? `${pop} .6s ease-out` : "none",
      }}
    />
  </Stack>
);
