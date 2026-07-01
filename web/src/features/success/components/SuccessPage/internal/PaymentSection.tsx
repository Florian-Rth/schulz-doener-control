import type { FC } from "react";
import type { OrderResult } from "../../../types";
import { NoAbholerCard } from "./NoAbholerCard";
import { OwesAbholerCard } from "./OwesAbholerCard";
import { PickupCollectCard } from "./PickupCollectCard";

interface PaymentSectionProps {
  result: OrderResult;
}

// Logic-gated layout: mounts exactly one payment card from result.isPickup —
// the navy collect card for the pickup person, the owes-abholer card otherwise,
// or the "no Abholer yet" info card when nobody is picking up yet.
export const PaymentSection: FC<PaymentSectionProps> = ({ result }) => {
  if (result.isPickup) {
    return (
      <PickupCollectCard collectCents={result.collectCents} collectCount={result.collectCount} />
    );
  }
  if (result.abholer === null) {
    return <NoAbholerCard />;
  }
  return <OwesAbholerCard abholer={result.abholer} priceCents={result.priceCents} />;
};
