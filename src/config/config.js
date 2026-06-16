export const APP_VERSION = "0.7.1";
export const APP_CACHE_NAME = "mdb-v0-7-1";
export const SWIPE_ANIMATION_MS = 180;
export const DRAW_HOLD_MS = 500;
export const DRAW_RETURN_COUNTDOWN_SECONDS = 3;
export const UNCATEGORIZED_ID = "uncategorized";

export const MODE_CONFIG = {
  lyrics: {
    id: "lyrics",
    name: "Deviner les paroles",
    gameLabel: "DEVINER LES PAROLES",
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
    name: "Mimer",
    gameLabel: "MIMER",
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
  draw: {
    id: "draw",
    name: "Dessine-moi ça !",
    gameLabel: "DESSINE-MOI ÇA !",
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

export const MODE_ORDER = ["lyrics", "mime", "words", "draw"];
export const GLOBAL_SETTINGS_KEY = "mdb-global-settings-v2";
export const LEGACY_SETTINGS_KEY = "mdb-settings-v1";
export const MULTIPLAYER_SESSION_KEY = "mdb-multiplayer-session-v2";
export const MULTIPLAYER_SESSION_SCHEMA = 2;
export const MIN_MULTIPLAYER_PLAYERS = 2;
export const MAX_MULTIPLAYER_PLAYERS = 12;

export const MODE_ICONS = {
  lyrics: `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="34" cy="18" r="11" fill="currentColor" opacity=".95"/>
      <path d="M27 27h14l-4 21H23l4-21Z" fill="currentColor" opacity=".85"/>
      <path d="M25 32h14M24 38h14M23 44h14M29 28l-4 20M35 28l-4 20" stroke="#111318" stroke-width="2" opacity=".8"/>
      <path d="M24 48 15 58" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <circle cx="51" cy="16" r="2.2" fill="currentColor"/><circle cx="56" cy="22" r="2.2" fill="currentColor" opacity=".75"/>
      <path d="m52 4 1.4 3.2L57 8.5l-3.6 1.3L52 13l-1.4-3.2L47 8.5l3.6-1.3L52 4Z" fill="currentColor"/>
    </svg>`,
  mime: `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M17 18c5-10 24-12 34-1-9 0-17 2-25 7l-9-6Z" fill="currentColor"/>
      <path d="M24 18c-3 3-5 8-5 13 0 10 7 18 16 18s16-8 16-18c0-5-2-9-5-12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <path d="M26 32c2 2 4 2 6 0M39 32c2 2 4 2 6 0M31 41c3 2 7 2 10 0" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M22 42C16 37 12 31 13 23" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <path d="M13 23 8 18M13 23l1-8M13 23l7-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M43 44c5 4 10 7 16 6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <path d="M59 50l-1-7M59 50l-6 4M59 50l-7-1" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  words: `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M9 10h46v33H31L18 54V43H9V10Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="22" cy="27" r="3" fill="currentColor"/><circle cx="32" cy="27" r="3" fill="currentColor"/><circle cx="42" cy="27" r="3" fill="currentColor"/>
      <circle cx="49" cy="48" r="10" fill="#111318" stroke="currentColor" stroke-width="3"/>
      <path d="m43 54 12-12" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
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

export const DIFFICULTY_LABELS = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile"
};
