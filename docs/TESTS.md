# Tests — V0.7.2

## Commandes automatiques

Depuis la racine du dépôt :

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

## Validation des bibliothèques

`validate-data.mjs` contrôle :

- la validité des quatre JSON ;
- les identifiants uniques ;
- les catégories référencées ;
- les difficultés ;
- les champs obligatoires ;
- les cinq mots interdits de Sans le dire !

Résultat attendu :

- paroles : 143 cartes ;
- mime : 395 cartes ;
- Sans le dire : 360 cartes ;
- dessin : 420 cartes ;
- total : 1 318 cartes.

## Smoke test

`smoke-test.mjs` vérifie notamment :

- l’arborescence complète ;
- la version `0.7.2` ;
- le cache `mdb-v0-7-2` ;
- tous les chemins HTML, CSS, manifeste et service worker ;
- les identifiants DOM ;
- la syntaxe de tous les modules ;
- la résolution des imports ;
- l’absence d’import circulaire ;
- la direction des dépendances ;
- la conservation des anciennes clés de stockage ;
- l’absence de l’écran « Récupère le téléphone » ;
- le déclenchement direct du Dessin sur la consigne cachée ;
- le Dessin en première position d’un parcours ;
- la fin correcte d’une série Dessin multijoueur ;
- les scores réussites/tentatives par mode ;
- le classement ;
- la sauvegarde et la restauration de session ;
- le schéma de session multijoueur V2 ;
- la fenêtre de récupération et la réparation sélective du cache ;
- le versionnement des CSS, du module principal et du service worker ;
- les nouveaux noms de modes et les icônes compactes sans flèches ;
- la présence du garde-fou paysage ;
- le responsive de l’accueil et du multijoueur sur fenêtre étroite ;
- la compatibilité des données locales et sauvegardes V0.6.0.

### Matrice du planificateur

Le test génère automatiquement des plannings avec :

- 1, 2, 3, 4, 5, 8 et 12 modes synthétiques ;
- 2, 3, 5 et 12 joueurs ;
- plusieurs cycles ;
- ordre commun ;
- rotation équilibrée.

Il vérifie que :

- chaque joueur possède le même nombre de manches ;
- chaque parcours contient tous les modes exactement une fois ;
- aucun identifiant de mode n’est perdu ou dupliqué ;
- l’ordre commun est réellement identique ;
- la rotation équilibrée produit plusieurs ordres lorsque c’est possible ;
- chaque mode apparaît dans les différentes positions avec un écart maximal d’une occurrence ;
- un joueur ne reçoit pas le même parcours deux cycles de suite lorsqu’il existe plusieurs modes ;
- l’algorithme n’est pas limité aux quatre modes actuels.

Un test de contrainte complémentaire a également parcouru 5 500 combinaisons couvrant 1 à 10 modes, 2 à 12 joueurs, 1 à 5 cycles et 10 graines aléatoires. L’écart maximal observé entre les positions est de 1 et aucune répétition consécutive évitable n’a été détectée.

## Test navigateur automatisé effectué avant livraison

La version est également chargée dans Chromium par un harnais temporaire utilisant les vrais modules ES et les vrais JSON. Ce contrôle vérifie :

- chargement des 1 318 cartes ;
- passage Partie libre → Multijoueur ;
- création d’une partie ;
- parcours commençant par Dessin ;
- absence d’écran de récupération intermédiaire ;
- révélation et passage du dessin ;
- reprise du chronomètre général sur le mode suivant ;
- fin manuelle de la manche ;
- affichage des statistiques par mode.

Ce harnais n’est pas ajouté au dépôt afin de conserver uniquement les deux fichiers de tests prévus par l’architecture.

Pour la V0.7.2, il vérifie aussi :

- l’accueil en 1280 × 720 ;
- l’absence de débordement horizontal en 800 × 450 ;
- l’accès à la barre d’actions après défilement vertical ;
- les quatre icônes seules dans le résumé multijoueur ;
- l’absence de texte et de flèches entre les modes ;
- l’écran de rotation en 430 × 850 ;
- la disparition automatique de cet écran après retour en paysage.

## Test local par HTTP

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=072`

Ne pas utiliser `file://`.

## Vérifications Android avant validation définitive

1. ouvrir `https://88miyou88.github.io/mais-devine-bordel-/?v=072` ;
2. vérifier `Version : 0.7.2` et `Cache attendu : mdb-v0-7-2` ;
3. vérifier Partie libre et Multijoueur sur l’accueil ;
4. tester le champ de durée personnalisé compact ;
5. créer une partie de 2, puis 3 joueurs ;
6. modifier, déplacer, mélanger et supprimer des joueurs ;
7. tester plusieurs cycles ;
8. tester Ordre commun ;
9. tester Rotation équilibrée ;
10. vérifier qu’un joueur garde le téléphone pendant toute sa durée ;
11. vérifier que les modes s’enchaînent dans l’ordre affiché ;
12. tester un parcours commençant par Dessin ;
13. vérifier que vibration et son arrivent directement sur « Appuie pour révéler le mot » ;
14. vérifier qu’aucun écran « Récupère le téléphone » n’apparaît ;
15. tester Dessin sur téléphone, sur papier, passé et expiré ;
16. vérifier le compte à rebours de retour au front ;
17. vérifier les puces icône + réussites/tentatives ;
18. vérifier les scores cumulés et le classement final ;
19. fermer l’application entre deux manches puis reprendre ;
20. fermer l’application pendant une manche et vérifier que cette manche recommence ;
21. tester Dessin seul en multijoueur ;
22. tester une partie libre classique après la mise à jour ;
23. vérifier les anciennes cartes, catégories, réglages et sauvegardes ;
24. fermer puis rouvrir la PWA pour contrôler le nouveau service worker.

Les vibrations, sons, maintien tactile, plein écran, verrouillage paysage et comportement réel en arrière-plan doivent être validés sur un téléphone Android. Si le navigateur refuse le verrouillage, vérifier que le garde-fou de rotation s’affiche proprement.
