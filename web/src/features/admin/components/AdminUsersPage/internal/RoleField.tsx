import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { SegmentedControl } from "@/components";
import { usersCopy } from "../../../copy";

interface RoleFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: Path<TForm>;
}

const roleOptions = [
  { value: "Employee", label: usersCopy.roleEmployee },
  { value: "Admin", label: usersCopy.roleAdmin },
] as const;

// RHF-bound role chooser: an "Employee | Admin" segmented control. The form
// stores the PascalCase value; the submit hook maps it to the numeric wire value.
export const RoleField = <TForm extends FieldValues>({
  control,
  name,
}: RoleFieldProps<TForm>): ReturnType<FC> => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Stack sx={{ gap: 0.75 }}>
          <Typography
            component="span"
            id={`${name}-label`}
            sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main" }}
          >
            {usersCopy.roleLabel}
          </Typography>
          <SegmentedControl
            options={roleOptions}
            value={field.value === "Admin" ? "Admin" : "Employee"}
            onChange={field.onChange}
          />
        </Stack>
      )}
    />
  );
};
