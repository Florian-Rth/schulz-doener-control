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
    benachrichtigungen: {
      title: "Push-Texte",
      description: "Die Döner-Sprüche pflegen, die beim Öffnen rausgehen.",
      icon: "campaign",
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

// German UI strings for the menu-administration screen (/admin/menue).
export const menuCopy = {
  title: "Menü",
  subtitle: "Karte pflegen",
  intro: "Hier pflegst du die Karte, Chef: Döner, Pizza und Insider-Spezialitäten.",
  loading: "Karte wird geladen …",
  loadError: "Die Karte konnte nicht geladen werden, Chef. Versuch es nochmal.",
  empty: "Noch nichts auf der Karte, Chef. Leg das erste Gericht an.",
  addButton: "Gericht anlegen",
  // Kinds
  kindDoener: "Döner",
  kindPizza: "Pizza",
  // Status badges
  available: "Verfügbar",
  retired: "Nicht verfügbar",
  insider: "Insider",
  sortLabel: (order: number): string => `Reihenfolge ${order}`,
  // Per-row actions
  actionEdit: "Bearbeiten",
  actionDelete: "Entfernen",
  // Field labels (shared create/edit)
  idLabel: "ID (optional)",
  idPlaceholder: "leer lassen für automatisch",
  idHint: "Leer lassen, dann leiten wir sie aus dem Namen ab, Chef.",
  nameLabel: "Name",
  namePlaceholder: "z. B. Dürüm Kalb",
  priceLabel: "Preis (€)",
  pricePlaceholder: "z. B. 8,50",
  kindLabel: "Art",
  iconLabel: "Symbol",
  noteLabel: "Notiz (optional)",
  notePlaceholder: "z. B. nur freitags",
  insiderLabel: "Insider-Spezialität",
  availableLabel: "Verfügbar",
  sortOrderLabel: "Reihenfolge",
  // Create dialog
  createTitle: "Neues Gericht anlegen",
  createSubmit: "Anlegen",
  createSubmitting: "Wird angelegt …",
  // Edit dialog
  editTitle: "Gericht bearbeiten",
  editSubmit: "Speichern",
  editSubmitting: "Speichern …",
  // Delete confirmation
  deleteTitle: "Gericht entfernen?",
  deleteBody: (name: string): string =>
    `Soll ${name} wirklich von der Karte, Chef? Gerichte, die in früheren Bestellungen vorkommen, werden nur ausgeblendet (stillgelegt) statt gelöscht – die alten Bestellungen bleiben heil.`,
  deleteConfirm: "Ja, entfernen",
  deleting: "Wird entfernt …",
  cancel: "Abbrechen",
  // Server-error mappings
  errorDuplicate: "Diese ID gibt es schon, Chef. Wähl eine andere.",
  errorValidation: "Die Eingaben passen nicht, Chef. Prüf die Felder.",
  errorGeneric: "Hat nicht geklappt, Chef. Versuch es nochmal.",
} as const;

// German UI strings for the notification-text screen (/admin/benachrichtigungen). These are the
// open-day push messages; one active text is picked at random when a Döner-Tag opens.
export const templatesCopy = {
  title: "Push-Texte",
  subtitle: "Döner-Sprüche pflegen",
  intro:
    "Diese Sprüche gehen raus, wenn jemand den Döner-Tag eröffnet, Chef. Beim Öffnen wird einer der aktiven zufällig gewählt.",
  loading: "Sprüche werden geladen …",
  loadError: "Die Sprüche konnten nicht geladen werden, Chef. Versuch es nochmal.",
  empty: "Noch keine Sprüche, Chef. Leg den ersten an.",
  addButton: "Spruch anlegen",
  // Status badges
  active: "Aktiv",
  inactive: "Inaktiv",
  // Per-row actions
  actionEdit: "Bearbeiten",
  actionDelete: "Entfernen",
  // Field labels (shared create/edit)
  synonymLabel: "Döner-Synonym",
  synonymPlaceholder: "z. B. Drehspieß-Tasche",
  bodyLabel: "Push-Text",
  bodyPlaceholder: "z. B. Heute rotiert die Drehspieß-Tasche! Wer ist dabei? 🌯",
  activeLabel: "Aktiv (wird verschickt)",
  // Create dialog
  createTitle: "Neuen Spruch anlegen",
  createSubmit: "Anlegen",
  createSubmitting: "Wird angelegt …",
  // Edit dialog
  editTitle: "Spruch bearbeiten",
  editSubmit: "Speichern",
  editSubmitting: "Speichern …",
  // Delete confirmation
  deleteTitle: "Spruch entfernen?",
  deleteBody: (synonym: string): string =>
    `Soll der Spruch „${synonym}" wirklich weg, Chef? Das lässt sich nicht rückgängig machen.`,
  deleteConfirm: "Ja, entfernen",
  deleting: "Wird entfernt …",
  cancel: "Abbrechen",
  // Server-error mappings
  errorValidation: "Die Eingaben passen nicht, Chef. Prüf die Felder.",
  errorGeneric: "Hat nicht geklappt, Chef. Versuch es nochmal.",
} as const;

// German UI strings for the read-only Döner-Tiere screen (/admin/tiere). The
// tier names, taglines, tags and trigger conditions all come from the backend;
// only the screen chrome lives here.
export const tiereCopy = {
  title: "Döner-Tiere",
  subtitle: "Die 15 erfassten Exemplare",
  intro:
    "Hier siehst du, wie jedes Döner-Tier vergeben wird, Chef. Nur zum Nachschlagen – hier gibt's nichts zu schrauben.",
  windowBasis: (windowDays: number): string =>
    `Berechnet über die letzten ${windowDays} Tage, Chef.`,
  conditionLabel: "Bedingung",
  loading: "Tiere werden geladen …",
  loadError: "Die Döner-Tiere konnten nicht geladen werden, Chef. Versuch es nochmal.",
  empty: "Noch keine Döner-Tiere erfasst, Chef.",
} as const;
