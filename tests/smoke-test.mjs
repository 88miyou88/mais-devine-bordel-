import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relativePath => readFile(path.join(root, relativePath), "utf8");
const exists = async relativePath => {
  try {
    await stat(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
};

const expectedFiles = [
  "index.html", "manifest.webmanifest", "sw.js", "README.md",
  "docs/ARCHITECTURE.md", "docs/TESTS.md",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png",
  "assets/styles/foundation.css", "assets/styles/components.css",
  "assets/styles/screens/home.css", "assets/styles/screens/game.css",
  "assets/styles/screens/drawing.css", "assets/styles/screens/manager.css",
  "assets/styles/screens/results.css",
  "data/lyrics.json", "data/mimes.json", "data/words.json", "data/drawings.json",
  "src/main.js", "src/config/config.js",
  "src/core/state.js", "src/core/dom.js", "src/core/storage.js", "src/core/utils.js",
  "src/services/libraries.js", "src/services/backup.js", "src/services/diagnostics.js",
  "src/features/home.js",
  "src/features/game/game-controller.js", "src/features/game/timer.js",
  "src/features/game/swipe.js", "src/features/game/results.js",
  "src/features/drawing/drawing-controller.js", "src/features/drawing/mixed-drawing.js",
  "src/features/drawing/canvas.js", "src/features/drawing/hold-actions.js", "src/features/drawing/paper-mode.js",
  "src/features/card-manager/manager-controller.js", "src/features/card-manager/card-editor.js",
  "src/features/card-manager/category-manager.js",
  "tests/validate-data.mjs", "tests/smoke-test.mjs"
];

for (const relativePath of expectedFiles) {
  assert.equal(await exists(relativePath), true, `Fichier manquant : ${relativePath}`);
}

const legacyFiles = [
  "ARCHITECTURE.md", "TESTS.md",
  "css-base.css", "css-manager.css", "css-game.css", "css-dialogs.css", "css-drawing.css", "css-home.css",
  "data.json", "mimes.json", "words.json", "drawings.json",
  "icon-192.png", "icon-512.png",
  "js-config.js", "js-dom.js", "js-state.js", "js-utils.js", "js-storage.js", "js-home.js",
  "js-manager.js", "js-library-sync.js", "js-drawing.js", "js-game.js", "js-diagnostics.js", "js-main.js"
];
for (const relativePath of legacyFiles) {
  assert.equal(await exists(relativePath), false, `Ancien fichier encore présent : ${relativePath}`);
}

const html = await read("index.html");
assert.match(html, /<script\s+type="module"\s+src="\.\/src\/main\.js"><\/script>/);
assert.doesNotMatch(html, /js-(?:config|dom|state|utils|storage|home|manager|library-sync|drawing|game|diagnostics|main)\.js/);
assert.doesNotMatch(html, /css-(?:base|manager|game|dialogs|drawing|home)\.css/);

const htmlIds = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
const duplicateIds = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
assert.deepEqual([...new Set(duplicateIds)], [], `Identifiants HTML dupliqués : ${[...new Set(duplicateIds)].join(", ")}`);
const domSource = await read("src/core/dom.js");
const requiredDomIds = [...domSource.matchAll(/document\.querySelector\(["']#([^"']+)["']\)/g)].map(match => match[1]);
for (const id of requiredDomIds) {
  assert.ok(htmlIds.includes(id), `Référence DOM sans élément HTML : #${id}`);
}

const manifest = JSON.parse(await read("manifest.webmanifest"));
assert.equal(manifest.name, "Mais devine, bordel !");
assert.equal(manifest.short_name, "MDB!");
assert.ok(manifest.icons.every(icon => icon.src.replace(/^\.\//, "").startsWith("assets/icons/")), "Chemins des icônes du manifeste incorrects");

const config = await read("src/config/config.js");
assert.match(config, /APP_VERSION\s*=\s*"0\.6\.0"/);
assert.match(config, /APP_CACHE_NAME\s*=\s*"mdb-v0-6-0"/);
assert.match(config, /mdb-global-settings-v2/);
assert.match(config, /mdb-settings-v1/);
for (const key of [
  "mdb-lyrics-boxes-v1", "mdb-lyrics-cards-v1", "mdb-library-meta-v1", "mdb-lyrics-selection-v2",
  "mdb-mime-boxes-v1", "mdb-mime-cards-v1", "mdb-mime-library-meta-v1", "mdb-mime-selection-v1",
  "mdb-words-boxes-v1", "mdb-words-cards-v1", "mdb-words-library-meta-v1", "mdb-words-selection-v1",
  "mdb-draw-boxes-v1", "mdb-draw-cards-v1", "mdb-draw-library-meta-v1", "mdb-draw-selection-v1"
]) assert.ok(config.includes(key), `Clé de stockage absente : ${key}`);

const sw = await read("sw.js");
assert.match(sw, /CACHE_NAME\s*=\s*"mdb-v0-6-0"/);
const cachedPaths = new Set([...sw.matchAll(/"(\.\/[^"\n]+)"/g)].map(match => match[1]));
for (const relativePath of expectedFiles.filter(file => !file.startsWith("docs/") && !file.startsWith("tests/") && file !== "README.md" && file !== "sw.js")) {
  assert.ok(cachedPaths.has(`./${relativePath}`), `Fichier applicatif absent du cache : ${relativePath}`);
}

const expectedStylePaths = [
  "./assets/styles/foundation.css",
  "./assets/styles/components.css",
  "./assets/styles/screens/home.css",
  "./assets/styles/screens/manager.css",
  "./assets/styles/screens/game.css",
  "./assets/styles/screens/results.css",
  "./assets/styles/screens/drawing.css"
];
const linkedStylePaths = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(linkedStylePaths, expectedStylePaths, "Ordre ou chemins des feuilles de style incorrects");

const styleFiles = expectedFiles.filter(file => file.endsWith(".css"));
for (const relativePath of styleFiles) {
  const css = (await read(relativePath)).replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  for (const character of css) {
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    assert.ok(depth >= 0, `${relativePath}: accolade fermante inattendue`);
  }
  assert.equal(depth, 0, `${relativePath}: accolades non équilibrées`);
}

const sourceFiles = expectedFiles.filter(file => file.startsWith("src/") && file.endsWith(".js"));
const importGraph = new Map(sourceFiles.map(file => [file, []]));
for (const relativePath of sourceFiles) {
  execFileSync(process.execPath, ["--check", path.join(root, relativePath)], { stdio: "pipe" });
  const source = await read(relativePath);
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map(match => match[1]);
  for (const importedPath of imports) {
    if (!importedPath.startsWith(".")) continue;
    const resolved = path.resolve(path.dirname(path.join(root, relativePath)), importedPath);
    const resolvedRelative = path.relative(root, resolved).replaceAll(path.sep, "/");
    assert.equal(await exists(resolvedRelative), true, `${relativePath}: import introuvable ${importedPath}`);
    if (importGraph.has(resolvedRelative)) importGraph.get(relativePath).push(resolvedRelative);
  }

  if (relativePath.startsWith("src/core/") || relativePath.startsWith("src/config/")) {
    assert.doesNotMatch(source, /features\//, `${relativePath}: dépendance interdite vers features/`);
    assert.doesNotMatch(source, /services\//, `${relativePath}: dépendance interdite vers services/`);
  }
  if (relativePath.startsWith("src/services/")) {
    assert.doesNotMatch(source, /features\//, `${relativePath}: dépendance interdite vers features/`);
  }
}

const visiting = new Set();
const visited = new Set();
function assertNoImportCycle(file, trail = []) {
  if (visiting.has(file)) {
    const cycleStart = trail.indexOf(file);
    const cycle = [...trail.slice(cycleStart), file].join(" → ");
    assert.fail(`Import circulaire détecté : ${cycle}`);
  }
  if (visited.has(file)) return;
  visiting.add(file);
  for (const dependency of importGraph.get(file) || []) {
    assertNoImportCycle(dependency, [...trail, file]);
  }
  visiting.delete(file);
  visited.add(file);
}
sourceFiles.forEach(file => assertNoImportCycle(file));

execFileSync(process.execPath, ["--check", path.join(root, "sw.js")], { stdio: "pipe" });

console.log("✓ Arborescence complète, DOM et CSS cohérents");
console.log("✓ Aucun ancien fichier plat");
console.log("✓ Modules ES, imports résolus et absence de cycle");
console.log("✓ Clés de stockage V0.5.0 préservées");
const requiredMixedDomIds = [
  "drawTransitionScreen", "drawTransitionButton", "drawMixedCountInput",
  "drawPenaltyPreview", "drawArrivalSoundEnabledInput", "drawPauseButton",
  "drawEndButton", "drawPauseOverlay", "resultBreakdown"
];
for (const id of requiredMixedDomIds) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `Élément mixte absent : ${id}`);
}

const homeSource = await read("src/features/home.js");
assert.doesNotMatch(homeSource, /selectedModeIds\s*=\s*\["draw"\]/, "Le mode Dessin ne doit plus exclure les autres modes");
const mainSource = await read("src/main.js");
assert.doesNotMatch(mainSource, /se joue seul/, "Ancien blocage du Dessin mélangé encore présent");

const mixedRulesUrl = pathToFileURL(path.join(root, "src/features/drawing/mixed-drawing.js")).href;
const mixedRules = await import(mixedRulesUrl);
assert.equal(mixedRules.getMixedDrawingPenaltySeconds(60, 1), 7);
assert.equal(mixedRules.getMixedDrawingPenaltySeconds(60, 5), 2);
assert.equal(mixedRules.getMixedDrawingPenaltySeconds(30, 2), 3);
assert.equal(mixedRules.getMixedDrawingPenaltySeconds(90, 3), 6);
assert.equal(mixedRules.getFeasibleMixedDrawingCount(10000, 5), 0);
assert.equal(mixedRules.getFeasibleMixedDrawingCount(15000, 5), 1);
assert.equal(mixedRules.getFeasibleMixedDrawingCount(20000, 5), 3);
assert.equal(mixedRules.getFeasibleMixedDrawingCount(30000, 5), 5);
const plan = mixedRules.createMixedDrawingPlan(60000, 4);
assert.equal(plan.targetElapsedMs.length, 4);
assert.ok(plan.targetElapsedMs.every((value, index, values) => index === 0 || value > values[index - 1]));
assert.ok(plan.targetElapsedMs[0] > 0 && plan.targetElapsedMs.at(-1) < 60000);
assert.equal(mixedRules.isMixedDrawingDue(plan, plan.targetElapsedMs[0], 30000), true);
mixedRules.markMixedDrawingStarted(plan);
assert.equal(plan.active, true);
mixedRules.markMixedDrawingCompleted(plan);
assert.equal(plan.active, false);
assert.equal(plan.completedCount, 1);
const closingPlan = mixedRules.createMixedDrawingPlan(60000, 5);
assert.equal(mixedRules.closeUnplayableMixedDrawings(closingPlan, closingPlan.minimumRemainingMs), 5);
assert.equal(closingPlan.skippedForTime, 5);

const originalLocalStorage = globalThis.localStorage;
const originalFetch = globalThis.fetch;
const memoryStorage = new Map();
globalThis.localStorage = {
  getItem: key => memoryStorage.get(key) ?? null,
  setItem: (key, value) => memoryStorage.set(key, String(value)),
  removeItem: key => memoryStorage.delete(key),
  clear: () => memoryStorage.clear()
};
globalThis.fetch = async url => {
  const relativePath = String(url).split("?")[0].replace(/^\.\//, "");
  try {
    const data = JSON.parse(await read(relativePath));
    return { ok: true, status: 200, json: async () => data };
  } catch {
    return { ok: false, status: 404, json: async () => ({}) };
  }
};

const configModule = await import(pathToFileURL(path.join(root, "src/config/config.js")).href);
for (const [modeId, modeConfig] of Object.entries(configModule.MODE_CONFIG)) {
  const official = JSON.parse(await read(modeConfig.libraryUrl.replace(/^\.\//, "")));
  const boxes = official.boxes.map(box => ({ ...box, origin: "official", locallyModified: false }));
  const cards = official.cards.map(card => ({ ...card, origin: "official", locallyModified: false }));
  if (modeId === "lyrics") {
    boxes.push({ id: "personal-box", name: "Boîte personnelle", origin: "personal", locallyModified: true });
    cards.push({
      id: "personal-card", boxId: "personal-box", active: true, difficulty: "easy",
      prompt: "Carte personnelle", answer: "Suite", title: "Titre", source: "Source",
      origin: "personal", locallyModified: true
    });
    cards[0].prompt = "Modification locale conservée";
    cards[0].locallyModified = true;
  }
  memoryStorage.set(modeConfig.storage.boxes, JSON.stringify(boxes));
  memoryStorage.set(modeConfig.storage.cards, JSON.stringify(cards));
  memoryStorage.set(modeConfig.storage.meta, JSON.stringify({
    installedVersion: official.libraryVersion, deletedOfficialCardIds: [], deletedOfficialBoxIds: []
  }));
  memoryStorage.set(modeConfig.storage.selection, JSON.stringify({
    boxIds: boxes.map(box => box.id), difficultyIds: ["easy", "medium", "hard"]
  }));
}
memoryStorage.set(configModule.GLOBAL_SETTINGS_KEY, JSON.stringify({
  selectedModeIds: ["lyrics", "draw"],
  vibrationEnabled: false,
  modeOptions: {
    words: { showForbiddenWords: false },
    draw: { attemptCount: 5, durations: { easy: 35, medium: 50, hard: 70 }, soundEnabled: false }
  }
}));

const librariesModule = await import(pathToFileURL(path.join(root, "src/services/libraries.js")).href);
const stateModule = await import(pathToFileURL(path.join(root, "src/core/state.js")).href);
await librariesModule.loadContent();
assert.ok(stateModule.state.modes.lyrics.cards.some(card => card.id === "personal-card"), "Carte personnelle V0.5.x perdue");
assert.ok(stateModule.state.modes.lyrics.boxes.some(box => box.id === "personal-box"), "Catégorie personnelle V0.5.x perdue");
assert.equal(stateModule.state.modes.lyrics.cards[0].prompt, "Modification locale conservée");
assert.equal(stateModule.state.settings.modeOptions.draw.attemptCount, 5);
assert.equal(stateModule.state.settings.modeOptions.draw.soundEnabled, false);
assert.equal(stateModule.state.settings.modeOptions.draw.mixedCount, 2);
assert.equal(stateModule.state.settings.modeOptions.draw.arrivalSoundEnabled, true);

stateModule.state.settings.modeOptions.draw.mixedCount = 4;
stateModule.state.settings.modeOptions.draw.arrivalSoundEnabled = false;
const lyricsMode = structuredClone(stateModule.state.modes.lyrics);
const legacyBackup = {
  backupSchemaVersion: 3,
  settings: {
    selectedModeIds: ["lyrics", "draw"],
    vibrationEnabled: true,
    modeOptions: {
      words: { showForbiddenWords: true },
      draw: { attemptCount: 7, durations: { easy: 40, medium: 55, hard: 75 }, soundEnabled: false }
    }
  },
  modes: {
    lyrics: {
      boxes: lyricsMode.boxes, cards: lyricsMode.cards,
      selectedBoxIds: lyricsMode.selectedBoxIds, selectedDifficultyIds: lyricsMode.selectedDifficultyIds,
      libraryMeta: lyricsMode.libraryMeta
    }
  }
};
const backupModule = await import(pathToFileURL(path.join(root, "src/services/backup.js")).href);
backupModule.restoreBackupData(legacyBackup);
assert.equal(stateModule.state.settings.modeOptions.draw.attemptCount, 7);
assert.equal(stateModule.state.settings.modeOptions.draw.mixedCount, 4);
assert.equal(stateModule.state.settings.modeOptions.draw.arrivalSoundEnabled, false);

globalThis.localStorage = originalLocalStorage;
globalThis.fetch = originalFetch;

console.log("✓ Manifeste, cache et version 0.6.0 cohérents");
console.log("✓ Règles du Dessin mélangé et pénalités validées");
console.log("✓ Données locales et sauvegardes V0.5.x compatibles");
