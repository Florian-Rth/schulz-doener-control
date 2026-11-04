import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import type { FC } from "react";
import { polar, sliceAngle, slicePath } from "./wheel-geometry";

export interface FortuneWheelSlice {
  label: string;
  color: string;
}

interface FortuneWheelProps {
  slices: readonly FortuneWheelSlice[];
  /** Current rotation in degrees (from useFortuneWheel). */
  rotation: number;
  /** Slice to spotlight once the wheel has landed; null while spinning / before the reveal. */
  highlightIndex: number | null;
  ariaLabel: string;
  sx?: SxProps<Theme>;
}

const RADIUS = 92;
const LABEL_RADIUS = 58;
const MAX_LABEL_LENGTH = 10;

const shorten = (label: string): string =>
  label.length > MAX_LABEL_LENGTH ? `${label.slice(0, MAX_LABEL_LENGTH - 1)}…` : label;

// A presentational SVG fortune wheel: coloured slices, a fixed pointer at 12 o'clock and a Döner
// hub. Rotation and the reveal are driven from outside (see useFortuneWheel).
export const FortuneWheel: FC<FortuneWheelProps> = ({
  slices,
  rotation,
  highlightIndex,
  ariaLabel,
  sx,
}) => {
  const theme = useTheme();
  const angle = sliceAngle(slices.length);
  const navy = theme.palette.navy.main;
  const white = theme.palette.common.white;
  const gold = theme.palette.gold.main;

  return (
    <Box
      component="svg"
      viewBox="0 0 200 200"
      role="img"
      aria-label={ariaLabel}
      sx={[{ width: "100%", height: "auto", display: "block" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <circle cx="100" cy="100" r={RADIUS + 5} fill={navy} />
      <g transform={`rotate(${rotation} 100 100)`}>
        {slices.length === 1 ? (
          <circle cx="100" cy="100" r={RADIUS} fill={slices[0]?.color} />
        ) : (
          slices.map((slice, index) => (
            <path
              // Slices have no identity beyond their position on this wheel.
              // biome-ignore lint/suspicious/noArrayIndexKey: position IS the identity here
              key={index}
              d={slicePath(slices.length, index, RADIUS)}
              fill={slice.color}
              stroke={white}
              strokeWidth={1.2}
              opacity={highlightIndex === null || highlightIndex === index ? 1 : 0.35}
            />
          ))
        )}
        {slices.map((slice, index) => {
          const centre = (index + 0.5) * angle;
          const point = polar(LABEL_RADIUS, centre);
          return (
            <text
              // biome-ignore lint/suspicious/noArrayIndexKey: position IS the identity here
              key={index}
              x={point.x}
              y={point.y}
              transform={`rotate(${centre - 90} ${point.x} ${point.y})`}
              textAnchor="middle"
              dominantBaseline="central"
              fill={white}
              fontSize={slices.length > 8 ? 8 : 10}
              fontWeight={700}
              fontFamily={theme.typography.fontFamily}
            >
              {shorten(slice.label)}
            </text>
          );
        })}
      </g>
      <circle cx="100" cy="100" r="17" fill={white} stroke={navy} strokeWidth={3} />
      <text x="100" y="101" textAnchor="middle" dominantBaseline="central" fontSize="16">
        🌯
      </text>
      <path
        d="M100 22 L90 2 L110 2 Z"
        fill={highlightIndex === null ? white : gold}
        stroke={navy}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Box>
  );
};
