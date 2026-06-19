# Mais devine, bordel !

Application web mobile installable (PWA) regroupant cinq mini-jeux de soirée :

- La suite, maestro !
- Ferme-la et mime !
- Sans le dire !
- Picasso en PLS
- Qui boit, bordel ?

L’interface, les filtres et le planificateur multijoueur reposent sur la configuration des modes. Ils ne supposent pas qu’il existera toujours exactement cinq modes.

## Version

Base technique actuelle : **0.9.5.1**

La V0.9.5.1 stable ajoute :

- la suppression d’une carte directement pendant une partie dans les cinq modes ;
- une confirmation avant suppression et une cible tactile de 44 × 44 px ;
- le passage immédiat à la carte suivante sans modifier le score ;
- la conservation locale des suppressions afin que la carte ne ressorte plus ;
- un rapport JSON dédupliqué téléchargeable depuis les paramètres avancés ;
- l’intégration de ce journal aux sauvegardes générales ;
- l’absence de prénoms, de réponses ou d’autres données de partie dans le rapport exporté ;
- un historique corrigé : après un ou plusieurs retours, les cartes qui avaient déjà été préparées reviennent dans le même ordre ;
- la nouvelle bibliothèque de 1 000 mimes ;
- la bibliothèque Qui boit révisée sans changement d’identifiants ;
- la réparation automatique des téléphones restés bloqués à 395 mimes ;
- un bouton de suppression désormais libellé « Suppr. » pour être clairement visible en jeu.

## Bibliothèques

| Mode | Fichier | Cartes |
|---|---|---:|
| La suite, maestro ! | `data/lyrics.json` | 143 |
| Ferme-la et mime ! | `data/mimes.json` | 1 000 |
| Sans le dire ! | `data/words.json` | 360 |
| Picasso en PLS | `data/drawings.json` | 420 |
| Qui boit, bordel ? | `data/drinking.json` | 1 050 |
| **Total** | | **2 973** |

## Qui boit, bordel ?

### Résolution des cartes

Les comportements sont déterminés par la mécanique de la carte :

- vote : sélectionner une personne dans la carte, puis swiper à droite ;
- condition collective : sélectionner toutes les personnes concernées, puis swiper à droite ;
- condition personnelle : swipe à droite si oui, à gauche si non ;
- vérité ou anecdote : swipe à droite si la personne répond, à gauche si elle refuse ;
- défi : swipe à droite en cas de réussite, à gauche en cas d’échec ou de refus ;
- duel : sélectionner le perdant puis swiper à droite, ou swiper à gauche en cas d’égalité ;
- tribunal : droite pour coupable, gauche pour non coupable ;
- règle temporaire : droite pour activer, gauche pour ignorer.


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

La V0.9.5.1 conserve :

- les identifiants des 1 050 cartes Qui boit et des 395 premiers mimes ;
- les cartes et catégories personnelles ;
- les cartes officielles modifiées localement ;
- les cartes supprimées localement, qui ne sont pas restaurées par la migration ;
- les réglages, filtres et sauvegardes existants ;
- les deux déroulements multijoueurs ;
- le Dessin autonome et mélangé.

La session temporaire de Qui boit utilise la clé `mdb-drinking-session-v1` avec le schéma interne `2`. Une session V0.9.0 incomplète n’est pas restaurée.

## Publication

Cette archive constitue la version stable V0.9.5.1. Les autres bibliothèques révisées seront intégrées dans une mise à jour ultérieure.

Application de référence :

`https://88miyou88.github.io/mais-devine-bordel-/`

URL de test :

`https://88miyou88.github.io/mais-devine-bordel-/?v=0951`

Diagnostic attendu :

```text
Version : 0.9.5.1
Cache attendu : mdb-v0-9-5-1
```

## Développement local

Les modules ES doivent être servis par HTTP :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=0951`

## Contrôles automatiques

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md`, `docs/TESTS.md` et `docs/CARD-REMOVAL-REPORTS.md`.
