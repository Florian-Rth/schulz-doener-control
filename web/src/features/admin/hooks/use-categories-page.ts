import { useState } from "react";
import { useDeleteCategory } from "../api";
import type { AdminCategory } from "../types";
import { mapCategoryError } from "./map-category-error";

// The single active modal on the categories page (only one at a time).
type ActiveCategoryModal =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; category: AdminCategory }
  | { kind: "delete"; category: AdminCategory };

interface UseCategoriesPageResult {
  modal: ActiveCategoryModal;
  /** Inline error for the delete confirm dialog. */
  confirmError: string | null;
  isDeleting: boolean;
  openCreate: () => void;
  openEdit: (category: AdminCategory) => void;
  openDelete: (category: AdminCategory) => void;
  closeModal: () => void;
  confirmDelete: (category: AdminCategory) => void;
}

// Logic layer for the categories page: owns the active-modal state machine and the delete mutation.
// The create/edit form mutations live in `useCategoryForm`; the field-assignment editor in
// `useCategoryFieldsEditor`.
export const useCategoriesPage = (): UseCategoriesPageResult => {
  const [modal, setModal] = useState<ActiveCategoryModal>({ kind: "none" });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const deleteMutation = useDeleteCategory();

  const closeModal = (): void => {
    setModal({ kind: "none" });
    setConfirmError(null);
  };

  const confirmDelete = (category: AdminCategory): void => {
    setConfirmError(null);
    void (async (): Promise<void> => {
      try {
        await deleteMutation.mutateAsync(category.key);
        closeModal();
      } catch (error) {
        setConfirmError(mapCategoryError(error, "delete"));
      }
    })();
  };

  return {
    modal,
    confirmError,
    isDeleting: deleteMutation.isPending,
    openCreate: () => {
      setConfirmError(null);
      setModal({ kind: "create" });
    },
    openEdit: (category) => {
      setConfirmError(null);
      setModal({ kind: "edit", category });
    },
    openDelete: (category) => {
      setConfirmError(null);
      setModal({ kind: "delete", category });
    },
    closeModal,
    confirmDelete,
  };
};

export type { ActiveCategoryModal };
