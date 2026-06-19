import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { menuCopy } from "../../../copy";
import type { AdminMenuItem } from "../../../types";
import { MenuItemCard } from "./MenuItemCard";

interface MenuListProps {
  items: AdminMenuItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (item: AdminMenuItem) => void;
  onDelete: (item: AdminMenuItem) => void;
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

// Renders the menu list with its loading / error / empty states. Presentational;
// delegates the row actions back to the page.
export const MenuList: FC<MenuListProps> = ({ items, isLoading, isError, onEdit, onDelete }) => {
  if (isLoading) {
    return <Notice text={menuCopy.loading} />;
  }
  if (isError || items === undefined) {
    return <Notice text={menuCopy.loadError} isError />;
  }
  if (items.length === 0) {
    return <Notice text={menuCopy.empty} />;
  }

  return (
    <Stack sx={{ gap: 1.25 }}>
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      ))}
    </Stack>
  );
};
