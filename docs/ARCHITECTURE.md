# Architecture — base V0.9.6

## Direction des dépendances

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
- `main.js` orchestre l’initialisation ;
- aucun import circulaire n’est autorisé.

## Dossier `drinking-game`

```text
src/features/drinking-game/
├── drinking-controller.js
├── card-engine.js
├── targeting.js
├── interaction.js
├── swipe.js
├── penalties.js
├── rules.js
└── session.js
```

### `drinking-controller.js`

Orchestre les écrans, la préparation, la progression, l’historique, les chronomètres et les résultats. Il délègue le comportement propre à chaque type de carte à `interaction.js` et les gestes à `swipe.js`.

### `card-engine.js`

- construit le paquet filtré ;
- exclut les cartes incompatibles avec le nombre de joueurs ;
- recycle le paquet après épuisement ;
- remplace les placeholders de prénom.

### `targeting.js`

- équilibre les ciblages automatiques ;
- évite les répétitions consécutives autant que possible ;
- prépare deux joueurs distincts pour les duels.

### `interaction.js`

Décrit, sans dépendre du DOM :

- le mode de sélection des joueurs ;
- l’action du swipe gauche et droit ;
- les libellés contextuels du swipe ;
- la personne qui reçoit automatiquement une pénalité ;
- la formulation visible des conséquences.

Les résolutions reconnues sont :

```text
vote
personal_condition
answer_or_penalty
collective_condition
challenge_or_penalty
duel
tribunal
temporary_rule
```

### `swipe.js`

Gère uniquement :

- les événements `pointer` ;
- le seuil de geste ;
- l’animation et les couleurs ;
- les libellés contextuels gauche/droite.

La décision métier reste dans le contrôleur.

### `penalties.js`

- calcule les plages selon l’intensité et le plafond ;
- produit la conséquence visible adaptée au profil ;
- met à jour silencieusement les pénalités de classement ;
- distingue les gorgées, jetons, mini-défis et jokers.

### `rules.js`

- ajoute une règle temporaire ;
- conserve son montant de pénalité ;
- limite à trois règles actives ;
- décrémente leur durée ;
- supprime les règles expirées.

### `session.js`

Utilise :

```text
clé : mdb-drinking-session-v1
schéma : 2
```

Le changement de schéma empêche de restaurer un état V0.9.0 incompatible avec les nouvelles interactions.

## Migration des bibliothèques V0.9.5.1

`data/mimes.json` et `data/drinking.json` utilisent la version `2026.06.19-1`.

La migration automatique couvre :

- Mime depuis `2026.06.15-1` vers la bibliothèque de 1 000 cartes et 21 catégories ;
- Qui boit depuis `2026.06.17-1` ou `2026.06.17-2` vers les 1 050 cartes révisées.

Lors du premier chargement :

- les cartes officielles non modifiées sont actualisées ;
- les nouvelles cartes et catégories sont ajoutées et sélectionnées ;
- les cartes personnelles sont conservées ;
- les cartes officielles modifiées localement ne sont jamais écrasées ;
- les identifiants présents dans `deletedOfficialCardIds` ne sont jamais restaurés.

## DOM

La carte Qui boit contient désormais toute l’interaction utile :

- deux indicateurs de swipe contextuels ;
- le texte complet, conséquence comprise ;
- les joueurs sélectionnables disposés dans une grille interne ;
- le rappel des règles actives ;
- le bouton « Oubli de règle », uniquement lorsqu’une règle existe ;
- le bouton Retour et le mini-chronomètre éventuel.

Les anciens boutons de résolution et le bouton Passer ont été supprimés. La logique métier reste décrite dans `interaction.js`, tandis que le contrôleur applique l’effet correspondant au swipe.


## Couche responsive V0.9.4

La densité mobile n’est pas activée selon un modèle de téléphone, mais selon la contrainte réelle :

```css
@media (orientation: landscape) and (max-height: 540px) and (min-width: 600px)
```

Les règles restent dans les feuilles correspondant à leur responsabilité :

- `components.css` : dialogues, contrôles et cible tactile de sélection ;
- `home.css` : accueil, tuiles et barre d’actions ;
- `game.css` : HUD et commandes superposés des modes classiques ;
- `drawing.css` : réglages du Dessin ;
- `drinking-game.css` : préparation, jeu et résultats Qui boit ;
- `multiplayer.css` : préparation multijoueur ;
- `manager.css` : gestionnaire de cartes.

La vue compacte ne change aucun état métier. Le défilement global est évité ; lorsqu’un contenu ne peut réellement pas tenir, seule sa zone centrale défile.

## PWA

```text
Version : 0.9.6
Cache : mdb-v0-9-6
Jeton des ressources : 095
```

