# Mais devine, bordel !

Application web mobile installable (PWA) regroupant cinq mini-jeux de soirée :

- La suite, maestro !
- Ferme-la et mime !
- Sans le dire !
- Picasso en PLS
- Qui boit, bordel ?

L’interface, les filtres et le planificateur multijoueur reposent sur la configuration des modes. Ils ne supposent pas qu’il existera toujours exactement cinq modes.

## Version

Version actuelle : **0.9.1**

La V0.9.1 corrige le moteur d’interaction de **Qui boit, bordel ?** :

- chaque mécanique possède désormais ses propres actions et libellés ;
- swipe à droite et à gauche disponible sur les cartes ;
- aucune personne n’est présélectionnée pour les votes et conditions collectives ;
- les personnes ciblées automatiquement ne sont plus affichées comme un choix inutile ;
- les questions conditionnelles affichent directement la conséquence adaptée au joueur ;
- l’interface parle de gorgées pour les buveurs et de pénalités ou alternatives pour Team soft ;
- les points de classement restent calculés en interne sans encombrer les cartes ;
- les règles actives sont rappelées dans la carte ;
- « Oubli de règle » permet réellement de choisir la personne concernée ;
- les résultats mettent en avant les pénalités et gorgées, plus les réussites utiles, plutôt que les ciblages techniques.

La V0.9.1 migre automatiquement les cartes officielles V0.9.0 concernées, sans écraser une carte modifiée localement.

## Bibliothèques

| Mode | Fichier | Cartes |
|---|---|---:|
| La suite, maestro ! | `data/lyrics.json` | 143 |
| Ferme-la et mime ! | `data/mimes.json` | 395 |
| Sans le dire ! | `data/words.json` | 360 |
| Picasso en PLS | `data/drawings.json` | 420 |
| Qui boit, bordel ? | `data/drinking.json` | 1 050 |
| **Total** | | **2 368** |

## Qui boit, bordel ?

### Résolution des cartes

Les comportements sont déterminés par la mécanique de la carte :

- vote : sélectionner une personne, puis valider ;
- condition collective : sélectionner toutes les personnes concernées ;
- condition personnelle : swipe à droite si oui, à gauche si non ;
- vérité ou anecdote : répondre ou prendre la conséquence ;
- défi : réussite sans pénalité, échec ou refus avec pénalité ;
- duel : sélectionner le perdant ;
- tribunal : coupable ou non coupable ;
- règle temporaire : activer ou ignorer.

Le bouton **Passer** reste indépendant et permet de retirer la carte sans appliquer de conséquence.

### Pénalités

Chaque carte possède une intensité structurée. Le moteur tire une valeur compatible avec le plafond choisi pour la partie.

- joueur classique : la conséquence visible est exprimée en gorgées ;
- joueur `🥤 Team soft` : la conséquence visible utilise l’alternative choisie ;
- la même valeur alimente silencieusement le classement en pénalités.

### Après minuit

Le thème est désactivé par défaut. Lorsqu’il est activé, ses 75 cartes rejoignent la sélection et une flamme rose apparaît sur la tuile du mode.

### Mode autonome

Qui boit, bordel ? reste autonome. Une future « playlist de soirée » pourra alterner des blocs complets de modes sans injecter ces cartes une par une dans les manches classiques.

## Compatibilité

La V0.9.1 conserve :

- les 2 368 cartes et leurs identifiants ;
- les cartes et catégories personnelles ;
- les cartes officielles modifiées ;
- les réglages, filtres et sauvegardes existants ;
- les deux déroulements multijoueurs ;
- le Dessin autonome et mélangé.

La session temporaire de Qui boit utilise la clé `mdb-drinking-session-v1` avec le schéma interne `2`. Une session V0.9.0 incomplète n’est pas restaurée.

## Publication

Application :

`https://88miyou88.github.io/mais-devine-bordel-/`

URL de test :

`https://88miyou88.github.io/mais-devine-bordel-/?v=091`

Diagnostic attendu :

```text
Version : 0.9.1
Cache attendu : mdb-v0-9-1
```

## Développement local

Les modules ES doivent être servis par HTTP :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=091`

## Contrôles automatiques

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md` et `docs/TESTS.md`.
