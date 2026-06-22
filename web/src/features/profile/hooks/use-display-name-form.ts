import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUpdateDisplayName } from "../api";
import { settingsCopy } from "../copy";
import { DisplayNameFormSchema } from "../schemas";
import type { DisplayNameForm } from "../types";

interface UseDisplayNameFormOptions {
  /** Pre-fills the field with the caller's current display name. */
  initialName: string;
  /** Called with the persisted name after a successful save. */
  onSaved?: (displayName: string) => void;
}

interface UseDisplayNameFormResult {
  form: ReturnType<typeof useForm<DisplayNameForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  isSaved: boolean;
  serverError: string | null;
}

// Logic layer for the display-name form: RHF + Zod resolver wired to the update
// mutation. Validation (non-empty/length) runs client-side before any request;
// a successful PUT flips `isSaved`, invalidates the session (via the mutation)
// so the avatar/greeting refresh, and notifies the caller.
export const useDisplayNameForm = ({
  initialName,
  onSaved,
}: UseDisplayNameFormOptions): UseDisplayNameFormResult => {
  const updateMutation = useUpdateDisplayName();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<DisplayNameForm>({
    resolver: zodResolver(DisplayNameFormSchema),
    defaultValues: { displayName: initialName },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    setIsSaved(false);
    try {
      const result = await updateMutation.mutateAsync(values.displayName);
      setIsSaved(true);
      form.reset({ displayName: result.displayName });
      onSaved?.(result.displayName);
    } catch {
      setServerError(settingsCopy.displayNameError);
    }
  });

  return { form, onSubmit, isPending: updateMutation.isPending, isSaved, serverError };
};