Le service worker continue de mettre en cache l’ensemble des modules, styles, icônes et bibliothèques nécessaires au fonctionnement hors ligne.


## Ergonomie tactile V0.9.4

- `home.js` génère une zone de sélection de mode distincte de 44 × 44 px, contenant la case accessible ; la grande zone restante ouvre uniquement la configuration.
- `game.css` superpose le HUD et les quatre commandes à la carte classique uniquement sous le profil paysage compact. `main.js` relie explicitement le bouton Retourner à la logique de retournement déjà utilisée sur l’accueil.
- l’écran de jeu Qui boit conserve un seul cadre : la carte. Sa progression et ses métadonnées sont intégrées dans `drinking-card-hud`.
- les règles utilisent une grille multi-ligne sans troncature ni défilement horizontal.
- `drinking-game/swipe.js` distingue le tap court sur `[data-swipe-tap]` du glissement horizontal ; les vrais boutons d’action restent exclus du swipe.


## Historique des cartes classiques

Chaque résultat classique mémorise aussi la carte qui avait déjà été préparée ensuite. Lors d’un retour :

- le score du dernier résultat est annulé ;
- la carte précédente redevient la carte courante ;
- la carte déplacée par le retour est réinsérée en tête de sa file ;
- en multijoueur, le curseur de rotation et `usedCardIdsByMode` sont restaurés ;
- plusieurs retours successifs reconstruisent donc toute la séquence dans l’ordre exact.

Ces métadonnées internes (`_nextCard` et `_sequenceCursorBeforeNext`) ne sont pas exposées dans les résultats de manche.

## Suppression et signalement des cartes

`src/services/card-removals.js` centralise la suppression pendant une partie. Les contrôleurs de jeu ne manipulent pas directement le stockage des bibliothèques.

Le service :

- conserve une copie nettoyée de la carte et de sa version officielle ;
- retire la carte du mode local et alimente `deletedOfficialCardIds` pour une carte officielle ;
- déduplique les signalements par couple `modeId + cardId` ;
- exporte un rapport de schéma `mdb-deleted-cards-report` version 1 ;
- exclut les prénoms, les cibles calculées et le texte rendu avec les joueurs ;
- déclenche l’événement `mdb:card-removals-changed` afin que l’accueil actualise son compteur.

La clé locale est `mdb-card-removal-reports-v1`. Le motif par défaut `quality_rejection` est volontairement structuré afin de permettre plus tard d’autres motifs sans casser les anciens rapports.

La sauvegarde générale utilise désormais le schéma 7 et inclut ce journal. Les sauvegardes de schémas 2 à 6 restent compatibles.

## Correctif V0.9.5.1

La V0.9.5.1 ajoute une réparation ciblée pour un état local incomplet observé après la V0.9.5 :

- la bibliothèque Mime pouvait être marquée `2026.06.19-1` tout en ne contenant encore que les 395 anciennes cartes ;
- les 605 nouvelles cartes et les nouvelles catégories pouvaient alors être enregistrées à tort comme supprimées ;
- `legacyMimeRepairPlan()` reconnaît cette signature, conserve les suppressions réelles parmi les 395 anciennes cartes et réinstalle uniquement les nouveautés manquantes ;
- les catégories ajoutées par cette réparation sont automatiquement sélectionnées.

Les boutons de suppression des modes classiques et de Qui boit utilisent désormais un libellé visible `Suppr.` en plus de l’icône, tout en conservant un nom accessible complet.


## Mode Audit — V0.9.6

Le mode Audit est séparé du moteur de partie :

- `src/features/audit/audit-controller.js` gère les écrans, filtres, raccourcis et décisions ;
- `src/services/card-audit.js` gère la persistance, les sessions, les rapports et les exports ;
- `assets/styles/screens/audit.css` contient son interface responsive ;
- `docs/CARD-AUDIT.md` décrit le fonctionnement utilisateur.

La direction des dépendances reste respectée : la feature importe les services, tandis que les services ne dépendent d’aucune feature.

Le stockage `mdb-card-audit-v1` conserve les entrées et la session courante. L’identifiant `mdb-card-audit-installation-v1` est aléatoire et local ; il sert uniquement à dédupliquer de futurs rapports.

## Migration Maestro — V0.9.6

`data/lyrics.json` utilise `2026.06.20-final-revise` et contient 198 cartes. La migration automatique part de `2026.06.15-3`, préserve les modifications et suppressions locales, et ajoute les nouvelles cartes.

Le champ facultatif `context` est pris en charge par la normalisation, le comparateur de contenu officiel, le gestionnaire de cartes, l’affichage en partie, l’audit et les sauvegardes.
