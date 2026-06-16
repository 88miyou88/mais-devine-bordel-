# Architecture — V0.7.0

## Objectif

La V0.7.0 ajoute une couche multijoueur au-dessus des moteurs existants, sans dupliquer les modes de jeu.

Une manche multijoueur correspond à une **run complète d’un joueur**. Pendant la durée choisie, le joueur garde le téléphone et le moteur alterne les modes de son parcours. L’orchestrateur reçoit ensuite un résultat normalisé, cumule les scores et passe au joueur suivant.

```text
Orchestrateur multijoueur
        ↓
Moteur de manche classique ou Dessin autonome
        ↓
Résultat normalisé
        ↓
Score, sauvegarde de session, joueur suivant
```

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

Règles :

- `config/` ne dépend d’aucune fonctionnalité ;
- `core/` n’importe jamais `services/` ou `features/` ;
- `services/` peut importer `config/` et `core/` ;
- `features/` peut importer `config/`, `core/` et `services/` ;
- `main.js` initialise l’application sans contenir la logique métier ;
- aucun import circulaire n’est autorisé.

## Organisation principale

```text
mais-devine-bordel/
├── index.html
├── manifest.webmanifest
├── sw.js
├── README.md
├── docs/
├── assets/
│   ├── icons/
│   └── styles/
│       └── screens/
│           └── multiplayer.css
├── data/
├── src/
│   ├── main.js
│   ├── config/
│   ├── core/
│   ├── services/
│   └── features/
│       ├── home.js
│       ├── game/
│       ├── drawing/
│       ├── card-manager/
│       └── multiplayer/
│           ├── multiplayer-controller.js
│           ├── schedule.js
│           ├── scoreboard.js
│           └── session.js
└── tests/
```

## Modules multijoueur

### `schedule.js`

Module métier pur, sans DOM.

Il :

- accepte une liste dynamique de modes ;
- construit une manche par joueur et par cycle ;
- place tous les modes sélectionnés dans chaque parcours ;
- fournit un ordre commun ou une rotation équilibrée ;
- génère exactement `nombre de modes` parcours candidats, correspondant aux rotations d’un ordre de base, au lieu de calculer des permutations factorielles ;
- répartit chaque mode entre les positions avec un écart maximal d’une occurrence ;
- décale le point de départ à chaque cycle afin de répartir les restes et d’éviter qu’un joueur conserve le même parcours deux cycles de suite ;
- valide que chaque joueur possède le même nombre de manches et tous les modes exactement une fois dans son parcours.

Le module ne dépend pas de `MODE_ORDER`. L’ajout futur d’un mode n’exige donc aucune modification de l’algorithme.

### `scoreboard.js`

Il transforme l’historique d’une manche en statistiques communes :

- score ;
- réussites, passages et expirations ;
- détail par mode ;
- temps de dessin ;
- classement avec égalités réelles.

Chaque mode conserve notamment :

```text
réussites / tentatives
```

Ces données alimentent les puces compactes avec l’icône du mode sur les écrans de résultats.

### `session.js`

Il gère uniquement la session temporaire :

- planning ;
- index de la prochaine manche ;
- scores ;
- cartes déjà utilisées ;
- validation avant restauration.

La session est enregistrée après chaque manche complète. Si l’application est fermée pendant une manche, cette manche recommence au prochain lancement : aucun résultat partiel n’est compté.

### `multiplayer-controller.js`

Il orchestre :

- la configuration des joueurs ;
- la création du planning ;
- le passage du téléphone ;
- le compte à rebours ;
- le lancement du moteur adapté ;
- l’enregistrement du résultat ;
- le résumé de manche ;
- le classement final ;
- la reprise d’une session.

Il ne contient ni calcul de swipe, ni canevas, ni calcul détaillé des scores.

## Adaptation des moteurs existants

### `game/game-controller.js`

Le contrôleur accepte désormais un contexte multijoueur contenant :

- le joueur ;
- la manche ;
- la durée ;
- l’ordre dynamique des modes ;
- les cartes déjà utilisées ;
- un callback de fin.

En multijoueur, il prend une carte dans le mode suivant du parcours et recommence le parcours tant que le temps reste disponible.

Le mode Dessin utilise toujours le moteur mixte de la V0.6.0. Il peut apparaître en première position du parcours : le chronomètre général est alors immédiatement mis en pause avant l’affichage de la consigne cachée.

### `drawing/drawing-controller.js`

Le même moteur gère :

- Dessin autonome libre ;
- Dessin autonome multijoueur ;
- Dessin mélangé dans une manche classique.

En Dessin mélangé, le signal d’arrivée est joué directement avant l’écran de révélation. L’écran supplémentaire de récupération du téléphone n’existe plus. Le compte à rebours de retour au front est conservé après le dessin.

## Paquets de cartes

La session conserve une liste d’identifiants utilisés par mode.

Pour chaque mode :

1. seules les cartes actives correspondant aux filtres sont utilisées ;
2. une carte n’est pas reproposée tant que le paquet contient des cartes inédites ;
3. lorsque le paquet est épuisé, la liste utilisée pour ce mode est réinitialisée ;
4. aucun mélange entre les identifiants de deux modes n’est effectué.

## Interface

L’accueil contient :

- un sélecteur compact `Partie libre | Multijoueur` ;
- les boutons 30, 60 et 90 secondes ;
- un champ personnalisé compact dans la même rangée.

La grille de modes utilise une variable CSS calculée depuis le nombre réel de modes et autorise un défilement horizontal lorsque de futurs modes ne tiennent plus proprement sur une seule ligne.

## Données et compatibilité

Clés existantes conservées :

- `mdb-global-settings-v2` ;
- toutes les clés des quatre bibliothèques ;
- anciennes clés de sélection et de paramètres.

Nouvelle clé temporaire :

`mdb-multiplayer-session-v1`

Le schéma de sauvegarde permanent passe à `4` pour inclure les réglages multijoueur. La session active n’est volontairement pas exportée.

## PWA

`sw.js` reste à la racine.

Cache de la version :

`mdb-v0-7-0`

Le cache inclut la feuille de style multijoueur et les quatre modules du dossier `src/features/multiplayer/`.
