# Tests — V0.9.0

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
- Qui boit, bordel ? : 1 050 cartes ;
- total : 2 368 cartes.

Le validateur contrôle notamment :

- les identifiants uniques ;
- les catégories et difficultés ;
- les champs obligatoires ;
- les cinq mots interdits des cartes concernées ;
- les 1 050 textes uniques de Qui boit ;
- les intensités, mécaniques et résolutions structurées ;
- les ciblages compatibles avec les placeholders ;
- l’absence des erreurs d’élision automatiquement détectables ;
- les 75 cartes Après minuit correctement isolées.

## Smoke test

Il contrôle notamment :

- l’arborescence ;
- la version `0.9.0` ;
- le cache `mdb-v0-9-0` ;
- les chemins HTML, CSS, JS, JSON et manifeste ;
- la syntaxe des modules et du service worker ;
- la résolution des imports ;
- l’absence de cycles ;
- la direction des dépendances ;
- les anciennes clés de stockage ;
- le schéma de sauvegarde `6` ;
- les filtres globaux et exceptions par mode ;
- les deux déroulements multijoueurs ;
- les scores par mode ;
- les plages de pénalité de 1 à 10 ;
- les points attribués aux buveurs et aux profils Team soft ;
- le ciblage équilibré et l’absence de doublon dans un duel.

## Test fonctionnel dans Chromium

Un harnais temporaire injecte dans une page Chromium vierge :

- le vrai HTML ;
- l’ensemble des vrais styles ;
- les modules ES originaux, conservés dans leurs portées de module ;
- les cinq vrais JSON ;
- un stockage local simulé.

Le harnais n’est pas livré dans le dépôt.

Vérifications réalisées :

- démarrage en version `0.9.0` sans erreur JavaScript ;
- affichage des cinq tuiles et des 2 368 cartes ;
- pastille `Mots interdits : ON` ;
- sélection exclusive de Qui boit, bordel ? ;
- 975 cartes sans Après minuit et 1 050 avec Après minuit ;
- flamme rose visible après activation ;
- deux joueurs chargés dans la préparation ;
- profil Team soft activable individuellement ;
- plafond à trois et pénalités variables ;
- ciblage automatique simple ;
- duel sans perdant présélectionné ;
- ajout et expiration des règles temporaires ;
- passage de 30 cartes jusqu’au classement final ;
- gorgées et points enregistrés séparément ;
- Team soft classée avec les mêmes points de pénalité ;
- aucune erreur de console ni promesse rejetée.

## Responsive

Vérifications Chromium :

- accueil en 1 280 × 720 ;
- accueil en 800 × 450 ;
- accueil en 430 × 850 ;
- préparation du mode en 800 × 450 ;
- garde d’orientation visible en portrait ;
- aucun débordement horizontal sur ces formats.

## Vérifications Android à effectuer

1. ouvrir l’URL avec `?v=090` ;
2. contrôler la version et le cache dans le diagnostic ;
3. vérifier `Mots interdits : ON/OFF` sur la tuile Sans le dire ;
4. sélectionner Qui boit, bordel ? et vérifier que les autres modes se désactivent ;
5. tester Après minuit et la flamme rose ;
6. créer plusieurs joueurs et activer Team soft pour certains ;
7. tester plusieurs plafonds entre 1 et 10 ;
8. tester les quatre alternatives Team soft ;
9. tester votes, duels, défis chronométrés et règles temporaires ;
10. tester Retour, Passer, fin manuelle et reprise d’une session ;
11. vérifier le classement final, les gorgées et les points ;
12. confirmer vibrations, plein écran, paysage et installation PWA.

Les vibrations et le verrouillage réel de l’orientation restent nécessairement à confirmer sur un téléphone Android.
