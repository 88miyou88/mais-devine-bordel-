# Architecture — V0.9.0

## Principes

La V0.9.0 conserve la direction des dépendances :

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

## Nouveau mode autonome

La configuration du mode est déclarée dans `src/config/config.js` avec :

- son identité visuelle ;
- sa bibliothèque `data/drinking.json` ;
- ses clés de stockage ;
- ses libellés de difficulté spécifiques ;
- le marqueur `standalone: true`.

Lorsque ce mode est activé, `home.js` désactive les autres modes et force la partie libre. Le multijoueur classique n’est pas modifié.

## Dossier `drinking-game`

```text
src/features/drinking-game/
├── drinking-controller.js
├── card-engine.js
├── targeting.js
├── penalties.js
├── rules.js
└── session.js
```

### `drinking-controller.js`

Orchestre :

- la préparation des joueurs ;
- le déroulement manuel des cartes ;
- les boutons de résolution ;
- le mini-chronomètre des défis ;
- le retour à la carte précédente ;
- les résultats finaux.

Il ne contient ni le filtrage de la bibliothèque ni l’algorithme de ciblage.

### `card-engine.js`

- construit le paquet avec les filtres du mode ;
- exclut les cartes incompatibles avec le nombre de joueurs ;
- recycle le paquet après épuisement ;
- prépare le texte avec les prénoms ciblés.

### `targeting.js`

Le ciblage automatique privilégie les joueurs les moins sollicités et évite autant que possible deux ciblages consécutifs de la même personne.

Pour les duels, deux joueurs distincts sont préparés mais le perdant est sélectionné manuellement avant l’application de la pénalité.

### `penalties.js`

Les cartes ne stockent pas une phrase rigide comme « boire 2 gorgées ». Elles stockent une intensité :

```text
light | medium | strong
```

Le moteur calcule une plage selon le plafond de 1 à 10 puis tire une quantité dans cette plage.

La même quantité alimente toujours `penaltyPoints`. Selon le profil :

- joueur classique : gorgées + points ;
- Team soft : points, jetons, mini-défi ou joker + points.

### `rules.js`

- ajoute une règle temporaire ;
- limite l’affichage à trois règles actives ;
- décrémente leur durée après chaque carte ;
- supprime les règles expirées.

### `session.js`

La partie active est sauvegardée sous :

```text
mdb-drinking-session-v1
schéma interne : 1
```

La session est supprimée à la fin ou lors d’un abandon volontaire. Elle n’est pas incluse dans la sauvegarde permanente.

## Structure de `data/drinking.json`

Le fichier source de 1 050 questions a été migré vers une bibliothèque exploitable par l’application.

Chaque carte contient notamment :

```text
id
boxId
active
difficulty
prompt
mechanic
targetType
penalty.intensity
resolution.kind
resolution.supports
durationSeconds
ruleDurationCards
adult
minPlayers
```

Les conséquences sont donc structurées et extensibles. Les alternatives Team soft ne dépendent pas de la présence d’un chiffre dans une phrase.

## Niveaux et thème Après minuit

Les trois niveaux restent compatibles avec le filtre global :

```text
easy   → Pépouze
medium → Ça chauffe
hard   → Demain, on nie tout
```

La boîte `apres_minuit` porte la métadonnée `adult: true`. Elle est exclue de la sélection initiale et ajoutée ou retirée par l’interrupteur du mode.

## Accueil

`home.js` assure :

- l’exclusivité du mode autonome ;
- le compteur `cartes filtrées / cartes actives` ;
- la flamme Après minuit ;
- la pastille `Mots interdits : ON/OFF` ;
- les difficultés globales et exceptions existantes.

Chaque tuile possède `data-mode-id`, ce qui facilite les tests et les futures extensions sans dépendre de son texte.

## Gestionnaire de cartes

Le gestionnaire accepte la cinquième bibliothèque. L’éditeur simple permet de modifier ou créer une consigne tout en préservant les métadonnées structurées des cartes officielles.

## Stockage et sauvegardes

Nouvelles clés :

```text
mdb-drinking-boxes-v1
mdb-drinking-cards-v1
mdb-drinking-library-meta-v1
mdb-drinking-selection-v1
mdb-drinking-session-v1
```

Le schéma de sauvegarde permanent passe à `6` et accepte toujours les schémas antérieurs pris en charge.

## PWA

Version : `0.9.0`

Cache : `mdb-v0-9-0`

Jeton des ressources critiques : `090`

Le service worker met en cache la cinquième bibliothèque, sa feuille de style et les six modules du nouveau moteur.
