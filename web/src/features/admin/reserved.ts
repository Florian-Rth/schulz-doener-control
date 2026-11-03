// The meat/sauce fields and their standard options are wired into the Döner-Tier
// engine server-side, so the backend refuses to delete them (400). The admin UI
// mirrors that here: their delete actions render disabled with a hint. Labels,
// icons and prices stay fully editable.

export const RESERVED_FIELD_KEYS = ["meat", "sauce"] as const;

export const RESERVED_OPTION_KEYS: Readonly<Record<string, readonly string[]>> = {
  meat: ["kalb", "haehnchen", "gemischt"],
  sauce: ["kraeuter", "knoblauch", "scharf"],
};

export const isReservedField = (fieldKey: string): boolean =>
  (RESERVED_FIELD_KEYS as readonly string[]).includes(fieldKey);

export const isReservedOption = (fieldKey: string, optionKey: string): boolean =>
  RESERVED_OPTION_KEYS[fieldKey]?.includes(optionKey) ?? false;
