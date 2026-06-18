import FastfoodOutlined from "@mui/icons-material/FastfoodOutlined";
import type { SvgIconOwnProps } from "@mui/material/SvgIcon";
import type { FC } from "react";
import { ICON_MAP, isMaterialIconName } from "./iconMap";

interface MaterialIconProps {
  /** Material Symbols Outlined name, e.g. `kebab_dining`. */
  name: string;
  fontSize?: SvgIconOwnProps["fontSize"];
  color?: SvgIconOwnProps["color"];
  /** Optional explicit pixel/em size and color overrides via sx. */
  sx?: SvgIconOwnProps["sx"];
  titleAccess?: string;
}

// Renders a bundled MUI SVG icon for a Material Symbols string. Unknown names
// fall back to a neutral food glyph so an unexpected backend value never
// crashes the screen.
export const MaterialIcon: FC<MaterialIconProps> = ({ name, fontSize, color, sx, titleAccess }) => {
  const IconComponent = isMaterialIconName(name) ? ICON_MAP[name] : FastfoodOutlined;
  return <IconComponent fontSize={fontSize} color={color} sx={sx} titleAccess={titleAccess} />;
};
