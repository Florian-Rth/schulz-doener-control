import { useState } from "react";
import { useDeleteField, useDeleteFieldOption } from "../api";
import type { AdminField, AdminFieldOption } from "../types";
import { mapFieldError } from "./map-field-error";

// The single active modal on the fields page (only one at a time).
type ActiveFieldModal =
  | { kind: "none" }
  | { kind: "createField" }
  | { kind: "editField"; field: AdminField }
  | { kind: "deleteField"; field: AdminField }
  | { kind: "createOption"; field: AdminField }
  | { kind: "editOption"; field: AdminField; option: AdminFieldOption }
  | { kind: "deleteOption"; field: AdminField; option: AdminFieldOption };

interface UseFieldsPageResult {
  modal: ActiveFieldModal;
  /** Inline error for whichever delete confirm dialog is open. */
  confirmError: string | null;
  isDeleting: boolean;
  openCreateField: () => void;
  openEditField: (field: AdminField) => void;
  openDeleteField: (field: AdminField) => void;
  openCreateOption: (field: AdminField) => void;
  openEditOption: (field: AdminField, option: AdminFieldOption) => void;
  openDeleteOption: (field: AdminField, option: AdminFieldOption) => void;
  closeModal: () => void;
  confirmDeleteField: (field: AdminField) => void;
  confirmDeleteOption: (field: AdminField, option: AdminFieldOption) => void;
}

// Logic layer for the fields page: owns the active-modal state machine and the two delete mutations
// (field + option). The create/edit form mutations live in `useFieldForm` / `useFieldOptionForm`.
export const useFieldsPage = (): UseFieldsPageResult => {
  const [modal, setModal] = useState<ActiveFieldModal>({ kind: "none" });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const deleteFieldMutation = useDeleteField();
  const deleteOptionMutation = useDeleteFieldOption();

  const closeModal = (): void => {
    setModal({ kind: "none" });
    setConfirmError(null);
  };

  const confirmDeleteField = (field: AdminField): void => {
    setConfirmError(null);
    void (async (): Promise<void> => {
      try {
        await deleteFieldMutation.mutateAsync(field.key);
        closeModal();
      } catch (error) {
        setConfirmError(mapFieldError(error, "delete"));
      }
    })();
  };

  const confirmDeleteOption = (field: AdminField, option: AdminFieldOption): void => {
    setConfirmError(null);
    void (async (): Promise<void> => {
      try {
        await deleteOptionMutation.mutateAsync({ fieldKey: field.key, key: option.key });
        closeModal();
      } catch (error) {
        setConfirmError(mapFieldError(error, "delete"));
      }
    })();
  };

  const openAt = (next: ActiveFieldModal): void => {
    setConfirmError(null);
    setModal(next);
  };

  return {
    modal,
    confirmError,
    isDeleting: deleteFieldMutation.isPending || deleteOptionMutation.isPending,
    openCreateField: () => openAt({ kind: "createField" }),
    openEditField: (field) => openAt({ kind: "editField", field }),
    openDeleteField: (field) => openAt({ kind: "deleteField", field }),
    openCreateOption: (field) => openAt({ kind: "createOption", field }),
    openEditOption: (field, option) => openAt({ kind: "editOption", field, option }),
    openDeleteOption: (field, option) => openAt({ kind: "deleteOption", field, option }),
    closeModal,
    confirmDeleteField,
    confirmDeleteOption,
  };
};

export type { ActiveFieldModal };
