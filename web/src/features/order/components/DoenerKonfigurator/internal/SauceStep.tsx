import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MultiSelectChips, PrimaryButton } from "@/components";
import { konfiguratorCopy } from "../../../copy";
import { useKonfiguratorContext } from "../konfigurator-context";
import { useFunnyLine } from "../use-funny-line";

// Soße: every chip pours one sauce over the filling (or takes it back off).
export const SauceStep: FC = () => {
  const { sauceOptions, sauces, toggleSauce, next } = useKonfiguratorContext();
  const nextLabel = useFunnyLine(konfiguratorCopy.sauceNext);
  const skipLabel = useFunnyLine(konfiguratorCopy.sauceSkip);

  return (
    <Stack sx={{ gap: 1.5 }}>
      <Typography sx={{ fontSize: "0.75rem", color: "label.main" }}>
        {konfiguratorCopy.sauceHint}
      </Typography>
      <MultiSelectChips
        options={sauceOptions.map((option) => ({
          value: option.key,
          label: option.label,
          emoji: option.icon ?? undefined,
        }))}
        value={sauces}
        onToggle={toggleSauce}
      />
      <PrimaryButton onClick={next} startIcon="chevron_right">
        {sauces.length === 0 ? skipLabel : nextLabel}
      </PrimaryButton>
    </Stack>
  );
};
