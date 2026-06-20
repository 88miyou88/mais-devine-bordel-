import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libraries = [
  ["lyrics", "data/lyrics.json", 172],
  ["mime", "data/mimes.json", 644],
  ["words", "data/words.json", 360],
  ["draw", "data/drawings.json", 420],
  ["drinking", "data/drinking.json", 1050]
];

const allIds = new Set();
let totalCards = 0;

for (const [modeId, relativePath, expectedCount] of libraries) {
  const data = JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  assert.equal(data.modeId, modeId, `${relativePath}: modeId incorrect`);
  assert.ok(data.libraryVersion, `${relativePath}: libraryVersion manquante`);
  if (modeId === "lyrics") {
    assert.equal(data.libraryVersion, "2026.06.20-audit-2", `${relativePath}: version Maestro incorrecte`);
    assert.equal(data.updatedAt, "2026-06-20", `${relativePath}: date Maestro incorrecte`);
  }
  if (modeId === "mime") {
    assert.equal(data.libraryVersion, "2026.06.20-audit-1", `${relativePath}: version Mime incorrecte`);
    assert.equal(data.updatedAt, "2026-06-20", `${relativePath}: date Mime incorrecte`);
  }
  if (modeId === "drinking") {
    assert.equal(data.libraryVersion, "2026.06.20-2", `${relativePath}: version Qui boit incorrecte`);
    assert.equal(data.updatedAt, "2026-06-20", `${relativePath}: date Qui boit incorrecte`);
  }
  assert.ok(Array.isArray(data.boxes) && data.boxes.length > 0, `${relativePath}: catégories absentes`);
  assert.ok(Array.isArray(data.cards), `${relativePath}: cartes absentes`);
  assert.equal(data.cards.length, expectedCount, `${relativePath}: nombre de cartes inattendu`);
  if (modeId === "mime") {
    assert.equal(data.schemaVersion, 2, `${relativePath}: schéma Mime incorrect`);
    assert.equal(data.auditPolicy?.newCardsRequireAudit, true, `${relativePath}: politique d’audit absente`);
    assert.deepEqual(data.retiredOfficialCardIds, ["mime-322", "mime-923"], `${relativePath}: retraits techniques inattendus`);
  }

  const boxIds = new Set();
  for (const box of data.boxes) {
    assert.ok(box.id && box.name, `${relativePath}: catégorie incomplète`);
    assert.ok(!boxIds.has(box.id), `${relativePath}: catégorie dupliquée ${box.id}`);
    boxIds.add(box.id);
  }

  const cardIds = new Set();
  const texts = new Set();
  for (const card of data.cards) {
    assert.ok(card.id, `${relativePath}: carte sans identifiant`);
    assert.ok(!cardIds.has(card.id), `${relativePath}: carte dupliquée ${card.id}`);
    assert.ok(!allIds.has(card.id), `Identifiant dupliqué entre bibliothèques : ${card.id}`);
    assert.ok(boxIds.has(card.boxId), `${relativePath}: catégorie inconnue ${card.boxId}`);
    assert.ok(["easy", "medium", "hard"].includes(card.difficulty), `${relativePath}: difficulté invalide pour ${card.id}`);
    assert.ok(String(card.prompt || "").trim(), `${relativePath}: consigne vide pour ${card.id}`);
    if (modeId === "mime") {
      assert.ok(["approved", "review"].includes(card.auditStatus), `${relativePath}: statut d’audit invalide pour ${card.id}`);
      assert.match(String(card.auditFingerprint || ""), /^[a-f0-9]{16}$/, `${relativePath}: empreinte d’audit invalide pour ${card.id}`);
    }
    if (modeId === "lyrics") {
      assert.ok(String(card.answer || "").trim(), `${relativePath}: réponse vide pour ${card.id}`);
      assert.ok(String(card.title || "").trim(), `${relativePath}: titre vide pour ${card.id}`);
      assert.equal(typeof (card.context ?? ""), "string", `${relativePath}: contexte invalide pour ${card.id}`);
    }
    if (modeId === "words") {
      assert.equal(card.forbiddenWords?.length, 5, `${relativePath}: ${card.id} doit avoir cinq mots interdits`);
    }
    if (["mime", "drinking"].includes(modeId)) {
      const normalizedText = card.prompt.toLocaleLowerCase("fr").replace(/\s+/g, " ").trim();
      assert.ok(!texts.has(normalizedText), `${relativePath}: texte dupliqué pour ${card.id}`);
      texts.add(normalizedText);
    }
    if (modeId === "drinking") {
      assert.ok(card.mechanic, `${relativePath}: mécanique absente pour ${card.id}`);
      assert.ok(card.targetType, `${relativePath}: cible absente pour ${card.id}`);
      assert.ok([
        "vote", "personal_condition", "answer_or_penalty", "collective_condition",
        "challenge_or_penalty", "duel", "tribunal", "temporary_rule"
      ].includes(card.resolution?.kind), `${relativePath}: résolution invalide pour ${card.id}`);
      assert.ok(["light", "medium", "strong"].includes(card.penalty?.intensity), `${relativePath}: intensité invalide pour ${card.id}`);
      assert.ok(Array.isArray(card.resolution?.supports) && card.resolution.supports.includes("points"), `${relativePath}: alternatives incomplètes pour ${card.id}`);
      assert.ok(Number(card.minPlayers) >= 2, `${relativePath}: nombre minimum invalide pour ${card.id}`);
      assert.doesNotMatch(card.prompt, /\bde (?:avoir|arriver|oublier|envoyer|embrasser|être|aller|inventer|applaudir)\b/i, `${relativePath}: élision à corriger pour ${card.id}`);
    }
    cardIds.add(card.id);
    allIds.add(card.id);
  }

  if (modeId === "drinking") {
    const personalConditions = data.cards.filter(card => card.resolution?.kind === "personal_condition");
    assert.equal(personalConditions.length, 73, `${relativePath}: nombre inattendu de conditions personnelles`);
    assert.ok(personalConditions.every(card => /^\[prénom d'un joueur\], as-tu déjà /i.test(card.prompt)), `${relativePath}: condition personnelle mal typée`);
  }

  if (modeId === "mime") {
    assert.equal(data.boxes.length, 21, `${relativePath}: nombre de catégories inattendu`);
    assert.equal(data.cards[0]?.id, "mime-001", `${relativePath}: premier identifiant inattendu`);
    assert.equal(data.cards.some(card => card.id === "mime-1000"), true, `${relativePath}: mime-1000 doit être conservé`);
    assert.equal(data.cards.filter(card => card.auditStatus === "approved").length, 636, `${relativePath}: nombre de mimes validés inattendu`);
    assert.equal(data.cards.filter(card => card.auditStatus === "review").length, 8, `${relativePath}: nombre de mimes à revoir inattendu`);
  }

  totalCards += data.cards.length;
  console.log(`✓ ${modeId}: ${data.cards.length} cartes, ${data.boxes.length} catégories`);
}

assert.equal(totalCards, 2646, "Total de cartes inattendu");
console.log(`✓ Total: ${totalCards} cartes`);
