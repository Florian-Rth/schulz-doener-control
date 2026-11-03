import { useState } from "react";
import { useAdminFields, useSetCategoryFields } from "../api";
import type { AdminCategory, AdminField } from "../types";
import { mapCategoryError } from "./map-category-error";

// One assigned field in the editor, in render order.
interface EditorLink {
  fieldKey: string;
  isRequired: boolean;
}

interface UseCategoryFieldsEditorResult {
  /** The category's assigned fields, in order, resolved to their definitions. */
  assigned: { field: AdminField; isRequired: boolean }[];
  /** Fields not yet assigned to the category. */
  available: AdminField[];
  isLoading: boolean;
  isSaving: boolean;
  saved: boolean;
  serverError: string | null;
  add: (fieldKey: string) => void;
  remove: (fieldKey: string) => void;
  setRequired: (fieldKey: string, isRequired: boolean) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  save: () => void;
}

const toLinks = (category: AdminCategory): EditorLink[] =>
  [...category.fields]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((link) => ({ fieldKey: link.fieldKey, isRequired: link.isRequired }));

// Logic layer for the category field-assignment editor. Holds the ordered link set as local state,
// seeded from the category and re-seeded (render-phase, no effect) whenever the edited category
// changes. Saving replaces the whole link set via `useSetCategoryFields`.
export const useCategoryFieldsEditor = (category: AdminCategory): UseCategoryFieldsEditorResult => {
  const fieldsQuery = useAdminFields();
  const setFieldsMutation = useSetCategoryFields();
  const [links, setLinks] = useState<EditorLink[]>(() => toLinks(category));
  const [lastKey, setLastKey] = useState<string>(category.key);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Re-seed when the editor is pointed at a different category.
  if (category.key !== lastKey) {
    setLastKey(category.key);
    setLinks(toLinks(category));
    setServerError(null);
    setSaved(false);
  }

  const allFields = fieldsQuery.data ?? [];
  const assigned = links
    .map((link) => {
      const field = allFields.find((entry) => entry.key === link.fieldKey);
      return field === undefined ? null : { field, isRequired: link.isRequired };
    })
    .filter((entry): entry is { field: AdminField; isRequired: boolean } => entry !== null);
  const assignedKeys = new Set(links.map((link) => link.fieldKey));
  const available = allFields.filter((field) => !assignedKeys.has(field.key));

  const mutate = (next: EditorLink[]): void => {
    setSaved(false);
    setLinks(next);
  };

  return {
    assigned,
    available,
    isLoading: fieldsQuery.isLoading,
    isSaving: setFieldsMutation.isPending,
    saved,
    serverError,
    add: (fieldKey) => {
      mutate([...links, { fieldKey, isRequired: false }]);
    },
    remove: (fieldKey) => {
      mutate(links.filter((link) => link.fieldKey !== fieldKey));
    },
    setRequired: (fieldKey, isRequired) => {
      mutate(links.map((link) => (link.fieldKey === fieldKey ? { ...link, isRequired } : link)));
    },
    moveUp: (index) => {
      if (index <= 0) {
        return;
      }
      const next = [...links];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      mutate(next);
    },
    moveDown: (index) => {
      if (index >= links.length - 1) {
        return;
      }
      const next = [...links];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      mutate(next);
    },
    save: () => {
      setServerError(null);
      void (async (): Promise<void> => {
        try {
          await setFieldsMutation.mutateAsync({
            key: category.key,
            fields: links.map((link, index) => ({
              fieldKey: link.fieldKey,
              sortOrder: index,
              isRequired: link.isRequired,
            })),
          });
          setSaved(true);
        } catch (error) {
          setServerError(mapCategoryError(error, "save"));
        }
      })();
    },
  };
};
