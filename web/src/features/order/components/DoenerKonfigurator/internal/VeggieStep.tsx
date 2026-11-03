import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components";
import { konfiguratorCopy } from "../../../copy";
import { VEGGIES } from "../../../konfigurator";
import { useKonfiguratorContext } from "../konfigurator-context";
import { useFunnyLine } from "../use-funny-line";

// One Gemüse question: yes throws it in, no skips it. The first question also
// offers the classic counter shortcut "mit allem".
export const VeggieStep: FC = () => {
  const { step, decideVeggie, takeEverything } = useKonfiguratorContext();
  const isFirst = step.kind === "veggie" && step.veggie.key === VEGGIES[0]?.key;
  const yes = useFunnyLine(konfiguratorCopy.yes);
  const no = useFunnyLine(konfiguratorCopy.no);
  const everything = useFunnyLine(konfiguratorCopy.everything);

  return (
    <Stack sx={{ gap: 1 }}>
      <Stack direction="row" sx={{ gap: 1 }}>
        <SecondaryButton
          onClick={() => {
            decideVeggie(false);
          }}
        >
          {no}
        </SecondaryButton>
        <PrimaryButton
          onClick={() => {
            decideVeggie(true);
          }}
        >
          {yes}
        </PrimaryButton>
      </Stack>
      {isFirst ? <GhostButton onClick={takeEverything}>{everything}</GhostButton> : null}
    </Stack>
  );
};
