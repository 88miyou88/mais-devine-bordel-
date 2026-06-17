# Mais devine, bordel !

Application web mobile installable (PWA) regroupant cinq mini-jeux de soirée :

- La suite, maestro !
- Ferme-la et mime !
- Sans le dire !
- Picasso en PLS
- Qui boit, bordel ?

L’interface, les filtres et le planificateur multijoueur reposent sur la configuration des modes. Ils ne supposent pas qu’il existera toujours exactement cinq modes.

## Version

Version actuelle : **0.9.2**

La V0.9.2 simplifie l’interface de **Qui boit, bordel ?** autour d’une seule action principale : le swipe.

- les boutons « Passer », « A répondu », « Refus », « Réussi » et équivalents ont été supprimés ;
- la carte indique directement ce que signifie la conséquence : gorgées pour un buveur, pénalités ou alternative pour Team soft ;
- swipe à droite confirme l’action positive ou attribue la conséquence selon la mécanique ;
- swipe à gauche signifie non, refus, échec, égalité ou personne concernée selon la carte ;
- les joueurs à sélectionner apparaissent directement dans la carte, en grille, sans barre horizontale séparée ;
- le bouton « Oubli de règle » et les règles actives sont intégrés dans la carte ;
- le bouton Retour reste disponible dans la carte ;
- les questions longues utilisent automatiquement une taille adaptée ;
- le premier prénom proposé est désormais Camille ;
- les noms générés sont automatiquement sélectionnés au clic afin de pouvoir les remplacer sans les effacer manuellement.

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

La V0.9.2 conserve :

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

`https://88miyou88.github.io/mais-devine-bordel-/?v=092`

Diagnostic attendu :

```text
Version : 0.9.2
Cache attendu : mdb-v0-9-2
```

## Développement local

Les modules ES doivent être servis par HTTP :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=092`

## Contrôles automatiques

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md` et `docs/TESTS.md`.
