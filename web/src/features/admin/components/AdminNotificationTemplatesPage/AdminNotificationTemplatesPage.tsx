import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout, PrimaryButton } from "@/components";
import { useAdminNotificationTemplates } from "../../api";
import { templatesCopy } from "../../copy";
import { useNotificationTemplatesPage } from "../../hooks/use-notification-templates-page";
import { AdminTemplatesHeader } from "./internal/AdminTemplatesHeader";
import { TemplateConfirmDialog } from "./internal/TemplateConfirmDialog";
import { TemplateDialog } from "./internal/TemplateDialog";
import { TemplateList } from "./internal/TemplateList";

// The notification-text administration screen (/admin/benachrichtigungen). The data query lives in
// `useAdminNotificationTemplates`; the modal state machine and delete mutation live in the page
// hook. This body only composes the header, list, and the active dialog.
export const AdminNotificationTemplatesPage: FC = () => {
  const navigate = useNavigate();
  const templatesQuery = useAdminNotificationTemplates();
  const {
    modal,
    confirmError,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    closeModal,
    confirmDelete,
  } = useNotificationTemplatesPage();

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <AdminTemplatesHeader onBack={() => void navigate({ to: "/admin" })} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {templatesCopy.intro}
        </Typography>

        <PrimaryButton startIcon="add" onClick={openCreate}>
          {templatesCopy.addButton}
        </PrimaryButton>

        <TemplateList
          items={templatesQuery.data}
          isLoading={templatesQuery.isLoading}
          isError={templatesQuery.isError}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      </PageLayout.Content>

      <TemplateDialog open={modal.kind === "create"} onClose={closeModal} onSaved={closeModal} />

      {modal.kind === "edit" ? (
        <TemplateDialog open template={modal.template} onClose={closeModal} onSaved={closeModal} />
      ) : null}

      {modal.kind === "delete" ? (
        <TemplateConfirmDialog
          open
          title={templatesCopy.deleteTitle}
          body={templatesCopy.deleteBody(modal.template.synonym)}
          confirmLabel={templatesCopy.deleteConfirm}
          pendingLabel={templatesCopy.deleting}
          isPending={isDeleting}
          serverError={confirmError}
          onConfirm={() => confirmDelete(modal.template)}
          onClose={closeModal}
        />
      ) : null}
    </PageLayout>
  );
};
