export const APP_VERSION = "0.9.5";
export const APP_CACHE_NAME = "mdb-v0-9-5";
export const SWIPE_ANIMATION_MS = 180;
export const DRAW_HOLD_MS = 500;
export const DRAW_RETURN_COUNTDOWN_SECONDS = 3;
export const UNCATEGORIZED_ID = "uncategorized";

export const MODE_CONFIG = {
  lyrics: {
    id: "lyrics",
    name: "La suite, maestro !",
    gameLabel: "LA SUITE, MAESTRO !",
    description: "Chanter le début et retrouver la suite",
    color: "#b981ff",
    icon: "lyrics",
    rules: [
      "Les autres lisent le début des paroles et le chantent sur le bon air.",
      "La personne qui tient le téléphone doit retrouver immédiatement la suite affichée en vert.",
      "Aucun indice parlé : seule la chanson doit permettre de reconnaître le morceau."
    ],
    libraryUrl: "./data/lyrics.json",
    type: "lyrics",
    storage: {
      boxes: "mdb-lyrics-boxes-v1",
      cards: "mdb-lyrics-cards-v1",
      meta: "mdb-library-meta-v1",
      selection: "mdb-lyrics-selection-v2"
    }
  },
  mime: {
    id: "mime",
    name: "Ferme-la et mime !",
    gameLabel: "FERME-LA ET MIME !",
    description: "Faire deviner une scène uniquement par gestes",
    color: "#ffad45",
    icon: "mime",
    rules: [
      "Les autres voient la consigne affichée sur le téléphone.",
      "Ils doivent la mimer sans parler, sans écrire et sans faire de bruit volontaire.",
      "La personne qui tient le téléphone annonce ce qu’elle pense avoir reconnu."
    ],
    libraryUrl: "./data/mimes.json",
    type: "mime",
    storage: {
      boxes: "mdb-mime-boxes-v1",
      cards: "mdb-mime-cards-v1",
      meta: "mdb-mime-library-meta-v1",
      selection: "mdb-mime-selection-v1"
    }
  },
  words: {
    id: "words",
    name: "Sans le dire !",
    gameLabel: "SANS LE DIRE !",
    description: "Faire deviner un mot sans prononcer les indices interdits",
    color: "#ff6b9c",
    icon: "words",
    rules: [
      "Les autres décrivent le mot affiché pour le faire deviner à la personne qui tient le téléphone.",
      "Il est interdit de prononcer le mot lui-même, un mot de la même famille ou les mots interdits affichés en rouge.",
      "Dans les réglages du mode, les mots interdits peuvent être masqués pour jouer en version plus libre."
    ],
    libraryUrl: "./data/words.json",
    type: "words",
    storage: {
      boxes: "mdb-words-boxes-v1",
      cards: "mdb-words-cards-v1",
      meta: "mdb-words-library-meta-v1",
      selection: "mdb-words-selection-v1"
    }
  },
  drinking: {
    id: "drinking",
    name: "Qui boit, bordel ?",
    gameLabel: "QUI BOIT, BORDEL ?",
    description: "Votes, défis, dossiers et chaos de soirée",
    color: "#ff477e",
    icon: "drinking",
    standalone: true,
    difficultyLabels: { easy: "Pépouze", medium: "Ça chauffe", hard: "Demain, on nie tout" },
    rules: [
      "Le téléphone reste visible par tout le groupe et les cartes avancent manuellement.",
      "Les joueurs ciblés sont répartis équitablement ; chacun peut répondre, refuser ou ne pas être concerné selon la carte.",
      "Les gorgées ajoutent aussi des points de pénalité. Les joueurs Team soft reçoivent une alternative adaptée."
    ],
    libraryUrl: "./data/drinking.json",
    type: "drinking",
    storage: {
      boxes: "mdb-drinking-boxes-v1",
      cards: "mdb-drinking-cards-v1",
      meta: "mdb-drinking-library-meta-v1",
      selection: "mdb-drinking-selection-v1"
    }
  },
  draw: {
    id: "draw",
    name: "Picasso en PLS",
    gameLabel: "PICASSO EN PLS",
    description: "Faire deviner une consigne en la dessinant sur le téléphone ou sur papier",
    color: "#20c9be",
    icon: "draw",
    rules: [
      "Le dessinateur touche la carte pour révéler la consigne sans la montrer aux autres.",
      "Il choisit « Je gribouille ici » ou « Je massacre une feuille ».",
      "En partie mélangée, le chrono général se met en pause puis reprend après une pénalité fixe.",
      "Aucune lettre, aucun mot et aucun chiffre ne doit donner directement la réponse."
    ],
    libraryUrl: "./data/drawings.json",
    type: "draw",
    storage: {
      boxes: "mdb-draw-boxes-v1",
      cards: "mdb-draw-cards-v1",
      meta: "mdb-draw-library-meta-v1",
      selection: "mdb-draw-selection-v1"
    }
  }
};

