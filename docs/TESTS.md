# Tests — V0.8.0

## Commandes

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

## Bibliothèques

Résultat attendu :

- Paroles : 143 cartes ;
- Mime : 395 cartes ;
- Sans le dire : 360 cartes ;
- Dessin : 420 cartes ;
- total : 1 318 cartes.

Le validateur contrôle les identifiants, catégories, difficultés, champs obligatoires et les cinq mots interdits de chaque carte concernée.

## Smoke test

Il contrôle notamment :

- l’arborescence ;
- la version `0.8.0` ;
- le cache `mdb-v0-8-0` ;
- les chemins HTML, CSS, JS, JSON et manifeste ;
- la syntaxe des modules et du service worker ;
- la résolution des imports ;
- l’absence de cycles ;
- la direction des dépendances ;
- les anciennes clés de stockage ;
- le schéma de session multijoueur `3` ;
- le schéma de sauvegarde `5` ;
- les filtres globaux de difficulté ;
- les exceptions par mode ;
- les compteurs filtré/total ;
- les deux déroulements multijoueurs ;
- les ordres communs et équilibrés ;
- les scores par mode ;
- la restauration des anciennes sauvegardes.

## Matrice du planificateur

Les tests utilisent :

- 1, 2, 3, 4, 5, 8 et 12 modes synthétiques ;
- 2, 3, 5 et 12 joueurs ;
- plusieurs cycles ;
- `continuous` et `mode-blocks` ;
- ordre commun et rotation équilibrée.

Ils vérifient :

- le nombre exact de manches ;
- le même nombre de modes pour tous ;
- chaque mode exactement une fois par joueur et par cycle en manches dédiées ;
- le regroupement par mode en ordre commun ;
- des ordres distincts autant que possible en rotation équilibrée ;
- un écart maximal de 1 entre les positions d’un mode ;
- l’absence de dépendance aux quatre modes actuels.

## Test navigateur réalisé avant livraison

Un harnais temporaire charge l’interface dans Chromium avec :

- le vrai HTML ;
- les vrais styles ;
- le JavaScript regroupé temporairement à partir des modules sources ;
- les quatre vrais JSON ;
- un stockage local simulé.

Le harnais n’est pas livré dans le dépôt.

Vérifications réalisées :

- démarrage en version `0.8.0` sans erreur JavaScript ;
- affichage des quatre tuiles ;
- compteurs initiaux ;
- combinaison `Facile + Difficile` ;
- recalcul immédiat des compteurs ;
- exception Mime en `Difficile` uniquement et affichage de la seule pastille `D` ;
- ouverture de la configuration multijoueur ;
- activation de « Manches par mode » ;
- estimation correcte du nombre de manches ;
- création d’une session dédiée par mode ;
- parcours complet visible et mode courant mis en évidence ;
- absence d’erreur de console ;
- absence de débordement horizontal en 800 × 450, 850 × 430 et 430 × 850.

## Vérifications Android à effectuer

1. ouvrir l’URL avec `?v=080` ;
2. vérifier la version et le cache dans le diagnostic ;
3. tester toutes les combinaisons de difficultés, notamment `Facile + Difficile` ;
4. créer une exception sur un seul mode ;
5. vérifier les compteurs de chaque tuile et le compteur général ;
6. tester « Modes enchaînés » ;
7. tester « Manches par mode » en ordre commun ;
8. vérifier que tous les joueurs font le même mode avant le passage au suivant ;
9. tester « Manches par mode » en rotation équilibrée ;
10. vérifier que les joueurs reçoivent des ordres différents mais les mêmes modes ;
11. tester plusieurs cycles ;
12. tester une manche Dessin dédiée ;
13. vérifier scores, reprise de session, vibration, son, plein écran et paysage.

Les vibrations, sons, maintien tactile et verrouillage réel de l’orientation restent nécessairement à confirmer sur un téléphone Android.
