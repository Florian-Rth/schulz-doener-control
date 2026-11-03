import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout, PrimaryButton } from "@/components";
import { useAdminCategories } from "../../api";
import { categoriesCopy } from "../../copy";
import { useCategoriesPage } from "../../hooks/use-categories-page";
import { AdminCategoriesHeader } from "./internal/AdminCategoriesHeader";
import { CategoryConfirmDialog } from "./internal/CategoryConfirmDialog";
import { CategoryDialog } from "./internal/CategoryDialog";
import { CategoryList } from "./internal/CategoryList";

// The category-administration screen (/admin/kategorien). The data query lives in
// `useAdminCategories`; the modal state machine and delete mutation live in the page hook. This body
// only composes the header, list, and the active dialog.
export const AdminCategoriesPage: FC = () => {
  const navigate = useNavigate();
  const categoriesQuery = useAdminCategories();
  const {
    modal,
    confirmError,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    closeModal,
    confirmDelete,
  } = useCategoriesPage();

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <AdminCategoriesHeader onBack={() => void navigate({ to: "/admin" })} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {categoriesCopy.intro}
        </Typography>

        <PrimaryButton startIcon="add" onClick={openCreate}>
          {categoriesCopy.addButton}
        </PrimaryButton>

        <CategoryList
          items={categoriesQuery.data}
          isLoading={categoriesQuery.isLoading}
          isError={categoriesQuery.isError}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      </PageLayout.Content>

      <CategoryDialog open={modal.kind === "create"} onClose={closeModal} onSaved={closeModal} />

      {modal.kind === "edit" ? (
        <CategoryDialog open category={modal.category} onClose={closeModal} onSaved={closeModal} />
      ) : null}

      {modal.kind === "delete" ? (
        <CategoryConfirmDialog
          open
          title={categoriesCopy.deleteTitle}
          body={categoriesCopy.deleteBody(modal.category.name)}
          confirmLabel={categoriesCopy.deleteConfirm}
          pendingLabel={categoriesCopy.deleting}
          isPending={isDeleting}
          serverError={confirmError}
          onConfirm={() => confirmDelete(modal.category)}
          onClose={closeModal}
        />
      ) : null}
    </PageLayout>
  );
};
