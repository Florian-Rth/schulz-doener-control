import type { FC } from "react";
import { SauceSquirt } from "./SauceSquirt";
import { useVolleyGeneration } from "./use-volley-generation";

interface SauceStreamProps {
  color: string;
  seed: number;
  active: boolean;
  onHit: (strength: number) => void;
  gentle: boolean;
}

// Sauce cannot be taken back out of a Döner — deselecting wipes it away, and
// selecting it again squirts a fresh portion. While not selected, a dormant
// (never fired) squirt stays mounted so its shader is compiled up front.
export const SauceStream: FC<SauceStreamProps> = ({ color, seed, active, onHit, gentle }) => {
  const generation = useVolleyGeneration(active);
  return (
    <SauceSquirt
      key={active ? generation : "dormant"}
      armed={active}
      color={color}
      seed={seed + generation * 104729}
      onHit={onHit}
      gentle={gentle}
    />
  );
};
