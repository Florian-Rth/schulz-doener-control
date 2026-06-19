import Box from "@mui/material/Box";
import type { FC } from "react";
import { useWatch } from "react-hook-form";
import { ProductCard } from "@/components";
import { useOrderFormContext, useOrderLineContext } from "../../../order-context";

// The 2-column product grid for one line. Reads the menu + this line's selected
// product from context and drives selection through selectProduct (which also
// resets the kind-specific fields). Layout + thin selection binding.
export const ProductGridField: FC = () => {
  const { menu, form, selectProduct } = useOrderFormContext();
  const { index } = useOrderLineContext();
  const selectedId = useWatch({ control: form.control, name: `lines.${index}.productId` });

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
      {menu.items.map((item) => (
        <ProductCard
          key={item.id}
          icon={item.materialIcon}
          name={item.name}
          sub={item.note ?? item.defaultPriceLabel}
          insider={item.isInsider}
          selected={selectedId === item.id}
          onSelect={() => {
            selectProduct(index, item.id);
          }}
        />
      ))}
    </Box>
  );
};
