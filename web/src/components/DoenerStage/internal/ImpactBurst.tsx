import Typography from "@mui/material/Typography";
import type { FC } from "react";
import type { ImpactWord } from "../use-impact-word";

interface ImpactBurstProps {
  word: ImpactWord | null;
}

// Comic lettering over the stage. Decorative only — hidden from screen readers
// and gone entirely under prefers-reduced-motion.
export const ImpactBurst: FC<ImpactBurstProps> = ({ word }) => {
  if (word === null) {
    return null;
  }
  return (
    <Typography
      key={word.id}
      aria-hidden
      sx={(theme) => ({
        position: "absolute",
        top: "14%",
        left: 0,
        right: 0,
        textAlign: "center",
        pointerEvents: "none",
        fontSize: "2.75rem",
        fontWeight: 900,
        fontStyle: "italic",
        letterSpacing: "0.02em",
        color: theme.palette.gold.main,
        WebkitTextStroke: `2px ${theme.palette.primary.main}`,
        textShadow: `4px 4px 0 ${theme.palette.primary.main}`,
        opacity: 0,
        animation: `${theme.keyframes.impactPop} 1.1s ease-out forwards`,
        "@media (prefers-reduced-motion: reduce)": { display: "none" },
      })}
    >
      {word.text}
    </Typography>
  );
};
