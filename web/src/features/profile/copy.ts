// German UI strings for the profile / PayPal-handle UI. Single-locale app.
export const profileCopy = {
  eyebrow: "Geld kassieren",
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
  // Clear-to-cash action — only offered when a handle is currently set.
  clearAction: "PayPal-Name entfernen",
  clearConfirmTitle: "PayPal-Name entfernen?",
  clearConfirmBody: "Ohne PayPal-Name wirst du in bar bezahlt, Chef.",
  clearConfirm: "Entfernen",
  clearPending: "Entfernen …",
  clearCancel: "Abbrechen",
  clearError: "Konnte nicht entfernt werden, Chef. Versuch es nochmal.",
} as const;

// German UI strings for the self-service settings hub at /einstellungen.
export const settingsCopy = {
  eyebrow: "Einstellungen",
  title: "Dein Profil, Chef",
  back: "Zurück zur Übersicht",
  backIconLabel: "Zurück zur Übersicht",
  loading: "Einen Moment, Chef …",
  // Identität section.
  identitySectionEyebrow: "Identität",
  identitySectionTitle: "Wer bist du, Chef?",
  displayNameLabel: "Anzeigename",
  displayNameHelper: "So sehen dich die Kollegen, Chef.",
  displayNamePlaceholder: "z. B. Markus Wagner",
  displayNameSubmit: "Namen speichern",
  displayNameSaving: "Speichern …",
  displayNameSaved: "Gespeichert ✓",
  displayNameError: "Konnte nicht gespeichert werden, Chef. Versuch es nochmal.",
  // Read-only identity preview. The session does not carry the login username,
  // so we show the live avatar + first name (the greeting name) as the identity.
  identityPreviewLabel: "Dein Avatar",
  // Sicherheit section.
  securitySectionEyebrow: "Sicherheit",
  securitySectionTitle: "Passwort",
  securityIntro: "Zeit für ein frisches Passwort, Chef?",
  changePasswordLink: "Passwort ändern",
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
