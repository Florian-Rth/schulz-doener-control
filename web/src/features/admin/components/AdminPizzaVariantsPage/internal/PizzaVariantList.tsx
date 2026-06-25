import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { pizzaVariantsCopy } from "../../../copy";
import type { AdminPizzaVariant } from "../../../types";
import { PizzaVariantCard } from "./PizzaVariantCard";

interface PizzaVariantListProps {
  items: AdminPizzaVariant[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (variant: AdminPizzaVariant) => void;
  onDelete: (variant: AdminPizzaVariant) => void;
}

const Notice: FC<{ text: string; isError?: boolean }> = ({ text, isError }) => {
  return (
    <Typography
      role={isError === true ? "alert" : undefined}
      sx={{
        fontSize: "0.875rem",
        color: isError === true ? "primary.main" : "muted.main",
        textAlign: "center",
        py: 3,
      }}
    >
      {text}
    </Typography>
  );
};

// Renders the pizza-variant list with its loading / error / empty states. Presentational; delegates
// the row actions back to the page.
export const PizzaVariantList: FC<PizzaVariantListProps> = ({
  items,
  isLoading,
  isError,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return <Notice text={pizzaVariantsCopy.loading} />;
  }
  if (isError || items === undefined) {
    return <Notice text={pizzaVariantsCopy.loadError} isError />;
  }
  if (items.length === 0) {
    return <Notice text={pizzaVariantsCopy.empty} />;
  }

  return (
    <Stack sx={{ gap: 1.25 }}>
      {items.map((variant) => (
        <PizzaVariantCard
          key={variant.id}
          variant={variant}
          onEdit={() => onEdit(variant)}
          onDelete={() => onDelete(variant)}
        />
      ))}
    </Stack>
  );
};