export const MODE_ORDER = ["lyrics", "mime", "words", "draw", "drinking"];
export const GLOBAL_SETTINGS_KEY = "mdb-global-settings-v2";
export const LEGACY_SETTINGS_KEY = "mdb-settings-v1";
export const MULTIPLAYER_SESSION_KEY = "mdb-multiplayer-session-v2";
export const DRINKING_SESSION_KEY = "mdb-drinking-session-v1";
export const DRINKING_SESSION_SCHEMA = 2;
export const CARD_REMOVAL_REPORTS_KEY = "mdb-card-removal-reports-v1";
export const CARD_REMOVAL_REPORT_SCHEMA = 1;
export const MULTIPLAYER_SESSION_SCHEMA = 3;
export const MIN_MULTIPLAYER_PLAYERS = 2;
export const MAX_MULTIPLAYER_PLAYERS = 12;

export const MODE_ICONS = {
  lyrics: `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <g transform="rotate(-10 29 27)">
        <rect x="20" y="7" width="21" height="34" rx="10.5" fill="currentColor"/>
        <path d="M24 17h13M23 23h15M23 29h15" stroke="#111318" stroke-width="2.5" stroke-linecap="round" opacity=".78"/>
        <path d="M16 28c0 10 6 17 15 17s15-7 15-17" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <path d="M31 45v8M22 55h18" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </g>
      <path d="M48 11v13.5a5 5 0 1 1-3-4.6V14l10-2.5v10a5 5 0 1 1-3-4.6V9.5L48 11Z" fill="currentColor" opacity=".95"/>
    </svg>`,
  mime: `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="32" cy="35" rx="17" ry="21" stroke="currentColor" stroke-width="4"/>
      <path d="M15 21c4-9 12-14 22-13 8 0 14 4 18 10-8 3-16 4-25 3-6 0-11 0-15 0Z" fill="currentColor"/>
      <path d="M27 9c2-4 6-6 10-5 3 1 5 3 6 6" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="25.5" cy="31" r="2.5" fill="currentColor"/>
      <circle cx="38.5" cy="31" r="2.5" fill="currentColor"/>
      <path d="m26 41 12 9M38 41l-12 9" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`,
  words: `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M9 10h46v33H31L18 54V43H9V10Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="22" cy="27" r="3" fill="currentColor"/><circle cx="32" cy="27" r="3" fill="currentColor"/><circle cx="42" cy="27" r="3" fill="currentColor"/>
      <circle cx="49" cy="48" r="10" fill="#111318" stroke="currentColor" stroke-width="3"/>
      <path d="m43 54 12-12" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
  drinking: `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M18 8h28l-3 37a11 11 0 0 1-11 10 11 11 0 0 1-11-10L18 8Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <path d="M21 23h22l-2 21a9 9 0 0 1-18 0l-2-21Z" fill="currentColor" opacity=".3"/>
      <path d="M24 28c4 3 12 3 16 0" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M32 2v9M28 6h8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M49 16l4-4M52 21h6M47 11V5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  draw: `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M13 49c9-9 15 7 24-1 7-6 8-15 17-12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <path d="m11 43 7 7 30-30-7-7-30 30Z" fill="currentColor"/>
      <path d="m41 13 7 7 5-5c2-2 2-5 0-7s-5-2-7 0l-5 5Z" fill="currentColor" opacity=".78"/>
      <path d="m11 43-2 10 10-3-8-7Z" fill="currentColor" opacity=".8"/>
      <circle cx="51" cy="47" r="3" fill="currentColor"/><circle cx="57" cy="41" r="2" fill="currentColor" opacity=".8"/>
    </svg>`
};


export const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

export const DIFFICULTY_META = {
  easy: { shortLabel: "F", label: "Facile", color: "#48e07d" },
  medium: { shortLabel: "M", label: "Moyen", color: "#58a6ff" },
  hard: { shortLabel: "D", label: "Difficile", color: "#ff6b72" }
};

export const DIFFICULTY_LABELS = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile"
};
