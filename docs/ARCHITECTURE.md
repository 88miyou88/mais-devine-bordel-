# Architecture — V0.9.2

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

## Migration de la bibliothèque Qui boit

`data/drinking.json` passe à la version `2026.06.17-2`.

Les 73 questions officielles commençant par « as-tu déjà » reçoivent la résolution explicite `personal_condition`. Lors du premier chargement :

- une carte officielle non modifiée est actualisée automatiquement ;
- son état actif ou désactivé est conservé ;
- une carte modifiée localement n’est jamais écrasée.

## DOM

La carte Qui boit contient désormais toute l’interaction utile :

- deux indicateurs de swipe contextuels ;
- le texte complet, conséquence comprise ;
- les joueurs sélectionnables disposés dans une grille interne ;
- le rappel des règles actives ;
- le bouton « Oubli de règle », uniquement lorsqu’une règle existe ;
- le bouton Retour et le mini-chronomètre éventuel.

Les anciens boutons de résolution et le bouton Passer ont été supprimés. La logique métier reste décrite dans `interaction.js`, tandis que le contrôleur applique l’effet correspondant au swipe.

## PWA

```text
Version : 0.9.2
Cache : mdb-v0-9-2
Jeton des ressources : 092
```

Le service worker met en cache les deux nouveaux modules `interaction.js` et `swipe.js`.
