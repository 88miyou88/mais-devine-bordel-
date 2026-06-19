export function safeParse(value, fallback, onError = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    onError?.(error);
    return fallback;
  }
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function uniqueId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function cleanIdList(value) {
  return Array.isArray(value) ? [...new Set(value.map(String))] : [];
}

export function normalizeDifficulty(value, modeId, card = {}) {
  if (["easy", "medium", "hard"].includes(value)) return value;
  if (modeId === "lyrics") {
    if (card.boxId === "anglais") return "hard";
    if (["comptines", "disney", "tubes-soiree"].includes(card.boxId)) return "easy";
  }
  return "medium";
}

export function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

export function formatDate(value) {
  if (!value) return "Jamais";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Jamais";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
