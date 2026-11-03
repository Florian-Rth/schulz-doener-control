import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { konfiguratorCopy } from "../../../copy";
import { useKonfiguratorContext } from "../konfigurator-context";
import { useFunnyLine } from "../use-funny-line";
import { DoneStep } from "./DoneStep";
import { MeatStep } from "./MeatStep";
import { SauceStep } from "./SauceStep";
import { VeggieStep } from "./VeggieStep";

const questionsFor = (
  step: ReturnType<typeof useKonfiguratorContext>["step"],
): readonly string[] => {
  switch (step.kind) {
    case "meat":
      return konfiguratorCopy.meatQuestions;
    case "veggie":
      return step.veggie.questions.map((question) => `${step.veggie.emoji} ${question}`);
    case "sauce":
      return konfiguratorCopy.sauceQuestions;
    case "done":
      return konfiguratorCopy.doneTitles;
  }
};

// White bottom sheet with the current question and its answers — the counter
// conversation, one question at a time.
export const StepPanel: FC = () => {
  const { step, canGoBack, back } = useKonfiguratorContext();
  const question = useFunnyLine(questionsFor(step));

  return (
    <Stack
      sx={(theme) => ({
        gap: 1.75,
        px: 2.25,
        pt: 2,
        pb: "calc(20px + env(safe-area-inset-bottom))",
        backgroundColor: theme.palette.background.paper,
        borderTopLeftRadius: `${theme.radii.xl}px`,
        borderTopRightRadius: `${theme.radii.xl}px`,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography
          aria-live="polite"
          sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "navy.main" }}
        >
          {question}
        </Typography>
        {canGoBack ? (
          <Button
            type="button"
            size="small"
            onClick={back}
            startIcon={<MaterialIcon name="arrow_back" sx={{ fontSize: 18 }} />}
            sx={{ fontSize: "0.75rem", fontWeight: 700, minWidth: 0, flexShrink: 0 }}
          >
            {konfiguratorCopy.back}
          </Button>
        ) : null}
      </Stack>
      {step.kind === "meat" ? <MeatStep /> : null}
      {step.kind === "veggie" ? <VeggieStep /> : null}
      {step.kind === "sauce" ? <SauceStep /> : null}
      {step.kind === "done" ? <DoneStep /> : null}
    </Stack>
  );
};
