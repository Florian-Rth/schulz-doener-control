import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { konfiguratorCopy } from "../../../copy";
import { useKonfiguratorContext } from "../konfigurator-context";
import { useDoenerSummary } from "../use-doener-summary";
import { useFunnyLine } from "../use-funny-line";

interface SummaryRowProps {
  label: string;
  value: string;
}

const SummaryRow: FC<SummaryRowProps> = ({ label, value }) => (
  <Stack direction="row" sx={{ gap: 1.5, alignItems: "baseline" }}>
    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main", minWidth: 64 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
      {value}
    </Typography>
  </Stack>
);

// The finished Döner on the turntable: summary, a quip, and apply / restart.
export const DoneStep: FC = () => {
  const { apply, restart } = useKonfiguratorContext();
  const summary = useDoenerSummary();
  const applyLabel = useFunnyLine(konfiguratorCopy.apply);
  const restartLabel = useFunnyLine(konfiguratorCopy.restart);

  return (
    <Stack sx={{ gap: 1.5 }}>
      <Stack sx={{ gap: 0.5 }}>
        <SummaryRow label={konfiguratorCopy.summaryMeat} value={summary.meat} />
        <SummaryRow label={konfiguratorCopy.summaryVeggies} value={summary.veggies} />
        <SummaryRow label={konfiguratorCopy.summarySauces} value={summary.sauces} />
      </Stack>
      <Typography sx={{ fontSize: "0.8125rem", color: "label.main" }}>{summary.quip}</Typography>
      <PrimaryButton onClick={apply} startIcon="check_circle">
        {applyLabel}
      </PrimaryButton>
      <GhostButton onClick={restart}>{restartLabel}</GhostButton>
    </Stack>
  );
};
