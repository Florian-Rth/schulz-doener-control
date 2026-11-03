import Dialog from "@mui/material/Dialog";
import Stack from "@mui/material/Stack";
import type { FC } from "react";
import type { PrintLine } from "@/features/home";
import { useThekenModus } from "../../hooks/use-theken-modus";
import { ThekenFinish } from "./internal/ThekenFinish";
import { ThekenHeader } from "./internal/ThekenHeader";
import { ThekenNav } from "./internal/ThekenNav";
import { ThekenOrderScreen } from "./internal/ThekenOrderScreen";
import { ThekenContext } from "./theken-context";

interface ThekenModusProps {
  /** The numbered print lines, in sheet order. */
  lines: PrintLine[];
  open: boolean;
  onClose: () => void;
}

interface ThekenBodyProps {
  lines: PrintLine[];
  onClose: () => void;
}

// Mounted only while the dialog is open: every opening starts at order 1 with
// fresh playful lines, and the wake lock lives exactly as long as the dialog.
const ThekenBody: FC<ThekenBodyProps> = ({ lines, onClose }) => {
  const theken = useThekenModus({ lines, onClose });

  return (
    <ThekenContext.Provider value={theken}>
      <Stack
        onKeyDown={theken.onKeyDown}
        onTouchStart={theken.onTouchStart}
        onTouchEnd={theken.onTouchEnd}
        sx={{ height: "100%", minHeight: 0 }}
      >
        <ThekenHeader />
        {theken.isFinished ? <ThekenFinish /> : <ThekenOrderScreen />}
        <ThekenNav />
      </Stack>
    </ThekenContext.Provider>
  );
};

// The Abholer's Theken-Modus: a full-screen stepper through today's orders, one
// per screen in huge type, to read out to the Dönermann. Bread-based Döner
// assemble themselves in 3D; everything else gets a big product card.
export const ThekenModus: FC<ThekenModusProps> = ({ lines, open, onClose }) => {
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      aria-labelledby="theken-modus-title"
      slotProps={{ paper: { sx: { backgroundColor: "navy.main" } } }}
    >
      <ThekenBody lines={lines} onClose={onClose} />
    </Dialog>
  );
};
