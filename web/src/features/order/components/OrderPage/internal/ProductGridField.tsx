import Box from "@mui/material/Box";
import type { FC } from "react";
import { ProductCard } from "@/components";
import { useOrderFormContext } from "../../../order-context";

// The 2-column product grid. Reads the menu + selected product from context and
// drives selection through the context's selectProduct (which also resets the
// kind-specific fields). Layout + thin selection binding.
export const ProductGridField: FC = () => {
  const { menu, form, selectProduct } = useOrderFormContext();
  const selectedId = form.watch("productId");

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
            selectProduct(item.id);
          }}
        />
      ))}
    </Box>
  );
};
