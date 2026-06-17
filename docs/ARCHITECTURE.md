# Architecture — V0.8.0

## Principes

La V0.8.0 conserve l’architecture modulaire de la V0.7.2 :

```text
config / core
      ↑
   services
      ↑
   features
      ↑
    main.js
```

- `config/` et `core/` ne dépendent pas des fonctionnalités ;
- `services/` peut utiliser `config/` et `core/` ;
- `features/` peut utiliser les couches inférieures ;
- `main.js` orchestre uniquement l’initialisation ;
- aucun import circulaire n’est autorisé.

## Difficultés globales

### Source de vérité

`state.settings.globalDifficultyIds` contient le filtre global de l’accueil.

Les sélections réellement utilisées par chaque mode restent dans :

```text
state.modes[modeId].selectedDifficultyIds
```

Ce choix permet de conserver les exceptions par mode sans ajouter une seconde structure de règles complexe.

### Application globale

`home.js` :

1. lit les trois cases globales ;
2. refuse une sélection vide ;
3. copie la sélection vers tous les modes ;
4. sauvegarde les modes et les réglages globaux ;
5. recalcule immédiatement les compteurs.

### Exception locale

Lorsqu’une difficulté est modifiée depuis la fenêtre d’un mode, seule la sélection de ce mode change.

Une exception est détectée par comparaison normalisée entre :

```text
mode.selectedDifficultyIds
state.settings.globalDifficultyIds
```

L’accueil affiche uniquement les difficultés sélectionnées dans l’exception, avec les couleurs :

- `F` vert ;
- `M` bleu ;
- `D` rouge.

### Migration

Si une ancienne installation ne possède pas `globalDifficultyIds` :

- si tous les modes ont la même sélection, celle-ci devient le filtre global ;
- sinon, le filtre global devient `Facile + Moyen + Difficile` et les différences existantes restent visibles comme exceptions.

## Comptage des cartes

`libraries.js` sépare trois notions :

- `activeCardCountForMode(modeId)` : toutes les cartes actives du mode ;
- `filteredCardsForMode(modeId)` : cartes actives correspondant aux catégories et difficultés du mode, même si la tuile est décochée ;
- `selectedCardsForMode(modeId)` : mêmes cartes, mais uniquement si le mode est coché pour la partie.

`selectedCardTotals()` calcule le compteur général sur les modes cochés.

Cette séparation évite qu’une tuile désactivée affiche artificiellement `0 / total` alors que sa configuration contient bien des cartes.

## Planificateur multijoueur

Le module `src/features/multiplayer/schedule.js` reste indépendant du DOM et du nombre actuel de modes.

Il produit deux formes de planning normalisées.

### `continuous`

Une manche par joueur et par cycle :

```text
turn.modeOrder = [modeA, modeB, modeC]
```

Le moteur classique alterne ces modes pendant toute la durée.

### `mode-blocks`

Une manche par joueur, par mode et par cycle :

```text
turn.modeOrder = [modeA]
turn.playerModeOrder = [modeA, modeC, modeB]
turn.modePosition = 0
```

Le contrôleur lance le moteur existant avec un seul mode. Aucun moteur de jeu n’est dupliqué.

### Ordre commun

Un ordre aléatoire unique est généré puis réutilisé pour chaque joueur.

En `mode-blocks`, le planning est groupé par position : tous les joueurs jouent le premier mode, puis tous le deuxième, etc.

### Rotation équilibrée

Le planificateur construit des classes de rotations :

- une classe de `N` rotations place chaque mode exactement une fois à chaque position ;
- plusieurs bases canoniques fournissent des ordres supplémentaires réellement distincts ;
- les classes sont consommées progressivement pour conserver l’équilibre des positions ;
- l’algorithme ne génère pas mécaniquement toutes les permutations quand le nombre de modes devient élevé.

Cela permet d’attribuer des ordres différents autant que possible tout en gardant un coût maîtrisé pour de futurs modes.

## Contrôleur multijoueur

`multiplayer-controller.js` gère :

- le choix du déroulement ;
- le nombre de cycles ;
- l’ordre commun ou équilibré ;
- l’estimation du nombre de manches ;
- l’écran de passage du téléphone ;
- le lancement du moteur classique ou Dessin ;
- le score, la session et le classement.

Pour une manche par mode, l’écran de passage affiche le parcours complet du joueur et met en évidence le mode actuel, sans flèche ni libellé encombrant.

## Dessin

Une manche dédiée au Dessin réutilise le moteur autonome existant. Une manche continue contenant Dessin réutilise le moteur mixte de la V0.6.0.

Le chrono général, les pénalités, le canevas et le maintien tactile ne sont pas recopiés dans le multijoueur.

## Stockage et sauvegardes

Clés historiques conservées :

- `mdb-global-settings-v2` ;
- clés des quatre bibliothèques ;
- clés de sélection existantes.

Session multijoueur :

```text
mdb-multiplayer-session-v2
schéma interne : 3
```

Le numéro de clé reste inchangé pour ne pas multiplier les entrées. Le schéma interne invalide proprement les anciennes sessions incompatibles.

Sauvegarde permanente :

```text
backupSchemaVersion: 5
```

Elle inclut le filtre global et le type de déroulement, mais jamais la session temporaire active.

## PWA

Version : `0.8.0`

Cache : `mdb-v0-8-0`

Jeton des ressources critiques : `080`

`sw.js` reste à la racine afin de contrôler l’ensemble de l’application.
