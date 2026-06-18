// German money display local to the success feature. Operates on integer cents
// (the data model). 850 -> "8,50 €".
export const formatEur = (cents: number): string => {
  const euros = cents / 100;
  return `${euros.toFixed(2).replace(".", ",")} €`;
};
