# Mais devine, bordel !

Application web mobile installable (PWA) regroupant plusieurs mini-jeux de soirée :

- La suite, maestro !
- Ferme-la et mime !
- Sans le dire !
- Picasso en PLS

L’interface, les filtres et le planificateur multijoueur utilisent la configuration des modes. Ils ne supposent pas qu’il existera toujours exactement quatre modes.

## Version

Version actuelle : **0.8.0**

La V0.8.0 ajoute :

- un filtre global `Facile / Moyen / Difficile` sur l’accueil, avec toutes les combinaisons possibles, y compris `Facile + Difficile` ;
- l’application immédiate de ce filtre à tous les modes ;
- des exceptions par mode toujours possibles depuis « Configurer » ;
- un indicateur compact coloré `F`, `M` ou `D` uniquement lorsqu’un mode utilise des difficultés différentes du filtre global ;
- des compteurs `cartes filtrées / cartes actives` sur chaque tuile et sur le total général ;
- une nouvelle icône Mime avec béret, visage et croix sur la bouche ;
- un nouveau déroulement multijoueur **Manches par mode** ;
- un ordre commun aléatoire ou une rotation différente et équilibrée par joueur ;
- la conservation du déroulement historique **Modes enchaînés**.

## Difficultés globales

Les trois commandes de l’accueil sont indépendantes et combinables :

- Facile ;
- Moyen ;
- Difficile ;
- Facile + Moyen ;
- Facile + Difficile ;
- Moyen + Difficile ;
- les trois difficultés.

Au moins une difficulté reste toujours active.

Une modification globale remplace les difficultés de tous les modes. Une modification faite ensuite dans la fenêtre d’un mode devient une exception visible sur sa tuile.

Exemple :

```text
Filtre global : Facile + Moyen
Mime : Difficile uniquement
```

La tuile Mime affiche alors uniquement une pastille rouge `D`.

## Compteurs de cartes

Chaque tuile affiche :

```text
cartes correspondant aux filtres / cartes actives du mode
```

Exemple :

```text
125 / 395 cartes
```

Le compteur général additionne uniquement les modes actuellement cochés.

## Déroulements multijoueurs

### Modes enchaînés

Chaque joueur garde le téléphone pendant toute sa manche et alterne les modes de son parcours jusqu’à la fin du chronomètre.

### Manches par mode

Chaque manche complète est consacrée à un seul mode. Avec trois joueurs et trois modes, un cycle contient neuf manches.

#### Ordre commun

Un ordre aléatoire est tiré une fois pour la partie, puis tous les joueurs suivent ce même ordre.

#### Rotation équilibrée

Chaque joueur joue exactement les mêmes modes et le même nombre de manches, mais dans un ordre différent autant que possible. Les positions sont réparties équitablement. Si le nombre de joueurs dépasse le nombre d’ordres distincts disponibles, les doublons sont distribués régulièrement.

## Données locales

La V0.8.0 conserve :

- les 1 318 cartes officielles ;
- les cartes et catégories personnelles ;
- les cartes officielles modifiées ;
- les sélections de catégories et de difficultés ;
- les réglages existants ;
- les sauvegardes des versions précédentes.

La session multijoueur active utilise une clé temporaire séparée et n’est pas incluse dans les sauvegardes permanentes.

## Publication

Application :

`https://88miyou88.github.io/mais-devine-bordel-/`

URL de test :

`https://88miyou88.github.io/mais-devine-bordel-/?v=080`

Diagnostic attendu :

```text
Version : 0.8.0
Cache attendu : mdb-v0-8-0
```

## Développement local

Les modules ES doivent être servis par HTTP :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=080`

## Contrôles automatiques

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md` et `docs/TESTS.md`.
