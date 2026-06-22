import Typography from "@mui/material/Typography";
import type { FC } from "react";
import type { FieldError as RhfFieldError } from "react-hook-form";

interface FieldErrorProps {
  /** The RHF error for the control above; nothing renders when undefined. */
  error: RhfFieldError | undefined;
  /** id so the control can reference this caption via aria-describedby. */
  id: string;
}

// Small error caption for the selector controls (SegmentedControl / SelectChips /
// MultiSelectChips / stepper) that do not accept an MUI error prop. Sits directly
// below its control and uses the theme error token — never a hardcoded color.
export const FieldError: FC<FieldErrorProps> = ({ error, id }) => {
  if (error === undefined) {
    return null;
  }
  return (
    <Typography
      id={id}
      role="alert"
      sx={{ fontSize: "0.75rem", fontWeight: 600, color: "error.main" }}
    >
      {error.message}
    </Typography>
  );
};
