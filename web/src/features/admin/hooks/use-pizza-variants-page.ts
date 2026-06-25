import { useState } from "react";
import { useDeletePizzaVariant } from "../api";
import type { AdminPizzaVariant } from "../types";
import { mapPizzaVariantError } from "./map-pizza-variant-error";

// The single active modal on the pizza-variants page (only one at a time).
type ActivePizzaVariantModal =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; variant: AdminPizzaVariant }
  | { kind: "delete"; variant: AdminPizzaVariant };

interface UsePizzaVariantsPageResult {
  modal: ActivePizzaVariantModal;
  /** Inline error for the delete confirm dialog. */
  confirmError: string | null;
  isDeleting: boolean;
  openCreate: () => void;
  openEdit: (variant: AdminPizzaVariant) => void;
  openDelete: (variant: AdminPizzaVariant) => void;
  closeModal: () => void;
  confirmDelete: (variant: AdminPizzaVariant) => void;
}

// Logic layer for the pizza-variants page: owns the active-modal state machine and the delete
// mutation. The create/edit form mutations live in `usePizzaVariantForm`.
export const usePizzaVariantsPage = (): UsePizzaVariantsPageResult => {
  const [modal, setModal] = useState<ActivePizzaVariantModal>({ kind: "none" });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const deleteMutation = useDeletePizzaVariant();

  const closeModal = (): void => {
    setModal({ kind: "none" });
    setConfirmError(null);
  };

  const confirmDelete = (variant: AdminPizzaVariant): void => {
    setConfirmError(null);
    void (async (): Promise<void> => {
      try {
        await deleteMutation.mutateAsync(variant.id);
        closeModal();
      } catch (error) {
        setConfirmError(mapPizzaVariantError(error));
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
    openEdit: (variant) => {
      setConfirmError(null);
      setModal({ kind: "edit", variant });
    },
    openDelete: (variant) => {
      setConfirmError(null);
      setModal({ kind: "delete", variant });
    },
    closeModal,
    confirmDelete,
  };
};

export type { ActivePizzaVariantModal };
