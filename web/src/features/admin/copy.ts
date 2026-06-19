// German UI strings for the admin area. Single-locale app — plain constants.
// Addresses the operator as "Chef" per the house tone.
export const adminCopy = {
  title: "Admin-Bereich",
  subtitle: "Steuerstand für den Döner-Tag",
  intro: "Hier ziehst du die Fäden, Chef. Wähl deinen Bereich.",
  back: "Zurück zur Übersicht",
  backIconLabel: "Zurück",
  cards: {
    benutzer: {
      title: "Benutzer",
      description: "Mannschaft anlegen, Rollen vergeben, Passwörter zurücksetzen.",
      icon: "workspace_premium",
    },
    menue: {
      title: "Menü",
      description: "Döner, Pizza & Insider-Spezialitäten pflegen.",
      icon: "restaurant",
    },
    tiere: {
      title: "Döner-Tiere",
      description: "Die 15 erfassten Exemplare und ihre Bedingungen.",
      icon: "kebab_dining",
    },
  },
} as const;

// German UI strings for the user-administration screen (/admin/benutzer).
export const usersCopy = {
  title: "Benutzer",
  subtitle: "Mannschaft verwalten",
  intro: "Hier legst du Kollegen an, vergibst Rollen und ziehst Passwörter neu, Chef.",
  loading: "Mannschaft wird geladen …",
  loadError: "Die Mannschaft konnte nicht geladen werden, Chef. Versuch es nochmal.",
  empty: "Noch keine Kollegen angelegt, Chef. Leg den ersten an.",
  addButton: "Kollegen anlegen",
  roleAdmin: "Admin",
  roleEmployee: "Mitarbeiter",
  active: "Aktiv",
  inactive: "Deaktiviert",
  mustChange: "Muss Passwort ändern",
  // Per-row actions
  actionEdit: "Bearbeiten",
  actionReset: "Passwort zurücksetzen",
  actionDeactivate: "Deaktivieren",
  actionsLabel: "Aktionen",
  // Field labels (shared create/edit)
  usernameLabel: "Benutzername",
  usernamePlaceholder: "z. B. markus.wagner",
  displayNameLabel: "Anzeigename",
  displayNamePlaceholder: "z. B. Markus Wagner",
  payPalLabel: "PayPal.Me-Name (optional)",
  payPalPlaceholder: "z. B. MarkusW",
  payPalPrefix: "paypal.me/",
  roleLabel: "Rolle",
  activeLabel: "Konto aktiv",
  // Create dialog
  createTitle: "Neuen Kollegen anlegen",
  createSubmit: "Anlegen",
  createSubmitting: "Wird angelegt …",
  // Edit dialog
  editTitle: "Kollegen bearbeiten",
  editSubmit: "Speichern",
  editSubmitting: "Speichern …",
  // Deactivate confirmation
  deactivateTitle: "Kollegen deaktivieren?",
  deactivateBody: (name: string): string =>
    `Soll ${name} wirklich deaktiviert werden, Chef? Das Konto kann sich danach nicht mehr anmelden.`,
  deactivateConfirm: "Ja, deaktivieren",
  deactivating: "Wird deaktiviert …",
  // Reset confirmation
  resetTitle: "Passwort zurücksetzen?",
  resetBody: (name: string): string =>
    `Soll für ${name} ein neues Start-Passwort erzeugt werden, Chef? Das alte gilt dann nicht mehr.`,
  resetConfirm: "Ja, zurücksetzen",
  resetting: "Wird zurückgesetzt …",
  cancel: "Abbrechen",
  // One-time temporary password reveal
  tempTitle: "Start-Passwort",
  tempWarning:
    "Einmalig sichtbar — gib es dem Kollegen; er muss es beim ersten Login ändern, Chef.",
  tempCopy: "Kopieren",
  tempCopied: "Kopiert ✓",
  tempClose: "Fertig",
  tempFor: (name: string): string => `Für ${name}`,
  // Server-error mappings
  errorDuplicate: "Diesen Benutzernamen gibt es schon, Chef. Wähl einen anderen.",
  errorLastAdmin:
    "Das ist der letzte aktive Admin, Chef. Den kannst du nicht degradieren oder deaktivieren.",
  errorValidation: "Die Eingaben passen nicht, Chef. Prüf die Felder.",
  errorGeneric: "Hat nicht geklappt, Chef. Versuch es nochmal.",
} as const;
