import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  "assets/styles/screens/results.css", "assets/styles/screens/multiplayer.css", "assets/styles/screens/drinking-game.css",
  "data/lyrics.json", "data/mimes.json", "data/words.json", "data/drawings.json", "data/drinking.json",
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
  "src/features/multiplayer/multiplayer-controller.js", "src/features/multiplayer/schedule.js",
  "src/features/multiplayer/scoreboard.js", "src/features/multiplayer/session.js",
  "src/features/drinking-game/drinking-controller.js", "src/features/drinking-game/card-engine.js",
  "src/features/drinking-game/targeting.js", "src/features/drinking-game/interaction.js",
  "src/features/drinking-game/swipe.js", "src/features/drinking-game/penalties.js",
  "src/features/drinking-game/rules.js", "src/features/drinking-game/session.js",
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
assert.match(html, /<script\s+type="module"\s+data-mdb-bootstrap>/);
assert.match(html, /import\(["']\.\/src\/main\.js\?v=092["']\)/);
assert.match(html, /id="bootRecovery"/);
assert.match(html, /id="bootRepairButton"/);
assert.match(html, /id="orientationGuard"/);
assert.match(html, /id="orientationGuardButton"/);
assert.match(html, /startsWith\(["']mdb-["']\)/);
assert.doesNotMatch(html, /js-(?:config|dom|state|utils|storage|home|manager|library-sync|drawing|game|diagnostics|main)\.js/);
assert.doesNotMatch(html, /css-(?:base|manager|game|dialogs|drawing|home)\.css/);
assert.match(html, />Partie libre</);
assert.match(html, />Multijoueur</);
assert.match(html, /class="custom-duration-chip"/);
assert.match(html, /id="globalDifficultyChoices"/);
assert.match(html, /name="multiplayerFlow"/);
assert.match(html, /value="mode-blocks"/);
assert.doesNotMatch(html, /Récupère le téléphone/);
assert.doesNotMatch(html, /id="drawTransitionButton"/);

const htmlIds = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
const duplicateIds = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
assert.deepEqual([...new Set(duplicateIds)], [], `Identifiants HTML dupliqués : ${[...new Set(duplicateIds)].join(", ")}`);
const domSource = await read("src/core/dom.js");
const requiredDomIds = [...domSource.matchAll(/document\.querySelector\(["']#([^"']+)["']\)/g)].map(match => match[1]);
for (const id of requiredDomIds) {
  assert.ok(htmlIds.includes(id), `Référence DOM sans élément HTML : #${id}`);
}
for (const id of [
  "freePlayButton", "multiplayerPlayButton", "multiplayerSetupScreen", "multiplayerPlayerList",
  "multiplayerHandoffScreen", "multiplayerTurnSummaryScreen", "multiplayerResultsScreen",
  "resumeMultiplayerDialog", "multiplayerTurnModeStats", "multiplayerRanking",
  "globalDifficultyChoices", "multiplayerFlowIntro", "multiplayerCyclesHelp"
]) assert.ok(htmlIds.includes(id), `Élément multijoueur absent : #${id}`);
for (const id of [
  "drinkingSetupScreen", "drinkingGameScreen", "drinkingResultsScreen", "drinkingPlayerList",
  "drinkingMaxPenaltyInput", "drinkingAdultModeInput", "drinkingTargetChoices", "drinkingRanking",
  "drinkingRuleReminder", "drinkingRulePenaltyButton", "drinkingBackButton",
  "drinkingSwipeLeftLabel", "drinkingSwipeRightLabel"
]) assert.ok(htmlIds.includes(id), `Élément Qui boit absent : #${id}`);
for (const removedId of ["drinkingSkipButton", "drinkingLeftActionButton", "drinkingRightActionButton", "drinkingPenaltyText"]) {
  assert.equal(htmlIds.includes(removedId), false, `Commande redondante encore présente : #${removedId}`);
}
const drinkingCardMarkup = html.match(/<article id="drinkingCard"[\s\S]*?<\/article>/)?.[0] || "";
assert.match(drinkingCardMarkup, /id="drinkingTargetPanel"/, "La sélection des joueurs doit être intégrée dans la carte");
assert.match(drinkingCardMarkup, /id="drinkingRulePenaltyButton"/, "Le bouton Oubli de règle doit être intégré dans la carte");
assert.match(drinkingCardMarkup, /id="drinkingBackButton"/, "Le bouton Retour doit rester dans la carte");

const manifest = JSON.parse(await read("manifest.webmanifest"));
assert.equal(manifest.name, "Mais devine, bordel !");
assert.equal(manifest.short_name, "MDB!");
assert.equal(manifest.orientation, "landscape");
assert.ok(manifest.icons.every(icon => icon.src.replace(/^\.\//, "").startsWith("assets/icons/")), "Chemins des icônes du manifeste incorrects");

const config = await read("src/config/config.js");
assert.match(config, /APP_VERSION\s*=\s*"0\.9\.2"/);
assert.match(config, /APP_CACHE_NAME\s*=\s*"mdb-v0-9-2"/);
assert.match(config, /name:\s*"La suite, maestro !"/);
assert.match(config, /name:\s*"Ferme-la et mime !"/);
assert.match(config, /name:\s*"Picasso en PLS"/);
assert.match(config, /name:\s*"Qui boit, bordel \?"/);
assert.match(config, /mdb-drinking-boxes-v1/);
assert.match(config, /DRINKING_SESSION_KEY/);
assert.match(config, /DIFFICULTY_ORDER\s*=\s*\["easy", "medium", "hard"\]/);
assert.match(config, /easy:\s*\{ shortLabel: "F"/);
assert.match(config, /medium:\s*\{ shortLabel: "M"/);
assert.match(config, /hard:\s*\{ shortLabel: "D"/);
assert.match(config, /ellipse cx="32" cy="35"/);
assert.match(config, /m26 41 12 9M38 41l-12 9/);
assert.match(config, /MULTIPLAYER_SESSION_KEY\s*=\s*"mdb-multiplayer-session-v2"/);
assert.match(config, /MULTIPLAYER_SESSION_SCHEMA\s*=\s*3/);
const stateSource = await read("src/core/state.js");
assert.match(stateSource, /\{ id: "player-1", name: "Camille" \}/);
assert.match(stateSource, /\{ id: "drink-player-1", name: "Camille", teamSoft: false \}/);
assert.match(config, /mdb-global-settings-v2/);
assert.match(config, /mdb-settings-v1/);
for (const key of [
  "mdb-lyrics-boxes-v1", "mdb-lyrics-cards-v1", "mdb-library-meta-v1", "mdb-lyrics-selection-v2",
  "mdb-mime-boxes-v1", "mdb-mime-cards-v1", "mdb-mime-library-meta-v1", "mdb-mime-selection-v1",
  "mdb-words-boxes-v1", "mdb-words-cards-v1", "mdb-words-library-meta-v1", "mdb-words-selection-v1",
  "mdb-draw-boxes-v1", "mdb-draw-cards-v1", "mdb-draw-library-meta-v1", "mdb-draw-selection-v1"
]) assert.ok(config.includes(key), `Clé de stockage absente : ${key}`);

const sw = await read("sw.js");
assert.match(sw, /CACHE_NAME\s*=\s*"mdb-v0-9-2"/);
assert.match(sw, /new Request\(url, \{ cache: "reload" \}\)/);
assert.match(sw, /SKIP_WAITING/);
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
  "./assets/styles/screens/drawing.css",
  "./assets/styles/screens/multiplayer.css",
  "./assets/styles/screens/drinking-game.css"
];
const linkedStylePaths = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)]
  .map(match => match[1].split("?")[0]);
assert.deepEqual(linkedStylePaths, expectedStylePaths, "Ordre ou chemins des feuilles de style incorrects");
assert.equal((html.match(/\?v=092/g) || []).length >= expectedStylePaths.length + 1, true, "Les ressources critiques doivent être versionnées");

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
    assert.fail(`Import circulaire détecté : ${[...trail.slice(cycleStart), file].join(" → ")}`);
  }
  if (visited.has(file)) return;
  visiting.add(file);
  for (const dependency of importGraph.get(file) || []) assertNoImportCycle(dependency, [...trail, file]);
  visiting.delete(file);
  visited.add(file);
}
sourceFiles.forEach(file => assertNoImportCycle(file));
execFileSync(process.execPath, ["--check", path.join(root, "sw.js")], { stdio: "pipe" });
const diagnosticsSource = await read("src/services/diagnostics.js");
assert.match(diagnosticsSource, /updateViaCache:\s*"none"/);
assert.match(diagnosticsSource, /sw\.js\?v=/);
assert.match(diagnosticsSource, /controllerchange/);

const timerSource = await read("src/features/game/timer.js");
assert.match(timerSource, /Math\.min\(600, Math\.max\(10,/);

const multiplayerControllerSource = await read("src/features/multiplayer/multiplayer-controller.js");
assert.doesNotMatch(multiplayerControllerSource, /mode-route-arrow/);
assert.doesNotMatch(multiplayerControllerSource, /<strong>\$\{config\.name\}<\/strong>/);
assert.match(multiplayerControllerSource, /aria-label="\$\{config\.name\}"/);
const domOrientationSource = await read("src/core/dom.js");
assert.match(domOrientationSource, /initializeOrientationGuard/);
assert.match(domOrientationSource, /screen\.orientation\?\.lock/);

const scheduleModule = await import(pathToFileURL(path.join(root, "src/features/multiplayer/schedule.js")).href);
function seededRandom(seed = 1) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

for (const modeCount of [1, 2, 3, 4, 5, 8, 12]) {
  const modeIds = Array.from({ length: modeCount }, (_, index) => index === modeCount - 1 && modeCount > 1 ? "draw" : `mode-${index + 1}`);
  for (const playerCount of [2, 3, 5, 12]) {
    const players = Array.from({ length: playerCount }, (_, index) => ({ id: `p${index + 1}`, name: `Joueur ${index + 1}` }));
    for (const flowType of ["continuous", "mode-blocks"]) {
      const common = scheduleModule.buildMultiplayerSchedule({
        players, modeIds, cycles: 3, flowType, orderType: "common",
        random: seededRandom(modeCount * 1000 + playerCount * 100 + (flowType === "mode-blocks" ? 7 : 3))
      });
      const commonValidation = scheduleModule.validateMultiplayerSchedule(common);
      assert.equal(commonValidation.valid, true, commonValidation.errors.join("\n"));
      const expectedTurns = playerCount * 3 * (flowType === "mode-blocks" ? modeCount : 1);
      assert.equal(common.turns.length, expectedTurns);

      if (flowType === "continuous") {
        assert.ok(common.turns.every(turn => turn.modeOrder.join("|") === common.turns[0].modeOrder.join("|")), "L’ordre commun continu doit être identique pour tous");
      } else {
        for (let cycleIndex = 0; cycleIndex < 3; cycleIndex += 1) {
          for (let position = 0; position < modeCount; position += 1) {
            const modesAtPosition = common.turns
              .filter(turn => turn.cycleIndex === cycleIndex && turn.modePosition === position)
              .map(turn => turn.modeOrder[0]);
            assert.equal(new Set(modesAtPosition).size, 1, "Tous les joueurs doivent jouer le même mode à une position donnée en ordre commun");
          }
        }
      }

      const balanced = scheduleModule.buildMultiplayerSchedule({
        players, modeIds, cycles: 3, flowType, orderType: "balanced",
        random: seededRandom(modeCount * 2000 + playerCount * 200 + (flowType === "mode-blocks" ? 11 : 5))
      });
      const validation = scheduleModule.validateMultiplayerSchedule(balanced);
      assert.equal(validation.valid, true, validation.errors.join("\n"));
      assert.equal(balanced.turns.length, expectedTurns);

      const routesForCycle = (cycleIndex) => players.map(player => {
        const turns = balanced.turns.filter(turn => turn.playerId === player.id && turn.cycleIndex === cycleIndex);
        return flowType === "continuous"
          ? turns[0].modeOrder
          : turns.map(turn => turn.modeOrder[0]);
      });

      for (let cycleIndex = 0; cycleIndex < 3; cycleIndex += 1) {
        const routes = routesForCycle(cycleIndex);
        routes.forEach(route => {
          assert.equal(route.length, modeIds.length);
          assert.deepEqual([...route].sort(), [...modeIds].sort());
        });
        if (modeCount > 1 && playerCount > 1) {
          const distinctCount = new Set(routes.map(route => route.join("|"))).size;
          assert.ok(distinctCount > 1, "La rotation équilibrée doit produire plusieurs ordres quand c’est possible");
          if (playerCount <= modeCount) {
            assert.equal(distinctCount, playerCount, "Les ordres doivent être distincts pour tous les joueurs tant que les rotations disponibles suffisent");
          }
        }
      }

      if (modeCount > 1) {
        const countsByModeAndPosition = new Map(modeIds.map(modeId => [modeId, Array(modeCount).fill(0)]));
        for (let cycleIndex = 0; cycleIndex < 3; cycleIndex += 1) {
          routesForCycle(cycleIndex).forEach(route => {
            route.forEach((modeId, position) => countsByModeAndPosition.get(modeId)[position] += 1);
          });
        }
        countsByModeAndPosition.forEach(positionCounts => {
          assert.ok(
            Math.max(...positionCounts) - Math.min(...positionCounts) <= 1,
            `Les positions d’un mode doivent rester équilibrées : ${positionCounts.join("/")}`
          );
        });
      }
    }
  }
}

const scoreboardModule = await import(pathToFileURL(path.join(root, "src/features/multiplayer/scoreboard.js")).href);
const players = [{ id: "p1", name: "Camille" }, { id: "p2", name: "Léa" }];
const scoreboard = scoreboardModule.createScoreboard(players, ["mime", "draw", "lyrics"]);
const sampleTurn = {
  id: "t1", turnIndex: 0, cycleIndex: 0, playerId: "p1", playerName: "Camille",
  modeOrder: ["mime", "draw", "lyrics"]
};
const normalized = scoreboardModule.normalizeTurnResult({
  reason: "time", durationMs: 60000, remainingMs: 0,
  history: [
    { kind: "classic", card: { id: "m1", modeId: "mime" }, result: "valid", points: 1 },
    { kind: "classic", card: { id: "m2", modeId: "mime" }, result: "pass", points: 0 },
    { kind: "draw", card: { id: "d1", modeId: "draw" }, result: "valid", points: 2, usedMs: 9200 },
    { kind: "classic", card: { id: "l1", modeId: "lyrics" }, result: "valid", points: 1 }
  ]
}, sampleTurn, ["mime", "draw", "lyrics"]);
assert.equal(normalized.score, 4);
assert.deepEqual([normalized.perMode.mime.successes, normalized.perMode.mime.attempts], [1, 2]);
assert.deepEqual([normalized.perMode.draw.successes, normalized.perMode.draw.attempts], [1, 1]);
scoreboardModule.addTurnToScoreboard(scoreboard, normalized);
assert.equal(scoreboard.p1.score, 4);
assert.equal(scoreboard.p1.perMode.mime.attempts, 2);
assert.equal(scoreboardModule.rankScoreboard(scoreboard)[0].playerId, "p1");

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
const sessionModule = await import(pathToFileURL(path.join(root, "src/features/multiplayer/session.js")).href);
const sessionSchedule = scheduleModule.buildMultiplayerSchedule({
  players, modeIds: ["mime", "draw", "lyrics"], cycles: 2, flowType: "mode-blocks", orderType: "balanced", random: seededRandom(42)
});
const session = sessionModule.createMultiplayerSession({ schedule: sessionSchedule, durationSeconds: 60 });
session.nextTurnIndex = 1;
sessionModule.saveMultiplayerSession(session);
assert.equal(sessionModule.loadMultiplayerSession().nextTurnIndex, 1);
sessionModule.clearMultiplayerSession();
assert.equal(sessionModule.loadMultiplayerSession(), null);

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
  globalDifficultyIds: ["easy", "hard"],
  modeOptions: {
    words: { showForbiddenWords: false },
    draw: { attemptCount: 5, durations: { easy: 35, medium: 50, hard: 70 }, soundEnabled: false }
  }
}));

const librariesModule = await import(pathToFileURL(path.join(root, "src/services/libraries.js")).href);
const stateModule = await import(pathToFileURL(path.join(root, "src/core/state.js")).href);
await librariesModule.loadContent();
assert.ok(stateModule.state.modes.lyrics.cards.some(card => card.id === "personal-card"), "Carte personnelle V0.6.0 perdue");
assert.ok(stateModule.state.modes.lyrics.boxes.some(box => box.id === "personal-box"), "Catégorie personnelle V0.6.0 perdue");
assert.equal(stateModule.state.modes.lyrics.cards[0].prompt, "Modification locale conservée");
assert.equal(stateModule.state.settings.modeOptions.draw.attemptCount, 5);
assert.equal(stateModule.state.settings.modeOptions.draw.soundEnabled, false);
assert.equal(stateModule.state.settings.modeOptions.draw.mixedCount, 2);
assert.equal(stateModule.state.settings.playType, "free");
assert.equal(stateModule.state.settings.multiplayer.players.length, 2);
assert.equal(stateModule.state.settings.multiplayer.orderType, "balanced");
assert.equal(stateModule.state.settings.multiplayer.flowType, "continuous");
assert.deepEqual(stateModule.state.settings.globalDifficultyIds, ["easy", "hard"]);
assert.equal(librariesModule.activeCardCountForMode("lyrics") >= librariesModule.filteredCardsForMode("lyrics").length, true);
const selectedTotals = librariesModule.selectedCardTotals();
assert.equal(selectedTotals.selected <= selectedTotals.total, true);

const drinkingConfig = configModule.MODE_CONFIG.drinking;
const currentDrinkingLibrary = JSON.parse(await read("data/drinking.json"));
const oldDrinkingCards = currentDrinkingLibrary.cards.map(card => ({
  ...structuredClone(card),
  origin: "official",
  locallyModified: false
}));
const migratedCard = oldDrinkingCards.find(card => card.id === "qbb_0773");
migratedCard.resolution.kind = "answer_or_penalty";
const preservedLocalCard = oldDrinkingCards.find(card => card.id === "qbb_0001");
preservedLocalCard.prompt = "Modification personnelle à conserver";
preservedLocalCard.locallyModified = true;
memoryStorage.set(drinkingConfig.storage.boxes, JSON.stringify(currentDrinkingLibrary.boxes.map(box => ({ ...box, origin: "official", locallyModified: false }))));
memoryStorage.set(drinkingConfig.storage.cards, JSON.stringify(oldDrinkingCards));
memoryStorage.set(drinkingConfig.storage.meta, JSON.stringify({
  installedVersion: "2026.06.17-1", deletedOfficialCardIds: [], deletedOfficialBoxIds: []
}));
memoryStorage.set(drinkingConfig.storage.selection, JSON.stringify({
  boxIds: currentDrinkingLibrary.boxes.map(box => box.id), difficultyIds: ["easy", "medium", "hard"]
}));
await librariesModule.loadContent();
assert.equal(
  stateModule.state.modes.drinking.cards.find(card => card.id === "qbb_0773").resolution.kind,
  "personal_condition",
  "La migration V0.9.0 doit typer les conditions personnelles sans action manuelle"
);
assert.equal(
  stateModule.state.modes.drinking.cards.find(card => card.id === "qbb_0001").prompt,
  "Modification personnelle à conserver",
  "La migration ne doit pas écraser une carte modifiée localement"
);
assert.equal(stateModule.state.modes.drinking.libraryMeta.installedVersion, "2026.06.17-2");

stateModule.state.settings.playType = "multiplayer";
stateModule.state.settings.multiplayer = {
  players: [{ id: "camille", name: "Camille" }, { id: "lea", name: "Léa" }],
  cycles: 3,
  flowType: "mode-blocks",
  orderType: "common"
};
const backupModule = await import(pathToFileURL(path.join(root, "src/services/backup.js")).href);
const newBackup = backupModule.createBackupData();
assert.equal(newBackup.backupSchemaVersion, 6);
assert.equal(newBackup.settings.multiplayer.cycles, 3);
assert.equal(newBackup.settings.multiplayer.flowType, "mode-blocks");
assert.deepEqual(newBackup.settings.globalDifficultyIds, ["easy", "hard"]);
assert.equal(Object.hasOwn(newBackup, "multiplayerSession"), false, "La session temporaire ne doit pas être exportée");

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
      boxes: structuredClone(stateModule.state.modes.lyrics.boxes),
      cards: structuredClone(stateModule.state.modes.lyrics.cards),
      selectedBoxIds: structuredClone(stateModule.state.modes.lyrics.selectedBoxIds),
      selectedDifficultyIds: structuredClone(stateModule.state.modes.lyrics.selectedDifficultyIds),
      libraryMeta: structuredClone(stateModule.state.modes.lyrics.libraryMeta)
    }
  }
};
backupModule.restoreBackupData(legacyBackup);
assert.equal(stateModule.state.settings.modeOptions.draw.attemptCount, 7);
assert.equal(stateModule.state.settings.multiplayer.cycles, 3, "Une ancienne sauvegarde ne doit pas effacer les réglages multijoueur actuels");
assert.equal(stateModule.state.settings.multiplayer.flowType, "mode-blocks", "Une ancienne sauvegarde ne doit pas effacer le type de déroulement actuel");

const drawingSource = await read("src/features/drawing/drawing-controller.js");
assert.match(drawingSource, /playDrawingArrivalSignal\(\);\s*showNextDrawingPrompt\(\);/);
assert.doesNotMatch(drawingSource, /showPickupTransition/);
assert.match(drawingSource, /round\?\.kind !== "mixed"/);
const gameSource = await read("src/features/game/game-controller.js");
assert.match(gameSource, /if \(step\.type === "draw"\)[\s\S]*pauseRoundClock\("drawing"\)[\s\S]*markMixedDrawingStarted/);
const scheduleSource = await read("src/features/multiplayer/schedule.js");
assert.doesNotMatch(scheduleSource, /MODE_ORDER/);
assert.doesNotMatch(scheduleSource, /length\s*===\s*4/);
assert.match(scheduleSource, /FLOW_MODE_BLOCKS/);
assert.match(scheduleSource, /buildRotationClasses/);
const homeSource = await read("src/features/home.js");
assert.match(homeSource, /applyGlobalDifficultyFilter/);
assert.match(homeSource, /mode-difficulty-override/);
assert.match(homeSource, /selectedCardTotals/);
const homeCss = await read("assets/styles/screens/home.css");
assert.match(homeCss, /global-difficulty-chip\.difficulty-easy/);
assert.match(homeCss, /mode-difficulty-badge\.difficulty-hard/);

const mixedRules = await import(pathToFileURL(path.join(root, "src/features/drawing/mixed-drawing.js")).href);
assert.equal(mixedRules.getMixedDrawingPenaltySeconds(60, 1), 7);
assert.equal(mixedRules.getMixedDrawingPenaltySeconds(60, 5), 2);
assert.equal(mixedRules.getFeasibleMixedDrawingCount(10000, 5), 0);
assert.equal(mixedRules.getFeasibleMixedDrawingCount(30000, 5), 5);

const originalStorageRestore = originalLocalStorage;
const originalFetchRestore = originalFetch;
globalThis.localStorage = originalStorageRestore;
globalThis.fetch = originalFetchRestore;


const penaltyModule = await import(pathToFileURL(path.join(root, "src/features/drinking-game/penalties.js")).href);
assert.deepEqual(penaltyModule.penaltyRange("light", 3), [1, 1]);
assert.deepEqual(penaltyModule.penaltyRange("medium", 3), [2, 2]);
assert.deepEqual(penaltyModule.penaltyRange("strong", 3), [3, 3]);
assert.deepEqual(penaltyModule.penaltyRange("light", 10), [1, 4]);
assert.deepEqual(penaltyModule.penaltyRange("medium", 10), [4, 7]);
assert.deepEqual(penaltyModule.penaltyRange("strong", 10), [7, 10]);
const drinkStats = { p1: { penaltyPoints: 0, penaltiesReceived: 0, rulesForgotten: 0, sips: 0, tokens: 0, miniChallenges: 0, jokersLost: 0 } };
penaltyModule.applyPenalty({ id: "p1", teamSoft: false }, drinkStats, 3, "points");
assert.equal(drinkStats.p1.penaltyPoints, 3);
assert.equal(drinkStats.p1.sips, 3);
const softStats = { p2: { penaltyPoints: 0, penaltiesReceived: 0, rulesForgotten: 0, sips: 0, tokens: 0, miniChallenges: 0, jokersLost: 0 } };
penaltyModule.applyPenalty({ id: "p2", teamSoft: true }, softStats, 4, "tokens");
assert.equal(softStats.p2.penaltyPoints, 4);
assert.equal(softStats.p2.tokens, 4);
assert.equal(softStats.p2.sips, 0);
penaltyModule.applyPenalty({ id: "p2", teamSoft: true }, softStats, 4, "mini_challenge");
assert.equal(softStats.p2.miniChallenges, 1);
penaltyModule.applyPenalty({ id: "p2", teamSoft: true }, softStats, 4, "joker");
assert.equal(softStats.p2.jokersLost, 2);

const interactionModule = await import(pathToFileURL(path.join(root, "src/features/drinking-game/interaction.js")).href);
const conditionalCard = {
  resolution: { kind: "personal_condition" },
  targetType: "single_player",
  targetIds: ["p1"],
  renderedPrompt: "Camille, as-tu déjà utilisé la lampe de ton téléphone pour chercher ton téléphone?"
};
const interactionPlayers = [{ id: "p1", name: "Camille", teamSoft: false }, { id: "p2", name: "Léa", teamSoft: true }];
assert.equal(interactionModule.interactionForCard(conditionalCard).rightAction, "penalty");
assert.equal(interactionModule.interactionForCard(conditionalCard).leftAction, "no_penalty");
assert.equal(
  interactionModule.formattedPrompt(conditionalCard, interactionPlayers, [], 1, "points"),
  "Camille, prends 1 gorgée si tu as déjà utilisé la lampe de ton téléphone pour chercher ton téléphone."
);
const answerCard = {
  resolution: { kind: "answer_or_penalty" },
  targetType: "single_player",
  targetIds: ["p2"],
  renderedPrompt: "Léa, quel est ton avis sur les déclarations publiques?"
};
assert.equal(
  interactionModule.formattedPrompt(answerCard, interactionPlayers, [], 2, "points"),
  "Léa, quel est ton avis sur les déclarations publiques? Si tu ne réponds pas, prends 2 pénalités."
);
const collectiveCard = {
  resolution: { kind: "collective_condition" },
  targetType: "multiple_players",
  targetIds: [],
  renderedPrompt: "Jamais je n’ai remis un vêtement sale parce qu’il avait l’air propre."
};
assert.equal(
  interactionModule.formattedPrompt(collectiveCard, interactionPlayers, [], 2, "points"),
  "Jamais je n’ai remis un vêtement sale parce qu’il avait l’air propre. Les personnes concernées prennent 2 gorgées / 2 pénalités."
);
const voteCard = {
  resolution: { kind: "vote" },
  targetType: "group_vote",
  targetIds: [],
  renderedPrompt: "Qui est le plus relou?"
};
assert.equal(
  interactionModule.formattedPrompt(voteCard, interactionPlayers, ["p2"], 2, "points"),
  "Qui est le plus relou? Léa prend 2 pénalités."
);
assert.equal(penaltyModule.describePenalty(interactionPlayers[0], 3, "points"), "3 gorgées");
assert.equal(penaltyModule.describePenalty(interactionPlayers[1], 3, "points"), "3 pénalités");
assert.equal(penaltyModule.describePenalty(interactionPlayers[1], 4, "tokens"), "4 jetons de pénalité");
assert.equal(interactionModule.interactionForCard({ resolution: { kind: "collective_condition" } }).selection, "multiple_all");
assert.equal(interactionModule.interactionForCard({ resolution: { kind: "duel" } }).selection, "single_targets");

const drinkingData = JSON.parse(await read("data/drinking.json"));
const personalConditions = drinkingData.cards.filter(card => card.resolution?.kind === "personal_condition");
assert.equal(personalConditions.length, 73, "Les questions personnelles conditionnelles doivent être typées explicitement");
assert.ok(personalConditions.every(card => /^\[prénom d'un joueur\], as-tu déjà /i.test(card.prompt)));

const drinkingControllerSource = await read("src/features/drinking-game/drinking-controller.js");
assert.match(drinkingControllerSource, /initializeDrinkingSwipe/);
assert.match(drinkingControllerSource, /rulePenaltyMode/);
assert.match(drinkingControllerSource, /challengesSucceeded/);
assert.doesNotMatch(drinkingControllerSource, /adaptation boisson\/Team soft/);
assert.doesNotMatch(drinkingControllerSource, /Pénalité de cette carte/);
assert.doesNotMatch(drinkingControllerSource, /ciblage\$\{stats\.targeted/);
assert.doesNotMatch(drinkingControllerSource, /drinkingSkipButton|drinkingLeftActionButton|drinkingRightActionButton/);
assert.match(drinkingControllerSource, /rulePenaltyTargetBackup/);
assert.match(drinkingControllerSource, /prompt-very-long/);
const drinkingCss = await read("assets/styles/screens/drinking-game.css");
assert.match(drinkingCss, /grid-template-columns:\s*repeat\(auto-fit, minmax\(112px, 1fr\)\)/);
assert.match(drinkingCss, /drinking-card-rule-reminder/);
assert.match(drinkingCss, /prompt-very-long/);
assert.doesNotMatch(drinkingCss, /drinking-resolution-panel/);
const drinkingSwipeSource = await read("src/features/drinking-game/swipe.js");
assert.match(drinkingSwipeSource, /pointerdown/);
assert.match(drinkingSwipeSource, /getSwipeThreshold/);

const targetModule = await import(pathToFileURL(path.join(root, "src/features/drinking-game/targeting.js")).href);
const targetPlayers = [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }];
const targetStats = Object.fromEntries(targetPlayers.map(player => [player.id, { targeted: 0, lastTargetedAt: -10 }]));
for (let index = 0; index < 30; index += 1) {
  targetModule.assignTargets({ targetType: "single_player" }, targetPlayers, targetStats, index, seededRandom(index + 1));
}
const targetCounts = Object.values(targetStats).map(stats => stats.targeted);
assert.ok(Math.max(...targetCounts) - Math.min(...targetCounts) <= 1, `Ciblage déséquilibré : ${targetCounts.join("/")}`);
const duelTargets = targetModule.assignTargets({ targetType: "two_players" }, targetPlayers, targetStats, 31, seededRandom(32));
assert.equal(duelTargets.length, 2);
assert.notEqual(duelTargets[0], duelTargets[1], "Un duel doit désigner deux joueurs différents");

const rulesModule = await import(pathToFileURL(path.join(root, "src/features/drinking-game/rules.js")).href);
let activeRules = [];
activeRules = rulesModule.addRule(activeRules, { id: "rule-1", prompt: "Règle 1", ruleDurationCards: 3 });
activeRules = rulesModule.addRule(activeRules, { id: "rule-2", prompt: "Règle 2", ruleDurationCards: 3 });
activeRules = rulesModule.addRule(activeRules, { id: "rule-3", prompt: "Règle 3", ruleDurationCards: 3 });
activeRules = rulesModule.addRule(activeRules, { id: "rule-4", prompt: "Règle 4", ruleDurationCards: 3 });
assert.equal(activeRules.length, 3, "Trois règles temporaires maximum");
const newestRuleId = activeRules.at(-1).id;
activeRules = rulesModule.tickRules(activeRules, newestRuleId);
assert.equal(activeRules.at(-1).remainingCards, 3, "Une nouvelle règle ne perd pas une carte dès son ajout");
assert.equal(activeRules[0].remainingCards, 2);

console.log("✓ Moteur Qui boit : pénalités variables, points et ciblage équilibré");
console.log("✓ Arborescence, DOM, CSS, manifeste et cache V0.9.2 cohérents");
console.log("✓ Modules ES résolus, dépendances orientées et aucun cycle d’import");
console.log("✓ Deux déroulements multijoueurs testés de 1 à 12 modes et de 2 à 12 joueurs");
console.log("✓ Filtres globaux, exceptions par mode et compteurs sélection/total validés");
console.log("✓ Scores par mode, classement et sauvegarde de session validés");
console.log("✓ Dessin direct, dessin en première position et fin de série validés");
console.log("✓ Données locales et sauvegardes V0.6.0 compatibles");
