import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { roleToNumber, useUpdateUser } from "../api";
import { EditUserFormSchema } from "../schemas";
import type { AdminUser, EditUserForm } from "../types";
import { mapUpdateError } from "./map-user-error";

interface UseEditUserFormOptions {
  /** The user being edited; pre-fills the form. */
  user: AdminUser;
  /** Called after a successful update so the page can close the dialog. */
  onSaved: () => void;
}

interface UseEditUserFormResult {
  form: ReturnType<typeof useForm<EditUserForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
}

// Logic layer for the edit-user dialog. Username is immutable (not in the PUT
// contract), so only displayName / payPalHandle / role / isActive are editable.
export const useEditUserForm = ({
  user,
  onSaved,
}: UseEditUserFormOptions): UseEditUserFormResult => {
  const updateMutation = useUpdateUser();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<EditUserForm>({
    resolver: zodResolver(EditUserFormSchema),
    defaultValues: {
      displayName: user.displayName,
      payPalHandle: user.payPalHandle ?? "",
      role: user.role,
      isActive: user.isActive,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        displayName: values.displayName,
        payPalHandle: values.payPalHandle === "" ? undefined : values.payPalHandle,
        role: roleToNumber(values.role),
        isActive: values.isActive,
      });
      onSaved();
    } catch (error) {
      setServerError(mapUpdateError(error));
    }
  });

  return { form, onSubmit, isPending: updateMutation.isPending, serverError };
};
