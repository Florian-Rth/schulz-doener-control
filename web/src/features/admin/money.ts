// Money helpers local to the admin menu feature. Operate on integer cents (the
// data model / wire value). German display uses a comma decimal separator.

// Cents (e.g. 850) -> a German-formatted editable string ("8,50").
export const centsToInput = (cents: number): string => {
  const euros = cents / 100;
  return euros.toFixed(2).replace(".", ",");
};

// A user-typed price string ("8,50" / "8.5" / "9") -> integer cents. Returns
// null when the input cannot be parsed as a non-negative number.
export const inputToCents = (raw: string): number | null => {
  const normalized = raw.trim().replace(",", ".");
  if (normalized === "") {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100);
};
