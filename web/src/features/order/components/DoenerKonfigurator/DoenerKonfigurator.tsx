import Dialog from "@mui/material/Dialog";
import Stack from "@mui/material/Stack";
import { type FC, useState } from "react";
import { rollSeed } from "@/lib/funny-lines";
import { useDoenerKonfigurator } from "../../hooks/use-doener-konfigurator";
import { KonfiguratorHeader } from "./internal/KonfiguratorHeader";
import { KonfiguratorStage } from "./internal/KonfiguratorStage";
import { StepPanel } from "./internal/StepPanel";
import { KonfiguratorContext, type KonfiguratorContextValue } from "./konfigurator-context";

interface DoenerKonfiguratorProps {
  /** The order line being configured. */
  index: number;
  open: boolean;
  onClose: () => void;
}

interface KonfiguratorBodyProps {
  index: number;
  onClose: () => void;
}

// Mounted only while the dialog is open, so every opening starts from the
// line's current answers.
const KonfiguratorBody: FC<KonfiguratorBodyProps> = ({ index, onClose }) => {
  const konfigurator = useDoenerKonfigurator({ index, onClose });
  const [lineSeed] = useState(rollSeed);
  const value: KonfiguratorContextValue = { ...konfigurator, onClose, lineSeed };

  return (
    <KonfiguratorContext.Provider value={value}>
      <Stack sx={{ height: "100%" }}>
        <KonfiguratorHeader />
        <KonfiguratorStage />
        <StepPanel />
      </Stack>
    </KonfiguratorContext.Provider>
  );
};

// The Döner-Konfigurator: a full-screen showroom where the Döner is built step
// by step in 3D, like at the counter. Applying writes back into the order line.
export const DoenerKonfigurator: FC<DoenerKonfiguratorProps> = ({ index, open, onClose }) => {
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      aria-labelledby="doener-konfigurator-title"
      slotProps={{ paper: { sx: { backgroundColor: "navy.main" } } }}
    >
      <KonfiguratorBody index={index} onClose={onClose} />
    </Dialog>
  );
};
