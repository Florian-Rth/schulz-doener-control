import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { type UpdateRegistrationModeInput, useUpdateAdminRegistrationMode } from "../api";
import { registrationCopy } from "../copy";
import { RegistrationModeFormSchema } from "../schemas";
import type { RegistrationModeForm, RegistrationModeNumber } from "../types";
import { mapRegistrationError } from "./map-registration-error";

// The SecretKeyOnly wire value; the only mode that needs a secret key.
const SECRET_KEY_ONLY: RegistrationModeNumber = 3;

interface UseRegistrationModeFormOptions {
  /** Current mode loaded from the GET, pre-filling the selector. */
  initialMode: RegistrationModeNumber;
  /** Current secret key loaded from the GET (null when none is set). */
  initialSecretKey: string | null;
}

interface UseRegistrationModeFormResult {
  form: ReturnType<typeof useForm<RegistrationModeForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  /** True when SecretKeyOnly is selected — the page reveals the secret-key field. */
  showSecretKey: boolean;
  isPending: boolean;
  isSaved: boolean;
  serverError: string | null;
}

// Logic layer for the registration-mode screen: one RHF + Zod form hydrated from the GET. The
// secret-key field is required only for SecretKeyOnly; that cross-field rule is enforced here (the
// schema only bounds the length) so the error attaches to the secret-key field. A successful PUT
// flips `isSaved` for the toast and invalidates the client config (via the mutation) so the
// login/register screens reflect the new policy. For non-SecretKeyOnly modes the secret key is
// omitted from the request.
export const useRegistrationModeForm = ({
  initialMode,
  initialSecretKey,
}: UseRegistrationModeFormOptions): UseRegistrationModeFormResult => {
  const updateMutation = useUpdateAdminRegistrationMode();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<RegistrationModeForm>({
    resolver: zodResolver(RegistrationModeFormSchema),
    defaultValues: { mode: initialMode, secretKey: initialSecretKey ?? "" },
  });

  // Reactive read of the selected mode (useWatch, not form.watch, per the React Compiler setup).
  const mode = useWatch({ control: form.control, name: "mode" });
  const showSecretKey = mode === SECRET_KEY_ONLY;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    setIsSaved(false);

    const secretKey = values.secretKey.trim();
    if (values.mode === SECRET_KEY_ONLY && secretKey === "") {
      form.setError("secretKey", { message: registrationCopy.secretKeyRequired });
      return;
    }

    const input: UpdateRegistrationModeInput =
      values.mode === SECRET_KEY_ONLY ? { mode: values.mode, secretKey } : { mode: values.mode };

    try {
      const result = await updateMutation.mutateAsync(input);
      setIsSaved(true);
      form.reset({ mode: result.mode, secretKey: result.secretKey ?? "" });
    } catch (error) {
      setServerError(mapRegistrationError(error));
    }
  });

  return {
    form,
    onSubmit,
    showSecretKey,
    isPending: updateMutation.isPending,
    isSaved,
    serverError,
  };
};
