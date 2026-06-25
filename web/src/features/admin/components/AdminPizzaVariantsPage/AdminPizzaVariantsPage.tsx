import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout, PrimaryButton } from "@/components";
import { useAdminPizzaVariants } from "../../api";
import { pizzaVariantsCopy } from "../../copy";
import { usePizzaVariantsPage } from "../../hooks/use-pizza-variants-page";
import { AdminPizzaVariantsHeader } from "./internal/AdminPizzaVariantsHeader";
import { PizzaVariantConfirmDialog } from "./internal/PizzaVariantConfirmDialog";
import { PizzaVariantDialog } from "./internal/PizzaVariantDialog";
import { PizzaVariantList } from "./internal/PizzaVariantList";

// The pizza-variant administration screen (/admin/pizza-variants). The data query lives in
// `useAdminPizzaVariants`; the modal state machine and delete mutation live in the page hook. This
// body only composes the header, list, and the active dialog.
export const AdminPizzaVariantsPage: FC = () => {
  const navigate = useNavigate();
  const variantsQuery = useAdminPizzaVariants();
  const {
    modal,
    confirmError,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    closeModal,
    confirmDelete,
  } = usePizzaVariantsPage();

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <AdminPizzaVariantsHeader onBack={() => void navigate({ to: "/admin" })} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {pizzaVariantsCopy.intro}
        </Typography>

        <PrimaryButton startIcon="add" onClick={openCreate}>
          {pizzaVariantsCopy.addButton}
        </PrimaryButton>

        <PizzaVariantList
          items={variantsQuery.data}
          isLoading={variantsQuery.isLoading}
          isError={variantsQuery.isError}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      </PageLayout.Content>

      <PizzaVariantDialog
        open={modal.kind === "create"}
        onClose={closeModal}
        onSaved={closeModal}
      />

      {modal.kind === "edit" ? (
        <PizzaVariantDialog
          open
          variant={modal.variant}
          onClose={closeModal}
          onSaved={closeModal}
        />
      ) : null}

      {modal.kind === "delete" ? (
        <PizzaVariantConfirmDialog
          open
          title={pizzaVariantsCopy.deleteTitle}
          body={pizzaVariantsCopy.deleteBody(modal.variant.name)}
          confirmLabel={pizzaVariantsCopy.deleteConfirm}
          pendingLabel={pizzaVariantsCopy.deleting}
          isPending={isDeleting}
          serverError={confirmError}
          onConfirm={() => confirmDelete(modal.variant)}
          onClose={closeModal}
        />
      ) : null}
    </PageLayout>
  );
};
