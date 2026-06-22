import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout, PrimaryButton } from "@/components";
import { useAdminMenu } from "../../api";
import { menuCopy } from "../../copy";
import { useMenuPage } from "../../hooks/use-menu-page";
import { AdminMenuHeader } from "./internal/AdminMenuHeader";
import { MenuConfirmDialog } from "./internal/MenuConfirmDialog";
import { MenuItemDialog } from "./internal/MenuItemDialog";
import { MenuList } from "./internal/MenuList";

// The menu-administration screen (/admin/menue). The data query lives in
// `useAdminMenu`; the modal state machine and delete mutation live in the page
// hook. This body only composes the header, list, and the active dialog.
export const AdminMenuPage: FC = () => {
  const navigate = useNavigate();
  const menuQuery = useAdminMenu();
  const {
    modal,
    confirmError,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    closeModal,
    confirmDelete,
  } = useMenuPage();

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <AdminMenuHeader onBack={() => void navigate({ to: "/admin" })} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {menuCopy.intro}
        </Typography>

        <PrimaryButton startIcon="add" onClick={openCreate}>
          {menuCopy.addButton}
        </PrimaryButton>

        <MenuList
          items={menuQuery.data}
          isLoading={menuQuery.isLoading}
          isError={menuQuery.isError}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      </PageLayout.Content>

      <MenuItemDialog open={modal.kind === "create"} onClose={closeModal} onSaved={closeModal} />

      {modal.kind === "edit" ? (
        <MenuItemDialog open item={modal.item} onClose={closeModal} onSaved={closeModal} />
      ) : null}

      {modal.kind === "delete" ? (
        <MenuConfirmDialog
          open
          title={menuCopy.deleteTitle}
          body={menuCopy.deleteBody(modal.item.name)}
          confirmLabel={menuCopy.deleteConfirm}
          pendingLabel={menuCopy.deleting}
          isPending={isDeleting}
          serverError={confirmError}
          onConfirm={() => confirmDelete(modal.item)}
          onClose={closeModal}
        />
      ) : null}
    </PageLayout>
  );
};
