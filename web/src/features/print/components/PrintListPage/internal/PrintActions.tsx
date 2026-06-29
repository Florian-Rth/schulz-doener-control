import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { GhostButton, MaterialIcon, PrimaryButton, PushToast } from "@/components";
import { printCopy } from "../../../copy";
import { usePrintListContext } from "../../../print-context";

// Screen-only action bar: the optional "Liste an meine Mail schicken" CTA (or a
// settings hint when no work e-mail is set), the red "Drucken" CTA
// (window.print) and the ghost back link. Marked data-print-hide so none of it
// appears on the printed sheet.
export const PrintActions: FC = () => {
  const {
    print,
    goBack,
    emailButtonVisible,
    emailHintVisible,
    emailList,
    isEmailingList,
    emailToast,
    dismissEmailToast,
  } = usePrintListContext();

  return (
    <Stack data-print-hide sx={{ gap: 1.25 }}>
      {emailToast !== null ? (
        <PushToast message={emailToast} onDismiss={dismissEmailToast} />
      ) : null}

      {emailButtonVisible ? (
        <PrimaryButton onClick={emailList} loading={isEmailingList} startIcon="mail">
          {isEmailingList ? printCopy.emailListSending : printCopy.emailList}
        </PrimaryButton>
      ) : null}

      {emailHintVisible ? (
        <Stack
          direction="row"
          sx={(theme) => ({
            gap: 1,
            alignItems: "center",
            backgroundColor: "pinkTint.main",
            borderRadius: `${theme.radii.sm - 1}px`,
            p: 1.25,
          })}
        >
          <MaterialIcon name="mail" sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography sx={{ flex: 1, fontSize: "0.75rem", color: "navy.main", lineHeight: 1.4 }}>
            {printCopy.emailListNeedsWorkMail}
          </Typography>
          <Typography
            component={Link}
            to="/einstellungen"
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "primary.main",
              whiteSpace: "nowrap",
            }}
          >
            {printCopy.emailListNeedsWorkMailCta}
          </Typography>
        </Stack>
      ) : null}

      <PrimaryButton onClick={print} startIcon="print">
        {printCopy.print}
      </PrimaryButton>
      <GhostButton onClick={goBack}>{printCopy.back}</GhostButton>
    </Stack>
  );
};
