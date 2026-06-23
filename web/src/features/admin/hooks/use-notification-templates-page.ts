import { useState } from "react";
import { useDeleteNotificationTemplate } from "../api";
import type { AdminNotificationTemplate } from "../types";
import { mapTemplateError } from "./map-template-error";

// The single active modal on the notification-templates page (only one at a time).
type ActiveTemplateModal =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; template: AdminNotificationTemplate }
  | { kind: "delete"; template: AdminNotificationTemplate };

interface UseNotificationTemplatesPageResult {
  modal: ActiveTemplateModal;
  /** Inline error for the delete confirm dialog. */
  confirmError: string | null;
  isDeleting: boolean;
  openCreate: () => void;
  openEdit: (template: AdminNotificationTemplate) => void;
  openDelete: (template: AdminNotificationTemplate) => void;
  closeModal: () => void;
  confirmDelete: (template: AdminNotificationTemplate) => void;
}

// Logic layer for the notification-templates page: owns the active-modal state machine and the
// delete mutation. The create/edit form mutations live in `useNotificationTemplateForm`.
export const useNotificationTemplatesPage = (): UseNotificationTemplatesPageResult => {
  const [modal, setModal] = useState<ActiveTemplateModal>({ kind: "none" });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const deleteMutation = useDeleteNotificationTemplate();

  const closeModal = (): void => {
    setModal({ kind: "none" });
    setConfirmError(null);
  };

  const confirmDelete = (template: AdminNotificationTemplate): void => {
    setConfirmError(null);
    void (async (): Promise<void> => {
      try {
        await deleteMutation.mutateAsync(template.id);
        closeModal();
      } catch (error) {
        setConfirmError(mapTemplateError(error));
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
    openEdit: (template) => {
      setConfirmError(null);
      setModal({ kind: "edit", template });
    },
    openDelete: (template) => {
      setConfirmError(null);
      setModal({ kind: "delete", template });
    },
    closeModal,
    confirmDelete,
  };
};

export type { ActiveTemplateModal };
