import { useState } from "react";
import { useDeactivateUser, useResetPassword } from "../api";
import type { AdminUser, TempPasswordReveal } from "../types";
import { mapUpdateError } from "./map-user-error";

// The single active modal on the users page (only one at a time).
type ActiveModal =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; user: AdminUser }
  | { kind: "deactivate"; user: AdminUser }
  | { kind: "reset"; user: AdminUser }
  | { kind: "temp"; reveal: TempPasswordReveal };

interface UseUsersPageResult {
  modal: ActiveModal;
  /** Inline error for the confirm dialogs (deactivate / reset). */
  confirmError: string | null;
  isMutating: boolean;
  openCreate: () => void;
  openEdit: (user: AdminUser) => void;
  openDeactivate: (user: AdminUser) => void;
  openReset: (user: AdminUser) => void;
  closeModal: () => void;
  /** Shown after create / reset; replaces whatever modal was open. */
  revealTempPassword: (reveal: TempPasswordReveal) => void;
  confirmDeactivate: (user: AdminUser) => void;
  confirmReset: (user: AdminUser) => void;
}

// Logic layer for the users page: owns the active-modal state machine and the
// confirm-dialog mutations (deactivate / reset). The form mutations live in the
// dialog-specific hooks; this orchestrates which dialog is shown.
export const useUsersPage = (): UseUsersPageResult => {
  const [modal, setModal] = useState<ActiveModal>({ kind: "none" });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const deactivateMutation = useDeactivateUser();
  const resetMutation = useResetPassword();

  const closeModal = (): void => {
    setModal({ kind: "none" });
    setConfirmError(null);
  };

  const revealTempPassword = (reveal: TempPasswordReveal): void => {
    setConfirmError(null);
    setModal({ kind: "temp", reveal });
  };

  const confirmDeactivate = (user: AdminUser): void => {
    setConfirmError(null);
    void (async (): Promise<void> => {
      try {
        await deactivateMutation.mutateAsync(user.id);
        closeModal();
      } catch (error) {
        setConfirmError(mapUpdateError(error));
      }
    })();
  };

  const confirmReset = (user: AdminUser): void => {
    setConfirmError(null);
    void (async (): Promise<void> => {
      try {
        const result = await resetMutation.mutateAsync(user.id);
        revealTempPassword({
          displayName: user.displayName,
          temporaryPassword: result.temporaryPassword,
        });
      } catch (error) {
        setConfirmError(mapUpdateError(error));
      }
    })();
  };

  return {
    modal,
    confirmError,
    isMutating: deactivateMutation.isPending || resetMutation.isPending,
    openCreate: () => {
      setConfirmError(null);
      setModal({ kind: "create" });
    },
    openEdit: (user) => {
      setConfirmError(null);
      setModal({ kind: "edit", user });
    },
    openDeactivate: (user) => {
      setConfirmError(null);
      setModal({ kind: "deactivate", user });
    },
    openReset: (user) => {
      setConfirmError(null);
      setModal({ kind: "reset", user });
    },
    closeModal,
    revealTempPassword,
    confirmDeactivate,
    confirmReset,
  };
};

export type { ActiveModal };
