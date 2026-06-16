# Architecture — V0.6.0

## Objectif

La V0.6.0 conserve l'architecture modulaire de la V0.5.1 et ajoute le Dessin mélangé sans dupliquer le moteur de dessin autonome.

Le même canevas, le même chronomètre de dessin, les mêmes actions tactiles et les mêmes écrans téléphone/papier sont réutilisés. Le contrôleur de partie classique orchestre uniquement l'interruption, la pénalité et la reprise.

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

- `config/` ne dépend d'aucune fonctionnalité ;
- `core/` ne doit jamais importer `services/` ou `features/` ;
- `services/` peut importer `config/` et `core/` ;
- `features/` peut importer `config/`, `core/` et `services/` ;
- `main.js` orchestre l'initialisation ;
- aucun import circulaire n'est autorisé.

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
│       └── card-manager/
└── tests/
```

## Modules concernés par le Dessin mélangé

### `src/features/drawing/mixed-drawing.js`

Module métier pur. Il ne manipule pas le DOM et ne dépend pas du contrôleur de jeu.

Il gère :

- la normalisation du nombre de dessins ;
- le calcul de la pénalité selon la durée de manche ;
- la création des positions théoriques dans la manche ;
- le calcul du nombre réellement faisable pour les durées très courtes ;
- le déclenchement lorsque la position est atteinte ;
- le blocage des dessins devenus impossibles faute de temps ;
- l'état commencé/terminé d'une interruption Dessin.

### `src/features/game/game-controller.js`

Il orchestre la manche normale et la mécanique mélangée :

1. prépare les cartes normales et la file de dessins ;
2. déclenche un dessin après une carte normale ;
3. met silencieusement le chronomètre général en pause ;
4. reçoit le résultat du mini-jeu ;
5. applique une seule fois la pénalité ;
6. met à jour le score et l'historique ;
7. reprend la manche après le compte à rebours.

Il ne contient pas la logique du canevas.

### `src/features/drawing/drawing-controller.js`

Il gère deux contextes avec le même moteur :

- `standalone` : partie Dessin autonome ;
- `mixed` : interruption spéciale au milieu d'une partie classique.

Il prend en charge :

- récupération du téléphone ;
- révélation volontaire de la consigne ;
- choix téléphone/papier ;
- mini-chronomètre ;
- pause locale du dessin ;
- Trouvé, Passer ou expiration ;
- retour au front et compte à rebours ;
- callback vers le contrôleur de jeu.

### `src/features/game/timer.js`

Le chronomètre général distingue désormais :

- la pause volontaire de l'utilisateur ;
- la pause système liée au Dessin mélangé.

La pause Dessin n'affiche pas l'overlay de pause classique et ne peut pas être reprise accidentellement par le bouton principal.

### `src/features/game/results.js`

L'historique final conserve l'ordre réel des cartes classiques et des dessins. Le résumé distingue :

- cartes normales validées et passées ;
- dessins trouvés, passés et expirés ;
- points de dessin ;
- pénalité totale ;
- dessins non déclenchés faute de temps.

## Données et compatibilité

La V0.6.0 conserve les clés `localStorage` de la V0.5.1 et de la V0.5.0.

Les anciens réglages Dessin sont complétés par défaut avec :

- `mixedCount: 2` ;
- `arrivalSoundEnabled: true`.

La lecture des réglages et la restauration des sauvegardes fusionnent ces nouvelles propriétés sans supprimer les anciennes personnalisations.

Sont préservés :

- identifiants de cartes et catégories ;
- cartes personnelles ;
- cartes officielles modifiées ;
- catégories personnelles ;
- sélections et réglages des quatre modes ;
- sauvegardes existantes.

## PWA et service worker

`sw.js` reste à la racine pour contrôler toute l'application.

Cache de la version :

`mdb-v0-6-0`

Le nouveau module `src/features/drawing/mixed-drawing.js` fait partie des fichiers mis en cache.
