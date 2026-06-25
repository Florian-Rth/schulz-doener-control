// German UI strings for the profile / PayPal-handle UI. Single-locale app.
export const profileCopy = {
  eyebrow: "Geld kassieren",
  title: "Dein PayPal-Link",
  intro:
    "Füge deinen PayPal-Link ein, Chef (z. B. https://paypal.me/deinname) — wir lesen deinen Namen automatisch heraus. Erst dann können Kollegen dir per Klick Geld senden.",
  fieldLabel: "PayPal-Link",
  fieldPlaceholder: "https://paypal.me/deinname",
  submit: "Speichern",
  saving: "Speichern …",
  saved: "Gespeichert ✓",
  errorGeneric: "Konnte nicht gespeichert werden, Chef. Versuch es nochmal.",
  gatedNotice: "PayPal-Buttons bleiben deaktiviert, bis du deinen Link hinterlegt hast.",
  // Clear-to-cash action — only offered when a handle is currently set.
  clearAction: "PayPal-Link entfernen",
  clearConfirmTitle: "PayPal-Link entfernen?",
  clearConfirmBody: "Ohne PayPal-Link wirst du in bar bezahlt, Chef.",
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

// German legal-notice (Impressum) per §5 DDG / §18 MStV. The body values are
// PLACEHOLDERS and MUST be replaced with the operator's real legal details
// before this app is exposed to anyone outside the office.
export const impressumCopy = {
  eyebrow: "Rechtliches",
  title: "Impressum",
  backIconLabel: "Zurück zur Übersicht",
  intro: "Angaben gemäß §5 DDG.",
  // Anbieter / Firmenname + Anschrift.
  providerEyebrow: "Diensteanbieter",
  providerTitle: "Anschrift",
  // TODO: echte Angaben eintragen.
  companyName: "TODO: Firmenname eintragen",
  streetLine: "TODO: Straße und Hausnummer eintragen",
  cityLine: "TODO: PLZ und Ort eintragen",
  // Kontakt.
  contactEyebrow: "Kontakt",
  contactTitle: "So erreichst du uns",
  emailLabel: "E-Mail",
  emailValue: "TODO: E-Mail-Adresse eintragen",
  phoneLabel: "Telefon",
  phoneValue: "TODO: Telefonnummer eintragen",
  // Vertretung + Verantwortlichkeit.
  representationEyebrow: "Verantwortung",
  representationTitle: "Wer steckt dahinter",
  representativeLabel: "Vertretungsberechtigte Person",
  representativeValue: "TODO: Name der vertretungsberechtigten Person eintragen",
  vatLabel: "USt-IdNr.",
  vatValue: "TODO: Umsatzsteuer-Identifikationsnummer eintragen (falls vorhanden)",
  responsibleLabel: "Verantwortlich für den Inhalt",
  responsibleValue: "TODO: Name der inhaltlich verantwortlichen Person eintragen",
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
