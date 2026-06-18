import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUpdatePayPalHandle } from "../api";
import { profileCopy } from "../copy";
import { PayPalHandleFormSchema } from "../schemas";
import type { PayPalHandleForm } from "../types";

interface UsePayPalHandleFormOptions {
  /** Pre-fills the field with the caller's existing handle (null = unset). */
  initialHandle: string | null;
  /** Called with the persisted handle after a successful save. */
  onSaved?: (handle: string) => void;
}

interface UsePayPalHandleFormResult {
  form: ReturnType<typeof useForm<PayPalHandleForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  isSaved: boolean;
  serverError: string | null;
}

// Logic layer for the PayPal-handle form: RHF + Zod resolver wired to the
// update mutation. Validation (charset/length) runs client-side before any
// request; a successful PUT flips `isSaved` and notifies the caller.
export const usePayPalHandleForm = ({
  initialHandle,
  onSaved,
}: UsePayPalHandleFormOptions): UsePayPalHandleFormResult => {
  const updateMutation = useUpdatePayPalHandle();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<PayPalHandleForm>({
    resolver: zodResolver(PayPalHandleFormSchema),
    defaultValues: { handle: initialHandle ?? "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    setIsSaved(false);
    try {
      const result = await updateMutation.mutateAsync(values.handle);
      setIsSaved(true);
      if (result.payPalHandle !== null) {
        onSaved?.(result.payPalHandle);
      }
    } catch {
      setServerError(profileCopy.errorGeneric);
    }
  });

  return { form, onSubmit, isPending: updateMutation.isPending, isSaved, serverError };
};
