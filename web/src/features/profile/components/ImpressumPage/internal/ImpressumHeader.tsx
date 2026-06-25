import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon, RedChromeSurface } from "@/components";
import { impressumCopy } from "../../../copy";

interface ImpressumHeaderProps {
  onBack: () => void;
}

// Red chrome header for the Impressum: back button + eyebrow/title. Mirrors the
// settings hub header so the profile pages share one chrome.
export const ImpressumHeader: FC<ImpressumHeaderProps> = ({ onBack }) => {
  return (
    <RedChromeSurface
      start={
        <ButtonBase
          aria-label={impressumCopy.backIconLabel}
          onClick={onBack}
          sx={(theme) => ({
            width: 36,
            height: 36,
            borderRadius: `${theme.radii.sm - 1}px`,
            backgroundColor: "rgba(255,255,255,.16)",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <MaterialIcon name="arrow_back" sx={{ fontSize: 22, color: "primary.contrastText" }} />
        </ButtonBase>
      }
    >
      <Stack>
        <Typography variant="eyebrow" sx={{ color: "rgba(255,255,255,.78)" }}>
          {impressumCopy.eyebrow}
        </Typography>
        <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "primary.contrastText" }}>
          {impressumCopy.title}
        </Typography>
      </Stack>
    </RedChromeSurface>
  );
};
