import type { FC } from "react";
import type { IngredientSpec } from "./food";
import { PieceVolley } from "./PieceVolley";
import { useVolleyGeneration } from "./use-volley-generation";

interface IngredientBatchProps {
  spec: IngredientSpec;
  seed: number;
  active: boolean;
  onHit: (strength: number) => void;
  gentle: boolean;
}

// Lifecycle of one ingredient: always mounted (parked until thrown), a fresh
// volley every time it goes back in; the last one stays on the floor after it
// was yeeted out.
export const IngredientBatch: FC<IngredientBatchProps> = ({
  spec,
  seed,
  active,
  onHit,
  gentle,
}) => {
  const generation = useVolleyGeneration(active);
  return (
    <PieceVolley
      key={generation}
      spec={spec}
      seed={seed + generation * 7919}
      active={active}
      onHit={onHit}
      gentle={gentle}
    />
  );
};
