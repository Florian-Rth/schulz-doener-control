import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type NotificationTemplateBody,
  type UpdateNotificationTemplateInput,
  useCreateNotificationTemplate,
  useUpdateNotificationTemplate,
} from "../api";
import { NotificationTemplateFormSchema } from "../schemas";
import type { AdminNotificationTemplate, NotificationTemplateForm } from "../types";
import { mapTemplateError } from "./map-template-error";

interface UseNotificationTemplateFormOptions {
  /** The template being edited; when omitted the form provisions a new one. */
  template?: AdminNotificationTemplate;
  /** Called after a successful create / update so the page can close the dialog. */
  onSaved: () => void;
}

interface UseNotificationTemplateFormResult {
  form: ReturnType<typeof useForm<NotificationTemplateForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
  isEdit: boolean;
}

const emptyDefaults: NotificationTemplateForm = {
  synonym: "",
  body: "",
  isActive: true,
};

const toDefaults = (template: AdminNotificationTemplate | undefined): NotificationTemplateForm => {
  if (template === undefined) {
    return emptyDefaults;
  }
  return {
    synonym: template.synonym,
    body: template.body,
    isActive: template.isActive,
  };
};

// Logic layer for the create/edit notification-text dialog. Reuses one RHF + Zod form for both
// modes; on edit the id is carried separately into the update payload (the form has no id field).
export const useNotificationTemplateForm = ({
  template,
  onSaved,
}: UseNotificationTemplateFormOptions): UseNotificationTemplateFormResult => {
  const createMutation = useCreateNotificationTemplate();
  const updateMutation = useUpdateNotificationTemplate();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = template !== undefined;

  const form = useForm<NotificationTemplateForm>({
    resolver: zodResolver(NotificationTemplateFormSchema),
    defaultValues: toDefaults(template),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (isEdit && template !== undefined) {
        const body: UpdateNotificationTemplateInput = {
          id: template.id,
          synonym: values.synonym,
          body: values.body,
          isActive: values.isActive,
        };
        await updateMutation.mutateAsync(body);
      } else {
        const body: NotificationTemplateBody = {
          synonym: values.synonym,
          body: values.body,
          isActive: values.isActive,
        };
        await createMutation.mutateAsync(body);
      }
      onSaved();
    } catch (error) {
      setServerError(mapTemplateError(error));
    }
  });

  return {
    form,
    onSubmit,
    isPending: createMutation.isPending || updateMutation.isPending,
    serverError,
    isEdit,
  };
};
