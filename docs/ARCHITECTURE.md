# Architecture — V0.5.1

## Objectif

La V0.5.1 transforme la structure plate de la V0.5.0 en une architecture modulaire maintenable, sans modifier le fonctionnement attendu des quatre modes.

## Arborescence

```text
mais-devine-bordel/
├── index.html
├── manifest.webmanifest
├── sw.js
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   └── TESTS.md
├── assets/
│   ├── icons/
│   └── styles/
│       ├── foundation.css
│       ├── components.css
│       └── screens/
├── data/
│   ├── lyrics.json
│   ├── mimes.json
│   ├── words.json
│   └── drawings.json
├── src/
│   ├── main.js
│   ├── config/
│   ├── core/
│   ├── services/
│   └── features/
└── tests/
```

## Point d’entrée

`index.html` charge un seul script :

```html
<script type="module" src="./src/main.js"></script>
```

`src/main.js` initialise les services et les fonctionnalités. Il ne contient pas les règles détaillées de chaque mode.

## Direction des dépendances

La direction autorisée est la suivante :

```text
config / core
      ↑
   services
      ↑
   features
      ↑
    main.js
```

En pratique :

- `config/` ne dépend d’aucune fonctionnalité ;
- `core/` ne doit jamais importer `services/` ou `features/` ;
- `services/` peut importer `config/` et `core/` ;
- `features/` peut importer `config/`, `core/` et `services/` ;
- `main.js` orchestre l’ensemble ;
- les imports circulaires sont interdits.

## Rôle des dossiers

### `assets/`

Contient les ressources visuelles statiques : icônes et feuilles de style.

- `foundation.css` : variables, règles globales et fondations visuelles ;
- `components.css` : boutons, formulaires, fenêtres et composants partagés ;
- `screens/` : styles propres à chaque écran.

### `data/`

Contient les bibliothèques officielles. Les JSON sont la source de vérité des cartes officielles. Ils ne doivent pas être recopiés dans le JavaScript.

`data.json` a été renommé en `lyrics.json` afin que son contenu soit immédiatement identifiable.

### `src/config/`

`config.js` contient les constantes globales stables, les informations des modes, les chemins des bibliothèques, la version et les clés de stockage.

### `src/core/`

Contient uniquement les briques communes de bas niveau :

- `state.js` : état central de l’application ;
- `dom.js` : références DOM et aides d’affichage ou d’appareil réellement communes ;
- `storage.js` : lecture et écriture génériques du stockage local ;
- `utils.js` : petites fonctions génériques sans règle métier.

Aucune logique spécifique au jeu, au dessin ou au gestionnaire ne doit être cachée dans `utils.js` ou `dom.js`.

### `src/services/`

Contient les opérations transversales liées aux données :

- `libraries.js` : chargement, normalisation, conservation et synchronisation des bibliothèques ;
- `backup.js` : création, validation et restauration des sauvegardes ;
- `diagnostics.js` : diagnostic et enregistrement du service worker.

### `src/features/`

Contient les fonctionnalités visibles :

- `home.js` : accueil, configuration des modes et paramètres avancés ;
- `game/` : partie classique, chronomètre, swipe et résultats ;
- `drawing/` : partie Dessin autonome, canevas, maintien tactile et support papier ;
- `card-manager/` : liste, édition des cartes et gestion des catégories.

Les dossiers sont utilisés seulement lorsque la fonctionnalité possède plusieurs responsabilités autonomes.

## Compatibilité des données V0.5.0

La refonte conserve :

- tous les identifiants de cartes et de catégories ;
- les cartes personnelles ;
- les cartes officielles modifiées localement ;
- les catégories personnelles ;
- les sélections de catégories et de difficultés ;
- les réglages des quatre modes ;
- les sauvegardes existantes ;
- les clés `localStorage` de la V0.5.0.

Le déplacement des JSON ne modifie pas le contenu des bibliothèques.

## PWA et service worker

`sw.js` reste à la racine afin de conserver une portée sur toute l’application.

Le cache de cette version est :

`mdb-v0-5-1`

Tous les fichiers nécessaires au fonctionnement hors ligne sont listés explicitement dans le service worker.
