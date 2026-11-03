import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { useWatch } from "react-hook-form";
import { MaterialIcon } from "@/components";
import { orderCopy } from "../../../copy";
import { useOrderConfig } from "../../../hooks/use-order-config";
import { centsToLabel } from "../../../money";
import {
  OrderLineContext,
  type OrderLineContextValue,
  useOrderFormContext,
} from "../../../order-context";
import { FieldRenderer } from "./FieldRenderer";
import { KonfiguratorLauncher } from "./KonfiguratorLauncher";
import { PriceField } from "./PriceField";
import { ProductGridField } from "./ProductGridField";
import { QuantityField } from "./QuantityField";
import { SectionLabel } from "./SectionLabel";

interface OrderLineCardProps {
  index: number;
}

// One order line: the per-line provider (OrderLineContext) plus the product grid,
// the dynamically rendered category fields, the price/quantity inputs, a per-line
// total and a remove control. The fields come from the selected product's
// category — a FieldRenderer per field, in order. All field state lives in the
// form context.
export const OrderLineCard: FC<OrderLineCardProps> = ({ index }) => {
  const { form, menu, fields, removeLine } = useOrderFormContext();
  const productId = useWatch({ control: form.control, name: `lines.${index}.productId` });
  const priceCents = useWatch({ control: form.control, name: `lines.${index}.priceCents` });
  const quantity = useWatch({ control: form.control, name: `lines.${index}.quantity` });
  const lineFields = useOrderConfig(menu, productId);

  const value: OrderLineContextValue = {
    index,
    fields: lineFields,
  };

  const lineTotalCents = (priceCents ?? 0) * (quantity ?? 0);

  return (
    <OrderLineContext.Provider value={value}>
      <Stack
        sx={(theme) => ({
          gap: 2,
          backgroundColor: theme.palette.background.paper,
          borderRadius: `${theme.radii.lg}px`,
          boxShadow: "0 1px 3px rgba(0,0,0,.10)",
          p: 1.875,
        })}
      >
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <SectionLabel variant="eyebrow" label={`${orderCopy.lineEyebrow} ${index + 1}`} />
          {fields.length > 1 ? (
            <Button
              type="button"
              color="primary"
              size="small"
              onClick={() => {
                removeLine(index);
              }}
              startIcon={<MaterialIcon name="remove" sx={{ fontSize: 18 }} />}
              sx={{ fontSize: "0.75rem", fontWeight: 700, minWidth: 0 }}
            >
              {orderCopy.removeLine}
            </Button>
          ) : null}
        </Stack>

        <Stack sx={{ gap: 1.25 }}>
          <SectionLabel variant="eyebrow" label={orderCopy.productSection} />
          <ProductGridField />
        </Stack>

        <KonfiguratorLauncher />

        {lineFields.map((field) => (
          <FieldRenderer key={field.key} field={field} index={index} />
        ))}

        <PriceField />
        <QuantityField />

        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main" }}>
            {orderCopy.orderTotal}
          </Typography>
          <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "navy.main" }}>
            {centsToLabel(lineTotalCents)}
          </Typography>
        </Stack>
      </Stack>
    </OrderLineContext.Provider>
  );
};
