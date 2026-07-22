import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout, PrimaryButton } from "@/components";
import { useAdminFields } from "../../api";
import { fieldsCopy } from "../../copy";
import { useFieldsPage } from "../../hooks/use-fields-page";
import { AdminFieldsHeader } from "./internal/AdminFieldsHeader";
import { FieldDialog } from "./internal/FieldDialog";
import { FieldList } from "./internal/FieldList";
import { FieldOptionDialog } from "./internal/FieldOptionDialog";
import { FieldsConfirmDialog } from "./internal/FieldsConfirmDialog";

// The fields-administration screen (/admin/felder). The data query lives in `useAdminFields`; the
// modal state machine and delete mutations live in the page hook. This body only composes the
// header, list, and the active dialog.
export const AdminFieldsPage: FC = () => {
  const navigate = useNavigate();
  const fieldsQuery = useAdminFields();
  const {
    modal,
    confirmError,
    isDeleting,
    openCreateField,
    openEditField,
    openDeleteField,
    openCreateOption,
    openEditOption,
    openDeleteOption,
    closeModal,
    confirmDeleteField,
    confirmDeleteOption,
  } = useFieldsPage();

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <AdminFieldsHeader onBack={() => void navigate({ to: "/admin" })} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {fieldsCopy.intro}
        </Typography>

        <PrimaryButton startIcon="add" onClick={openCreateField}>
          {fieldsCopy.addButton}
        </PrimaryButton>

        <FieldList
          items={fieldsQuery.data}
          isLoading={fieldsQuery.isLoading}
          isError={fieldsQuery.isError}
          onEditField={openEditField}
          onDeleteField={openDeleteField}
          onAddOption={openCreateOption}
          onEditOption={openEditOption}
          onDeleteOption={openDeleteOption}
        />
      </PageLayout.Content>

      <FieldDialog open={modal.kind === "createField"} onClose={closeModal} onSaved={closeModal} />

      {modal.kind === "editField" ? (
        <FieldDialog open field={modal.field} onClose={closeModal} onSaved={closeModal} />
      ) : null}

      {modal.kind === "createOption" ? (
        <FieldOptionDialog
          open
          fieldKey={modal.field.key}
          onClose={closeModal}
          onSaved={closeModal}
        />
      ) : null}

      {modal.kind === "editOption" ? (
        <FieldOptionDialog
          open
          fieldKey={modal.field.key}
          option={modal.option}
          onClose={closeModal}
          onSaved={closeModal}
        />
      ) : null}

      {modal.kind === "deleteField" ? (
        <FieldsConfirmDialog
          open
          title={fieldsCopy.deleteFieldTitle}
          body={fieldsCopy.deleteFieldBody(modal.field.label)}
          isPending={isDeleting}
          serverError={confirmError}
          onConfirm={() => confirmDeleteField(modal.field)}
          onClose={closeModal}
        />
      ) : null}

      {modal.kind === "deleteOption" ? (
        <FieldsConfirmDialog
          open
          title={fieldsCopy.deleteOptionTitle}
          body={fieldsCopy.deleteOptionBody(modal.option.label)}
          isPending={isDeleting}
          serverError={confirmError}
          onConfirm={() => confirmDeleteOption(modal.field, modal.option)}
          onClose={closeModal}
        />
      ) : null}
    </PageLayout>
  );
};
