import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon, RedChromeSurface } from "@/components";
import { orderCopy } from "../../../copy";

interface OrderHeaderProps {
  onBack: () => void;
}

// Red chrome order header with a back button and the title block.
export const OrderHeader: FC<OrderHeaderProps> = ({ onBack }) => {
  return (
    <RedChromeSurface
      start={
        <ButtonBase
          aria-label="Zurück"
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
        <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "primary.contrastText" }}>
          {orderCopy.headerTitle}
        </Typography>
        <Typography sx={{ fontSize: "0.6875rem", color: "rgba(255,255,255,.78)" }}>
          {orderCopy.headerSubline}
        </Typography>
      </Stack>
    </RedChromeSurface>
  );
};
