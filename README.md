# Mais devine, bordel !

Application web mobile installable (PWA) regroupant cinq mini-jeux de soirée :

- La suite, maestro !
- Ferme-la et mime !
- Sans le dire !
- Picasso en PLS
- Qui boit, bordel ?

L’interface, les filtres et le planificateur multijoueur reposent sur la configuration des modes. Ils ne supposent pas qu’il existera toujours exactement cinq modes.

## Version

Version actuelle : **0.9.0**

La V0.9.0 ajoute **Qui boit, bordel ?**, un mode autonome dans lequel le téléphone reste visible par le groupe :

- 1 050 cartes réparties entre 14 thèmes et trois niveaux de chaos ;
- ciblage équilibré des joueurs ;
- cartes collectives, votes, vérités, défis, duels et règles temporaires ;
- profils individuels `🥤 Team soft` ;
- pénalités variables selon un plafond configurable de 1 à 10 ;
- points de pénalité attribués aussi aux joueurs qui boivent ;
- alternatives Team soft en points, jetons, mini-défis ou jokers ;
- choix entre une durée et un nombre exact de cartes ;
- mode facultatif **Après minuit**, signalé par une flamme rose sur la tuile ;
- sauvegarde et reprise d’une partie interrompue ;
- classement final et titres humoristiques.

La tuile **Sans le dire !** indique désormais directement si les mots interdits sont activés ou désactivés.

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

### Niveaux

Les filtres globaux de l’accueil restent `F`, `M` et `D`, mais les libellés du mode sont :

- `F` — Pépouze ;
- `M` — Ça chauffe ;
- `D` — Demain, on nie tout.

### Pénalités

Chaque carte possède une intensité structurée. Le moteur tire une valeur compatible avec le plafond choisi pour la partie.

Un joueur qui boit reçoit :

```text
X gorgées + X points de pénalité
```

Un joueur `🥤 Team soft` participe à toutes les cartes, mais reçoit l’alternative choisie et les mêmes points de pénalité.

### Après minuit

Le thème adulte est désactivé par défaut. Lorsqu’il est activé, ses 75 cartes rejoignent la sélection et une flamme rose apparaît sur la tuile du mode.

### Mode autonome

Qui boit, bordel ? ne se mélange pas encore aux jeux joués sur le front. Sa mécanique collective, ses règles persistantes et son avancement manuel utilisent un contrôleur séparé.

Une future « playlist de soirée » pourra alterner des blocs complets de modes sans injecter ces cartes une par une dans les manches classiques.

## Compatibilité

La V0.9.0 conserve :

- les identifiants et contenus des quatre bibliothèques précédentes ;
- les cartes et catégories personnelles ;
- les cartes officielles modifiées ;
- les réglages, filtres et sauvegardes existants ;
- les deux déroulements multijoueurs de la V0.8.0 ;
- le Dessin autonome et mélangé.

La session temporaire de Qui boit, bordel ? utilise la clé `mdb-drinking-session-v1` et n’est pas exportée dans les sauvegardes permanentes.

## Publication

Application :

`https://88miyou88.github.io/mais-devine-bordel-/`

URL de test :

`https://88miyou88.github.io/mais-devine-bordel-/?v=090`

Diagnostic attendu :

```text
Version : 0.9.0
Cache attendu : mdb-v0-9-0
```

## Développement local

Les modules ES doivent être servis par HTTP :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=090`

## Contrôles automatiques

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md` et `docs/TESTS.md`.
