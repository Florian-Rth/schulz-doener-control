import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Controller } from "react-hook-form";
import { IconChipBox, MaterialIcon, Toggle } from "@/components";
import { orderCopy } from "../../../copy";
import { useOrderFormContext } from "../../../order-context";

// Abholer toggle card: car icon + copy + the red Toggle bound to the RHF
// `isPickup` field. Layout + thin RHF binding.
export const PickupToggleCard: FC = () => {
  const { form } = useOrderFormContext();

  return (
    <Stack
      direction="row"
      sx={(theme) => ({
        alignItems: "center",
        gap: 1.5,
        backgroundColor: theme.palette.background.paper,
        borderRadius: `${theme.radii.lg}px`,
        boxShadow: "0 1px 3px rgba(0,0,0,.10)",
        p: 1.875,
      })}
    >
      <IconChipBox tint="pink">
        <MaterialIcon name="directions_car" sx={{ fontSize: 24, color: "primary.main" }} />
      </IconChipBox>
      <Stack sx={{ flex: 1, minWidth: 0, gap: 0.25 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
          {orderCopy.pickupTitle}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "muted.main", lineHeight: 1.4 }}>
          {orderCopy.pickupSubline}
        </Typography>
      </Stack>
      <Controller
        control={form.control}
        name="isPickup"
        render={({ field }) => (
          <Toggle
            checked={field.value}
            onChange={field.onChange}
            ariaLabel={orderCopy.pickupTitle}
          />
        )}
      />
    </Stack>
  );
};
