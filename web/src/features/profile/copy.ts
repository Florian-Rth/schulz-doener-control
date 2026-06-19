// German UI strings for the profile / PayPal-handle UI. Single-locale app.
export const profileCopy = {
  eyebrow: "Profil",
  title: "Dein PayPal.Me-Name",
  intro:
    "Hinterlege deinen PayPal.Me-Namen, Chef. Erst dann können Kollegen dir per Klick Geld senden.",
  fieldLabel: "PayPal.Me-Name",
  fieldPlaceholder: "z. B. MarkusW",
  prefix: "paypal.me/",
  submit: "Speichern",
  saving: "Speichern …",
  saved: "Gespeichert ✓",
  errorGeneric: "Konnte nicht gespeichert werden, Chef. Versuch es nochmal.",
  gatedNotice: "PayPal-Buttons bleiben deaktiviert, bis du deinen Namen hinterlegt hast.",
} as const;

// German UI strings for the change-password screen. Reached as a forced step for
// freshly provisioned accounts; tone stays playful and addresses the "Chef".
export const changePasswordCopy = {
  eyebrow: "Sicherheits-Schleuse",
  title: "Neues Passwort vergeben",
  intro:
    "Bevor es zum Döner geht, brauchst du ein eigenes Passwort, Chef. Das Start-Passwort gilt nur einmal.",
  currentLabel: "Aktuelles Passwort",
  currentPlaceholder: "••••••••",
  newLabel: "Neues Passwort",
  newPlaceholder: "Mindestens 10 Zeichen",
  confirmLabel: "Neues Passwort bestätigen",
  confirmPlaceholder: "Nochmal eingeben",
  hint: "Mindestens 10 Zeichen, davon mindestens ein Buchstabe und eine Ziffer.",
  submit: "Passwort speichern",
  saving: "Speichern …",
  wrongCurrent: "Das aktuelle Passwort stimmt nicht, Chef. Nochmal prüfen.",
  errorGeneric: "Passwort konnte nicht geändert werden, Chef. Versuch es nochmal.",
} as const;
