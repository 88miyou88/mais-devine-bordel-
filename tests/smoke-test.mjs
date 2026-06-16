import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
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
  "src/features/drawing/drawing-controller.js", "src/features/drawing/canvas.js",
  "src/features/drawing/hold-actions.js", "src/features/drawing/paper-mode.js",
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

const manifest = JSON.parse(await read("manifest.webmanifest"));
assert.equal(manifest.name, "Mais devine, bordel !");
assert.equal(manifest.short_name, "MDB!");
assert.ok(manifest.icons.every(icon => icon.src.replace(/^\.\//, "").startsWith("assets/icons/")), "Chemins des icônes du manifeste incorrects");

const config = await read("src/config/config.js");
assert.match(config, /APP_VERSION\s*=\s*"0\.5\.1"/);
assert.match(config, /mdb-global-settings-v2/);
assert.match(config, /mdb-settings-v1/);
for (const key of [
  "mdb-lyrics-boxes-v1", "mdb-lyrics-cards-v1", "mdb-library-meta-v1", "mdb-lyrics-selection-v2",
  "mdb-mime-boxes-v1", "mdb-mime-cards-v1", "mdb-mime-library-meta-v1", "mdb-mime-selection-v1",
  "mdb-words-boxes-v1", "mdb-words-cards-v1", "mdb-words-library-meta-v1", "mdb-words-selection-v1",
  "mdb-draw-boxes-v1", "mdb-draw-cards-v1", "mdb-draw-library-meta-v1", "mdb-draw-selection-v1"
]) assert.ok(config.includes(key), `Clé de stockage absente : ${key}`);

const sw = await read("sw.js");
assert.match(sw, /CACHE_NAME\s*=\s*"mdb-v0-5-1"/);
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

console.log("✓ Arborescence complète");
console.log("✓ Aucun ancien fichier plat");
console.log("✓ Modules ES, imports résolus et absence de cycle");
console.log("✓ Clés de stockage V0.5.0 préservées");
console.log("✓ Manifeste, cache et version 0.5.1 cohérents");
