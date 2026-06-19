import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { usersCopy } from "../../../copy";
import { useEditUserForm } from "../../../hooks/use-edit-user-form";
import type { AdminUser } from "../../../types";
import { ActiveField } from "./ActiveField";
import { RoleField } from "./RoleField";
import { UserTextField } from "./UserTextField";

interface EditUserDialogProps {
  open: boolean;
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}

// Edit-user dialog. Username is shown read-only (immutable); displayName, PayPal
// handle, role and active state are editable. Logic lives in `useEditUserForm`.
export const EditUserDialog: FC<EditUserDialogProps> = ({ open, user, onClose, onSaved }) => {
  const { form, onSubmit, isPending, serverError } = useEditUserForm({ user, onSaved });

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>{usersCopy.editTitle}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5, pt: 0.5 }}>
          <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
            {usersCopy.usernameLabel}: <strong>{user.username}</strong>
          </Typography>
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
            prefix={usersCopy.payPalPrefix}
          />
          <RoleField control={form.control} name="role" />
          <ActiveField control={form.control} />

          {serverError !== null ? (
            <Typography
              role="alert"
              sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600, mt: 1 }}
            >
              {serverError}
            </Typography>
          ) : null}

          <PrimaryButton type="submit" loading={isPending} sx={{ mt: 1.5 }}>
            {isPending ? usersCopy.editSubmitting : usersCopy.editSubmit}
          </PrimaryButton>
          <GhostButton onClick={onClose} disabled={isPending} sx={{ mt: 1 }}>
            {usersCopy.cancel}
          </GhostButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
