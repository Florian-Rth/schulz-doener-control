import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUpdateWorkEmail } from "../api";
import { settingsCopy } from "../copy";
import { WorkEmailFormSchema } from "../schemas";
import type { WorkEmailForm } from "../types";

interface UseWorkEmailFormOptions {
  /** Pre-fills the field with the caller's current work email (null = none). */
  initialEmail: string | null;
}

interface UseWorkEmailFormResult {
  form: ReturnType<typeof useForm<WorkEmailForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  isSaved: boolean;
  serverError: string | null;
}

// Logic layer for the work-email form: RHF + Zod resolver wired to the update
// mutation. The email is optional — a blank value clears it. A successful PUT
// flips `isSaved` and invalidates the session (the field rides along on `/me`).
export const useWorkEmailForm = ({
  initialEmail,
}: UseWorkEmailFormOptions): UseWorkEmailFormResult => {
  const updateMutation = useUpdateWorkEmail();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<WorkEmailForm>({
    resolver: zodResolver(WorkEmailFormSchema),
    defaultValues: { workEmail: initialEmail ?? "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    setIsSaved(false);
    try {
      const result = await updateMutation.mutateAsync(values.workEmail);
      setIsSaved(true);
      form.reset({ workEmail: result.workEmail ?? "" });
    } catch {
      setServerError(settingsCopy.workEmailError);
    }
  });

  return { form, onSubmit, isPending: updateMutation.isPending, isSaved, serverError };
};
