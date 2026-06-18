import RamenDiningOutlinedIcon from "@mui/icons-material/RamenDiningOutlined";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";

interface HomePageProps {
  greetingName: string;
}

export const HomePage: FC<HomePageProps> = ({ greetingName }) => {
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 4, borderColor: "navy.main", borderWidth: 2 }}>
        <Stack sx={{ alignItems: "flex-start", gap: 2 }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <RamenDiningOutlinedIcon sx={{ color: "primary.main", fontSize: 40 }} />
            <Typography variant="h1" component="h1" sx={{ color: "navy.main" }}>
              Schulz Döner Control
            </Typography>
          </Stack>
          <Typography variant="h2" component="p" sx={{ color: "primary.main" }}>
            Moin, {greetingName}!
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            Alles im Griff, Chef. Heute noch keinen Döner-Tag eröffnet — willst du der Held sein?
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
};
