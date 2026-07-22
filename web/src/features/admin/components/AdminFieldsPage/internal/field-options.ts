import { fieldsCopy } from "../../../copy";
import type { FieldDisplay, FieldType } from "../../../types";

// The field type / display select options and their German labels, shared by the field dialog and
// the field card badges. Keys mirror the wire enums.
export const FIELD_TYPE_OPTIONS: readonly { value: FieldType; label: string }[] = [
  { value: "single", label: fieldsCopy.typeSingle },
  { value: "multi", label: fieldsCopy.typeMulti },
  { value: "text", label: fieldsCopy.typeText },
];

export const FIELD_DISPLAY_OPTIONS: readonly { value: FieldDisplay; label: string }[] = [
  { value: "segmented", label: fieldsCopy.displaySegmented },
  { value: "chips", label: fieldsCopy.displayChips },
  { value: "dropdown", label: fieldsCopy.displayDropdown },
  { value: "textarea", label: fieldsCopy.displayTextarea },
];

export const fieldTypeLabel = (type: FieldType): string =>
  FIELD_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;

export const fieldDisplayLabel = (display: FieldDisplay): string =>
  FIELD_DISPLAY_OPTIONS.find((option) => option.value === display)?.label ?? display;
