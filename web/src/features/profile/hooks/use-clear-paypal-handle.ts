import { useState } from "react";
import { useUpdatePayPalHandle } from "../api";
import { profileCopy } from "../copy";

interface UseClearPayPalHandleResult {
  isPending: boolean;
  serverError: string | null;
  /** Clears the handle (empty body → backend treats as "switch to cash-only"). */
  clear: () => Promise<void>;
}

// Logic layer for the clear-to-cash action: reuses the update-PayPal mutation
// with an empty handle so the backend clears it. Kept separate from the
// handle-form so the form's min(1) validation stays intact for normal saves.
export const useClearPayPalHandle = (onCleared?: () => void): UseClearPayPalHandleResult => {
  const updateMutation = useUpdatePayPalHandle();
  const [serverError, setServerError] = useState<string | null>(null);

  const clear = async (): Promise<void> => {
    setServerError(null);
    try {
      await updateMutation.mutateAsync("");
      onCleared?.();
    } catch {
      setServerError(profileCopy.clearError);
    }
  };

  return { isPending: updateMutation.isPending, serverError, clear };
};
