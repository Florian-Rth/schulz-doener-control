import { useState } from "react";
import { useDeleteMenuItem } from "../api";
import type { AdminMenuItem } from "../types";
import { mapMenuError } from "./map-menu-error";

// The single active modal on the menu page (only one at a time).
type ActiveMenuModal =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; item: AdminMenuItem }
  | { kind: "delete"; item: AdminMenuItem };

interface UseMenuPageResult {
  modal: ActiveMenuModal;
  /** Inline error for the delete confirm dialog. */
  confirmError: string | null;
  isDeleting: boolean;
  openCreate: () => void;
  openEdit: (item: AdminMenuItem) => void;
  openDelete: (item: AdminMenuItem) => void;
  closeModal: () => void;
  confirmDelete: (item: AdminMenuItem) => void;
}

// Logic layer for the menu page: owns the active-modal state machine and the
// delete mutation. The create/edit form mutations live in `useMenuItemForm`.
export const useMenuPage = (): UseMenuPageResult => {
  const [modal, setModal] = useState<ActiveMenuModal>({ kind: "none" });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const deleteMutation = useDeleteMenuItem();

  const closeModal = (): void => {
    setModal({ kind: "none" });
    setConfirmError(null);
  };

  const confirmDelete = (item: AdminMenuItem): void => {
    setConfirmError(null);
    void (async (): Promise<void> => {
      try {
        await deleteMutation.mutateAsync(item.id);
        closeModal();
      } catch (error) {
        setConfirmError(mapMenuError(error));
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
    openEdit: (item) => {
      setConfirmError(null);
      setModal({ kind: "edit", item });
    },
    openDelete: (item) => {
      setConfirmError(null);
      setModal({ kind: "delete", item });
    },
    closeModal,
    confirmDelete,
  };
};

export type { ActiveMenuModal };
