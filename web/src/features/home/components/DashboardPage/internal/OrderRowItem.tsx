import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Avatar } from "@/components";
import type { OrderRow } from "../../../types";

interface OrderRowItemProps {
  order: OrderRow;
}

// One participant's order line: avatar + product (bold) over "person · desc" +
// the price on the right.
export const OrderRowItem: FC<OrderRowItemProps> = ({ order }) => {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 1.375,
        py: 1.125,
        borderBottom: "1px solid rgba(0,34,48,.07)",
      }}
    >
      <Avatar displayName={order.personName} colorHex={order.avatarColorHex} size={36} />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "navy.main" }}>
          {order.productLabel}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: "muted.main",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {order.personName} · {order.description}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "navy.main" }}>
        {order.priceLabel} €
      </Typography>
    </Stack>
  );
};
