import type { FC } from "react";
import { SelectChips } from "@/components";
import { useKonfiguratorContext } from "../konfigurator-context";

// Fleisch: picking one throws it in and moves on.
export const MeatStep: FC = () => {
  const { meatOptions, meat, pickMeat } = useKonfiguratorContext();

  return (
    <SelectChips
      options={meatOptions.map((option) => ({ value: option.key, label: option.label }))}
      value={meat}
      onChange={pickMeat}
    />
  );
};
