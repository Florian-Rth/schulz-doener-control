import { buildFromAnswers, type DoenerBuild } from "@/components";
import {
  findTextField,
  MEAT_FIELD_KEY,
  SAUCE_FIELD_KEY,
  supportsKonfigurator,
} from "./konfigurator";
import type { Menu, OrderLineForm } from "./types";

// What the Bestell-Feier shows for a just-submitted order: the colleague's own
// Döner on the turntable when a line is a bread Döner, otherwise the first
// product's icon with confetti (pizza, boxes …).
export interface Celebration {
  /** The Döner to rebuild in 3D, or null when no line supports the Konfigurator. */
  build: DoenerBuild | null;
  /** Material icon of the celebrated product (non-3D and reduced-motion card). */
  icon: string;
}

const FALLBACK_ICON = "kebab_dining";

export const celebrationOf = (menu: Menu, lines: readonly OrderLineForm[]): Celebration => {
  let firstIcon: string | null = null;
  for (const line of lines) {
    const item = menu.items.find((entry) => entry.id === line.productId);
    if (item === undefined) {
      continue;
    }
    firstIcon ??= item.materialIcon;
    const category = menu.categories.find((entry) => entry.key === item.categoryKey);
    if (category === undefined || !supportsKonfigurator(item, category)) {
      continue;
    }
    const textField = findTextField(category.fields);
    const text = textField === undefined ? "" : (line.answers[textField.key]?.text ?? "");
    return {
      build: buildFromAnswers({
        meat: line.answers[MEAT_FIELD_KEY]?.options?.[0] ?? null,
        sauces: line.answers[SAUCE_FIELD_KEY]?.options ?? [],
        text,
      }),
      icon: item.materialIcon,
    };
  }
  return { build: null, icon: firstIcon ?? FALLBACK_ICON };
};
