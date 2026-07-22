import type { Field, Menu } from "../types";

// Resolves the ordered field defs to render for the line's selected product:
// find the product, follow its categoryKey to the category, return that
// category's fields. Empty when no product is picked or the product has no
// category. Pure value-in/value-out — no effects.
export const useOrderConfig = (menu: Menu, productId: string): Field[] => {
  if (productId === "") {
    return [];
  }
  const item = menu.items.find((entry) => entry.id === productId);
  if (item === undefined || item.categoryKey === null) {
    return [];
  }
  const category = menu.categories.find((entry) => entry.key === item.categoryKey);
  return category?.fields ?? [];
};
