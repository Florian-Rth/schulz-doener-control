// German UI strings for the auth feature. Single-locale app — plain constants,
// no i18n machinery (per the authoritative plan).
export const authCopy = {
  eyebrow: "Betriebs-Kantinen-System",
  heading: "Mitarbeiter-Login",
  subline: "Zugang nur für autorisiertes Döner-Personal. Bitte Werks-Kennung eingeben.",
  usernameLabel: "Benutzername",
  usernamePlaceholder: "z. B. m.wagner",
  passwordLabel: "Passwort",
  passwordPlaceholder: "••••••••",
  submit: "Anmelden",
  serverStatus: "Döner-Server erreichbar · Werk HB-01 · v3.0",
  loginFailed: "Anmeldung fehlgeschlagen. Benutzername oder Passwort prüfen, Chef.",
  brandAlt: "Schulz Döner Control",
  profileMenuLabel: "Profilmenü öffnen",
  changePassword: "Passwort ändern",
  logout: "Abmelden",
} as const;
