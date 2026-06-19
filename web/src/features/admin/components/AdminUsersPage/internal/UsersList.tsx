import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { usersCopy } from "../../../copy";
import type { AdminUser } from "../../../types";
import { UserCard } from "./UserCard";

interface UsersListProps {
  users: AdminUser[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (user: AdminUser) => void;
  onReset: (user: AdminUser) => void;
  onDeactivate: (user: AdminUser) => void;
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

// Renders the user list with its loading / error / empty states. Presentational;
// delegates the row actions back to the page.
export const UsersList: FC<UsersListProps> = ({
  users,
  isLoading,
  isError,
  onEdit,
  onReset,
  onDeactivate,
}) => {
  if (isLoading) {
    return <Notice text={usersCopy.loading} />;
  }
  if (isError || users === undefined) {
    return <Notice text={usersCopy.loadError} isError />;
  }
  if (users.length === 0) {
    return <Notice text={usersCopy.empty} />;
  }

  return (
    <Stack sx={{ gap: 1.25 }}>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={() => onEdit(user)}
          onReset={() => onReset(user)}
          onDeactivate={() => onDeactivate(user)}
        />
      ))}
    </Stack>
  );
};
