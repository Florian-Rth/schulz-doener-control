import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout, PrimaryButton } from "@/components";
import { useAdminUsers } from "../../api";
import { usersCopy } from "../../copy";
import { useUsersPage } from "../../hooks/use-users-page";
import { AdminUsersHeader } from "./internal/AdminUsersHeader";
import { ConfirmDialog } from "./internal/ConfirmDialog";
import { CreateUserDialog } from "./internal/CreateUserDialog";
import { EditUserDialog } from "./internal/EditUserDialog";
import { TempPasswordDialog } from "./internal/TempPasswordDialog";
import { UsersList } from "./internal/UsersList";

// The user-administration screen (/admin/benutzer). The data query lives in
// `useAdminUsers`; the modal state machine and confirm mutations live in the
// page hook. This body only composes the header, list, and the active dialog.
export const AdminUsersPage: FC = () => {
  const navigate = useNavigate();
  const usersQuery = useAdminUsers();
  const {
    modal,
    confirmError,
    isMutating,
    openCreate,
    openEdit,
    openDeactivate,
    openReset,
    closeModal,
    revealTempPassword,
    confirmDeactivate,
    confirmReset,
  } = useUsersPage();

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <AdminUsersHeader onBack={() => void navigate({ to: "/admin" })} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {usersCopy.intro}
        </Typography>

        <PrimaryButton startIcon="person_add" onClick={openCreate}>
          {usersCopy.addButton}
        </PrimaryButton>

        <UsersList
          users={usersQuery.data}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          onEdit={openEdit}
          onReset={openReset}
          onDeactivate={openDeactivate}
        />
      </PageLayout.Content>

      <CreateUserDialog
        open={modal.kind === "create"}
        onClose={closeModal}
        onCreated={revealTempPassword}
      />

      {modal.kind === "edit" ? (
        <EditUserDialog open user={modal.user} onClose={closeModal} onSaved={closeModal} />
      ) : null}

      {modal.kind === "deactivate" ? (
        <ConfirmDialog
          open
          title={usersCopy.deactivateTitle}
          body={usersCopy.deactivateBody(modal.user.displayName)}
          confirmLabel={usersCopy.deactivateConfirm}
          pendingLabel={usersCopy.deactivating}
          isPending={isMutating}
          serverError={confirmError}
          onConfirm={() => confirmDeactivate(modal.user)}
          onClose={closeModal}
        />
      ) : null}

      {modal.kind === "reset" ? (
        <ConfirmDialog
          open
          title={usersCopy.resetTitle}
          body={usersCopy.resetBody(modal.user.displayName)}
          confirmLabel={usersCopy.resetConfirm}
          pendingLabel={usersCopy.resetting}
          isPending={isMutating}
          serverError={confirmError}
          onConfirm={() => confirmReset(modal.user)}
          onClose={closeModal}
        />
      ) : null}

      {modal.kind === "temp" ? (
        <TempPasswordDialog open reveal={modal.reveal} onClose={closeModal} />
      ) : null}
    </PageLayout>
  );
};
