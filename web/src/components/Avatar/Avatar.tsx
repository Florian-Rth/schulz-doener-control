import MuiAvatar from "@mui/material/Avatar";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC } from "react";

interface AvatarProps {
  displayName: string;
  /** Fixed per-user avatar color (e.g. `#00728E`). */
  colorHex: string;
  /** Diameter in px (mock uses 34 / 36 / 38 / 44 / 60). */
  size?: number;
  sx?: SxProps<Theme>;
}

// Derives up to two uppercase initials from a display name. Local to the
// Avatar so it does not collide with `lib/format/initials.ts` (F6's lane).
const initialsOf = (displayName: string): string => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

// Round initials avatar with a fixed per-user color. The color is a real hex
// the backend stores per user, so it is passed as a prop rather than a token.
export const Avatar: FC<AvatarProps> = ({ displayName, colorHex, size = 44, sx }) => {
  return (
    <MuiAvatar
      aria-label={displayName}
      sx={[
        {
          width: size,
          height: size,
          backgroundColor: colorHex,
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: `${Math.round(size * 0.34)}px`,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {initialsOf(displayName)}
    </MuiAvatar>
  );
};
