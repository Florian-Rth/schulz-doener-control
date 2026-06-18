import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { TierRow } from "@/components";
import type { TierCatalog } from "../../../types";

interface TiereListProps {
  entries: TierCatalog;
}

// The vertical list of catalog rows. Each row highlights itself when `isMine`.
export const TiereList: FC<TiereListProps> = ({ entries }) => {
  return (
    <Stack sx={{ gap: 1.25 }}>
      {entries.map((entry) => (
        <TierRow
          key={entry.name}
          emoji={entry.emoji}
          name={entry.name}
          tagline={entry.tagline}
          isMine={entry.isMine}
        />
      ))}
    </Stack>
  );
};
