import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { MaterialIcon, PrimaryButton } from "@/components";
import { thekenCopy } from "../../../copy";
import { useThekenContext } from "../theken-context";

// Bottom bar: Zurück / Nächster while stepping, restart / close on the final screen.
export const ThekenNav: FC = () => {
  const { isFinished, isLastLine, canGoBack, next, back, restart, close } = useThekenContext();

  return (
    <Stack direction="row" sx={{ gap: 1.25, px: 2.25, pt: 1.5, pb: 2.5 }}>
      <Button
        variant="outlined"
        color="inherit"
        onClick={isFinished ? restart : back}
        disabled={!isFinished && !canGoBack}
        startIcon={<MaterialIcon name="arrow_back" sx={{ fontSize: 22 }} />}
        sx={(theme) => ({
          flex: 1,
          py: 2,
          borderRadius: `${theme.radii.md}px`,
          borderWidth: "1.5px",
          fontSize: "1rem",
          fontWeight: 700,
          color: "navy.contrastText",
          "&.Mui-disabled": { color: "rgba(255,255,255,.35)", borderColor: "rgba(255,255,255,.2)" },
        })}
      >
        {isFinished ? thekenCopy.finishRestart : thekenCopy.back}
      </Button>
      <Stack sx={{ flex: 1.4 }}>
        {isFinished ? (
          <PrimaryButton onClick={close} startIcon="check_circle">
            {thekenCopy.finishClose}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={next} startIcon={isLastLine ? "check_circle" : "chevron_right"}>
            {isLastLine ? thekenCopy.finish : thekenCopy.next}
          </PrimaryButton>
        )}
      </Stack>
    </Stack>
  );
};
