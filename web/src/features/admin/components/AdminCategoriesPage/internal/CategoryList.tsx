import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { categoriesCopy } from "../../../copy";
import type { AdminCategory } from "../../../types";
import { CategoryCard } from "./CategoryCard";

interface CategoryListProps {
  items: AdminCategory[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
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

// Renders the category list with its loading / error / empty states. Presentational; delegates the
// row actions back to the page.
export const CategoryList: FC<CategoryListProps> = ({
  items,
  isLoading,
  isError,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return <Notice text={categoriesCopy.loading} />;
  }
  if (isError || items === undefined) {
    return <Notice text={categoriesCopy.loadError} isError />;
  }
  if (items.length === 0) {
    return <Notice text={categoriesCopy.empty} />;
  }

  return (
    <Stack sx={{ gap: 1.25 }}>
      {items.map((category) => (
        <CategoryCard
          key={category.key}
          category={category}
          onEdit={() => onEdit(category)}
          onDelete={() => onDelete(category)}
        />
      ))}
    </Stack>
  );
};
