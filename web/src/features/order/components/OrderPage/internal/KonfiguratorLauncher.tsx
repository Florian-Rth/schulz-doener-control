import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { useWatch } from "react-hook-form";
import { MaterialIcon } from "@/components";
import { pickLine, rollSeed } from "@/lib/funny-lines";
import { konfiguratorCopy } from "../../../copy";
import { supportsKonfigurator } from "../../../konfigurator";
import { useOrderFormContext, useOrderLineContext } from "../../../order-context";
import { DoenerKonfigurator } from "../../DoenerKonfigurator";

// Entry point into the 3D Döner-Konfigurator, shown only for bread-based Döner
// products. A navy showroom tile so it reads as the "premium" path.
export const KonfiguratorLauncher: FC = () => {
  const { form, menu } = useOrderFormContext();
  const { index } = useOrderLineContext();
  const productId = useWatch({ control: form.control, name: `lines.${index}.productId` });
  const [open, setOpen] = useState(false);
  const [sublineSeed] = useState(rollSeed);

  const item = menu.items.find((entry) => entry.id === productId);
  const category = menu.categories.find((entry) => entry.key === item?.categoryKey);
  if (!supportsKonfigurator(item, category)) {
    return null;
  }

  return (
    <>
      <ButtonBase
        onClick={() => {
          setOpen(true);
        }}
        sx={(theme) => ({
          justifyContent: "flex-start",
          gap: 1.5,
          px: 1.75,
          py: 1.5,
          borderRadius: `${theme.radii.md}px`,
          backgroundColor: theme.palette.navy.main,
          color: theme.palette.navy.contrastText,
          textAlign: "left",
        })}
      >
        <MaterialIcon name="view_in_ar" sx={{ fontSize: 28, color: "primary.main" }} />
        <Stack sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>
            {konfiguratorCopy.launcherTitle}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,.72)" }}>
            {pickLine(konfiguratorCopy.launcherSublines, sublineSeed)}
          </Typography>
        </Stack>
        <MaterialIcon name="chevron_right" sx={{ fontSize: 22 }} />
      </ButtonBase>
      <DoenerKonfigurator
        index={index}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
};
