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
    kategorien: {
      title: "Kategorien",
      description: "Kategorien pflegen und ihnen Felder zuweisen.",
      icon: "category",
    },
    felder: {
      title: "Felder",
      description: "Die Felder & Optionen pflegen, aus denen die Bestellung besteht.",
      icon: "tune",
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
    registrierung: {
      title: "Registrierung",
      description: "Türen auf, zu oder nur mit Code – wer darf in den Trupp?",
      icon: "how_to_reg",
    },
  },
} as const;

// German UI strings for the registration-mode screen (/admin/registrierung). The admin picks who
// may self-register: open for all, closed, or only with the shared secret key.
export const registrationCopy = {
  title: "Registrierung",
  subtitle: "Wer darf in den Trupp?",
  intro:
    "Hier bestimmst du, wer sich selbst ein Konto anlegen darf, Chef. Bei „Nur mit Registrierungscode“ kommt nur rein, wer den Code aus dem QR-Link kennt.",
  loading: "Einstellung wird geladen …",
  loadError: "Die Einstellung konnte nicht geladen werden, Chef. Versuch es nochmal.",
  modeLabel: "Registrierungs-Modus",
  modeEnabled: "Offen für alle",
  modeDisabled: "Geschlossen",
  modeSecretKey: "Nur mit Registrierungscode",
  secretKeyLabel: "Registrierungscode",
  secretKeyPlaceholder: "z. B. doener-2026",
  secretKeyHelper:
    "Diesen Code hängst du an den Registrier-Link (?secretKey=…) bzw. baust ihn in den QR-Code ein, Chef.",
  secretKeyRequired: "Für „Nur mit Registrierungscode“ brauchst du einen Code, Chef.",
  saveButton: "Speichern",
  saving: "Wird gespeichert …",
  saveSuccess: "Gespeichert, Chef. Die Tür ist jetzt eingestellt.",
  // Server-error mappings
  errorValidation: "Die Eingaben passen nicht, Chef. Prüf die Felder.",
  errorGeneric: "Hat nicht geklappt, Chef. Versuch es nochmal.",
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
  payPalLabel: "PayPal-Link (optional)",
  payPalPlaceholder: "https://paypal.me/name",
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
  // Status badges
  available: "Verfügbar",
  retired: "Nicht verfügbar",
  insider: "Insider",
  noCategory: "Ohne Kategorie",
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
  categoryLabel: "Kategorie",
  categoryNone: "Ohne Kategorie",
  baseItemLabel: "Basis-Gericht (optional)",
  baseItemNone: "Kein Basis-Gericht",
  baseItemHint: "Wähl ein Gericht, wenn dies eine Voreinstellung davon ist, Chef.",
  defaultAnswersLabel: "Voreinstellungen",
  defaultAnswersHint: "Diese Auswahl ist beim Bestellen schon gesetzt, Chef.",
  answerNone: "— keine —",
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

// German UI strings for the category screen (/admin/kategorien). A category groups the fields a
// menu item's order form renders; the field-assignment editor lives inside the edit dialog.
export const categoriesCopy = {
  title: "Kategorien",
  subtitle: "Kategorien pflegen",
  intro:
    "Hier pflegst du die Kategorien, Chef. Jede Kategorie bündelt die Felder, die beim Bestellen abgefragt werden.",
  loading: "Kategorien werden geladen …",
  loadError: "Die Kategorien konnten nicht geladen werden, Chef. Versuch es nochmal.",
  empty: "Noch keine Kategorien, Chef. Leg die erste an.",
  addButton: "Kategorie anlegen",
  // Status badges
  available: "Verfügbar",
  unavailable: "Nicht verfügbar",
  sortLabel: (order: number): string => `Reihenfolge ${order}`,
  keyLabelShort: (key: string): string => `Schlüssel: ${key}`,
  fieldsCount: (count: number): string =>
    count === 1 ? "1 Feld zugewiesen" : `${count} Felder zugewiesen`,
  // Per-row actions
  actionEdit: "Bearbeiten",
  actionDelete: "Entfernen",
  // Field labels (shared create/edit)
  keyLabel: "Schlüssel",
  keyPlaceholder: "z. B. doener",
  keyLocked: "Der Schlüssel lässt sich nach dem Anlegen nicht mehr ändern, Chef.",
  nameLabel: "Name",
  namePlaceholder: "z. B. Döner",
  sortOrderLabel: "Reihenfolge",
  availableLabel: "Verfügbar",
  // Field-assignment editor
  fieldsSectionTitle: "Felder zuweisen",
  fieldsSectionHint:
    "Wähl die Felder, die diese Kategorie abfragt, und bring sie in Reihenfolge, Chef.",
  fieldsEmpty: "Noch keine Felder angelegt, Chef. Leg sie erst unter „Felder“ an.",
  requiredLabel: "Pflicht",
  moveUp: "Nach oben",
  moveDown: "Nach unten",
  fieldsSave: "Felder speichern",
  fieldsSaving: "Wird gespeichert …",
  fieldsSaved: "Felder gespeichert, Chef.",
  // Create dialog
  createTitle: "Neue Kategorie anlegen",
  createSubmit: "Anlegen",
  createSubmitting: "Wird angelegt …",
  // Edit dialog
  editTitle: "Kategorie bearbeiten",
  editSubmit: "Speichern",
  editSubmitting: "Speichern …",
  // Delete confirmation
  deleteTitle: "Kategorie entfernen?",
  deleteBody: (name: string): string =>
    `Soll die Kategorie „${name}" wirklich weg, Chef? Das geht nur, wenn kein Gericht sie mehr nutzt.`,
  deleteConfirm: "Ja, entfernen",
  deleting: "Wird entfernt …",
  cancel: "Abbrechen",
  // Server-error mappings
  errorDuplicate: "Diesen Schlüssel gibt es schon, Chef. Wähl einen anderen.",
  errorReferenced: "Diese Kategorie wird noch von einem Gericht genutzt, Chef. Erst umhängen.",
  errorValidation: "Die Eingaben passen nicht, Chef. Prüf die Felder.",
  errorGeneric: "Hat nicht geklappt, Chef. Versuch es nochmal.",
} as const;

// German UI strings for the fields screen (/admin/felder). Fields and their options are the order
// vocabulary; the meat/sauce fields (and their standard options) are reserved for the Tier engine.
export const fieldsCopy = {
  title: "Felder",
  subtitle: "Felder & Optionen pflegen",
  intro:
    "Hier pflegst du die Felder und ihre Optionen, Chef. Fleisch und Soße sind fürs Tier-System gesperrt – Texte und Preise darfst du trotzdem anpassen.",
  loading: "Felder werden geladen …",
  loadError: "Die Felder konnten nicht geladen werden, Chef. Versuch es nochmal.",
  empty: "Noch keine Felder, Chef. Leg das erste an.",
  addButton: "Feld anlegen",
  // Type / display labels
  typeSingle: "Einfachauswahl",
  typeMulti: "Mehrfachauswahl",
  typeText: "Freitext",
  displaySegmented: "Segmentiert",
  displayChips: "Chips",
  displayDropdown: "Dropdown",
  displayTextarea: "Textfeld",
  // Status badges / locks
  available: "Verfügbar",
  unavailable: "Nicht verfügbar",
  reserved: "Gesperrt",
  reservedFieldHint:
    "Fleisch und Soße sind fürs Tier-System gesperrt und lassen sich nicht löschen, Chef.",
  reservedOptionHint: "Diese Option ist fürs Tier-System gesperrt, Chef.",
  sortLabel: (order: number): string => `Reihenfolge ${order}`,
  priceDeltaLabel: (label: string): string => `Aufpreis ${label}`,
  // Per-row actions
  actionEdit: "Bearbeiten",
  actionDelete: "Entfernen",
  // Field dialog labels
  keyLabel: "Schlüssel",
  keyPlaceholder: "z. B. meat",
  keyLocked: "Der Schlüssel lässt sich nach dem Anlegen nicht mehr ändern, Chef.",
  labelLabel: "Bezeichnung",
  labelPlaceholder: "z. B. Fleisch",
  typeLabel: "Typ",
  typeLocked: "Der Typ lässt sich nach dem Anlegen nicht mehr ändern, Chef.",
  displayLabel: "Darstellung",
  maxLengthLabel: "Max. Zeichen",
  maxLengthHint: "Nur für Freitext-Felder, Chef.",
  // Options
  optionsTitle: "Optionen",
  optionsEmpty: "Noch keine Optionen, Chef.",
  addOption: "Option anlegen",
  optionKeyLabel: "Schlüssel",
  optionKeyPlaceholder: "z. B. kalb",
  optionLabelLabel: "Bezeichnung",
  optionLabelPlaceholder: "z. B. Kalb",
  optionIconLabel: "Symbol (optional)",
  optionIconPlaceholder: "z. B. 🥩 oder local_fire_department",
  optionPriceLabel: "Aufpreis (€)",
  optionSortOrderLabel: "Reihenfolge",
  optionAvailableLabel: "Verfügbar",
  // Create/edit field dialog
  createTitle: "Neues Feld anlegen",
  createSubmit: "Anlegen",
  createSubmitting: "Wird angelegt …",
  editTitle: "Feld bearbeiten",
  editSubmit: "Speichern",
  editSubmitting: "Speichern …",
  // Create/edit option dialog
  optionCreateTitle: "Neue Option anlegen",
  optionEditTitle: "Option bearbeiten",
  // Delete confirmations
  deleteFieldTitle: "Feld entfernen?",
  deleteFieldBody: (label: string): string =>
    `Soll das Feld „${label}" wirklich weg, Chef? Das geht nur, wenn keine Kategorie es mehr nutzt.`,
  deleteOptionTitle: "Option entfernen?",
  deleteOptionBody: (label: string): string =>
    `Soll die Option „${label}" wirklich weg, Chef? Sie wird stillgelegt, alte Bestellungen bleiben heil.`,
  deleteConfirm: "Ja, entfernen",
  deleting: "Wird entfernt …",
  cancel: "Abbrechen",
  // Server-error mappings
  errorDuplicate: "Diesen Schlüssel gibt es schon, Chef. Wähl einen anderen.",
  errorReserved: "Das ist fürs Tier-System gesperrt, Chef. Das lässt sich nicht löschen.",
  errorReferenced: "Dieses Feld wird noch von einer Kategorie genutzt, Chef. Erst abhängen.",
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
