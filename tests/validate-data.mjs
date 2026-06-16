import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libraries = [
  ["lyrics", "data/lyrics.json", 143],
  ["mime", "data/mimes.json", 395],
  ["words", "data/words.json", 360],
  ["draw", "data/drawings.json", 420]
];

const allIds = new Set();
let totalCards = 0;

for (const [modeId, relativePath, expectedCount] of libraries) {
  const data = JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  assert.equal(data.modeId, modeId, `${relativePath}: modeId incorrect`);
  assert.ok(data.libraryVersion, `${relativePath}: libraryVersion manquante`);
  assert.ok(Array.isArray(data.boxes) && data.boxes.length > 0, `${relativePath}: catégories absentes`);
  assert.ok(Array.isArray(data.cards), `${relativePath}: cartes absentes`);
  assert.equal(data.cards.length, expectedCount, `${relativePath}: nombre de cartes inattendu`);

  const boxIds = new Set();
  for (const box of data.boxes) {
    assert.ok(box.id && box.name, `${relativePath}: catégorie incomplète`);
    assert.ok(!boxIds.has(box.id), `${relativePath}: catégorie dupliquée ${box.id}`);
    boxIds.add(box.id);
  }

  const cardIds = new Set();
  for (const card of data.cards) {
    assert.ok(card.id, `${relativePath}: carte sans identifiant`);
    assert.ok(!cardIds.has(card.id), `${relativePath}: carte dupliquée ${card.id}`);
    assert.ok(!allIds.has(card.id), `Identifiant dupliqué entre bibliothèques : ${card.id}`);
    assert.ok(boxIds.has(card.boxId), `${relativePath}: catégorie inconnue ${card.boxId}`);
    assert.ok(["easy", "medium", "hard"].includes(card.difficulty), `${relativePath}: difficulté invalide pour ${card.id}`);
    assert.ok(String(card.prompt || "").trim(), `${relativePath}: consigne vide pour ${card.id}`);
    if (modeId === "lyrics") {
      assert.ok(String(card.answer || "").trim(), `${relativePath}: réponse vide pour ${card.id}`);
      assert.ok(String(card.title || "").trim(), `${relativePath}: titre vide pour ${card.id}`);
    }
    if (modeId === "words") {
      assert.equal(card.forbiddenWords?.length, 5, `${relativePath}: ${card.id} doit avoir cinq mots interdits`);
    }
    cardIds.add(card.id);
    allIds.add(card.id);
  }

  totalCards += data.cards.length;
  console.log(`✓ ${modeId}: ${data.cards.length} cartes, ${data.boxes.length} catégories`);
}

assert.equal(totalCards, 1318, "Total de cartes inattendu");
console.log(`✓ Total: ${totalCards} cartes`);
