import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { useFunnyLine } from "@/lib/use-funny-line";
import { successCopy } from "../../../copy";

// Green check tile + title + subline. Presentational only.
export const SuccessHeader: FC = () => {
  const title = useFunnyLine(successCopy.titles);
  const subline = useFunnyLine(successCopy.sublines);

  return (
    <Stack sx={{ alignItems: "center", gap: 0.5 }}>
      <Stack
        sx={(theme) => ({
          width: 78,
          height: 78,
          borderRadius: "50%",
          backgroundColor: theme.ds.greenTint,
          alignItems: "center",
          justifyContent: "center",
          mb: 0.5,
        })}
      >
        <MaterialIcon name="check" sx={{ fontSize: 46, color: "success.main" }} />
      </Stack>
      <Typography variant="h1" component="h1" sx={{ fontSize: "1.4375rem", color: "navy.main" }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: "0.875rem", color: "muted.main", textAlign: "center" }}>
        {subline}
      </Typography>
    </Stack>
  );
};
