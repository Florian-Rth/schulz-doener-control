import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { gameCopy } from "../../../copy";
import { useWeitwurfContext } from "../../../weitwurf-context";

// Names the piece held at the bottom of the stage. Clicks pass through to the canvas.
export const NextPieceLabel: FC = () => {
  const { nextKind } = useWeitwurfContext();

  return (
    <Typography
      aria-live="polite"
      sx={(theme) => ({
        position: "absolute",
        left: "50%",
        bottom: theme.spacing(2),
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "navy.contrastText",
        backgroundColor: "rgba(255,255,255,.12)",
        borderRadius: `${theme.radii.pill}px`,
        px: 1.5,
        py: 0.5,
      })}
    >
      {gameCopy.nextPiece(gameCopy.pieceNames[nextKind])}
    </Typography>
  );
};
