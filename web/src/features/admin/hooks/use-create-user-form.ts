import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { roleToNumber, useCreateUser } from "../api";
import { CreateUserFormSchema } from "../schemas";
import type { CreateUserForm, TempPasswordReveal } from "../types";
import { mapCreateError } from "./map-user-error";

interface UseCreateUserFormOptions {
  /** Called with the one-time temp password after a successful create. */
  onCreated: (reveal: TempPasswordReveal) => void;
}

interface UseCreateUserFormResult {
  form: ReturnType<typeof useForm<CreateUserForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
}

// Logic layer for the create-user dialog: RHF + Zod, mapping the role select to
// the numeric wire value and an empty PayPal handle to `undefined` (omitted).
export const useCreateUserForm = ({
  onCreated,
}: UseCreateUserFormOptions): UseCreateUserFormResult => {
  const createMutation = useCreateUser();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: { username: "", displayName: "", payPalHandle: "", role: "Employee" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await createMutation.mutateAsync({
        username: values.username,
        displayName: values.displayName,
        payPalHandle: values.payPalHandle === "" ? undefined : values.payPalHandle,
        role: roleToNumber(values.role),
      });
      onCreated({
        displayName: values.displayName,
        temporaryPassword: result.temporaryPassword,
      });
    } catch (error) {
      setServerError(mapCreateError(error));
    }
  });

  return { form, onSubmit, isPending: createMutation.isPending, serverError };
};
