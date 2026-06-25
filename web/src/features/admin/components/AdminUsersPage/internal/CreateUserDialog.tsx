import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { usersCopy } from "../../../copy";
import { useCreateUserForm } from "../../../hooks/use-create-user-form";
import type { TempPasswordReveal } from "../../../types";
import { RoleField } from "./RoleField";
import { UserTextField } from "./UserTextField";

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (reveal: TempPasswordReveal) => void;
}

// Create-user dialog: provisions a new account. On success it hands the one-time
// temporary password up so the page can reveal it. Logic lives in
// `useCreateUserForm`; this composes the fields + actions.
export const CreateUserDialog: FC<CreateUserDialogProps> = ({ open, onClose, onCreated }) => {
  const { form, onSubmit, isPending, serverError } = useCreateUserForm({ onCreated });

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
        {usersCopy.createTitle}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5, pt: 0.5 }}>
          <UserTextField
            control={form.control}
            name="username"
            label={usersCopy.usernameLabel}
            placeholder={usersCopy.usernamePlaceholder}
          />
          <UserTextField
            control={form.control}
            name="displayName"
            label={usersCopy.displayNameLabel}
            placeholder={usersCopy.displayNamePlaceholder}
          />
          <UserTextField
            control={form.control}
            name="payPalHandle"
            label={usersCopy.payPalLabel}
            placeholder={usersCopy.payPalPlaceholder}
          />
          <RoleField control={form.control} name="role" />

          {serverError !== null ? (
            <Typography
              role="alert"
              sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600, mt: 1 }}
            >
              {serverError}
            </Typography>
          ) : null}

          <PrimaryButton type="submit" loading={isPending} sx={{ mt: 1.5 }}>
            {isPending ? usersCopy.createSubmitting : usersCopy.createSubmit}
          </PrimaryButton>
          <GhostButton onClick={onClose} disabled={isPending} sx={{ mt: 1 }}>
            {usersCopy.cancel}
          </GhostButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
