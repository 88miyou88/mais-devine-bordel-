# Tests — V0.9.2

## Commandes

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

## Validation des bibliothèques

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
- les champs structurés du mode Qui boit ;
- les résolutions autorisées ;
- les 73 conditions personnelles correctement typées ;
- les alternatives et intensités ;
- les textes uniques et les principales erreurs d’élision.

## Smoke test

Il contrôle notamment :

- les 58 fichiers attendus ;
- la version `0.9.2` ;
- le cache `mdb-v0-9-2` ;
- les chemins HTML, CSS, JS, JSON et manifeste ;
- la syntaxe des modules ;
- les imports et l’absence de cycles ;
- les identifiants DOM ;
- les anciennes clés de stockage ;
- les planificateurs multijoueurs ;
- les filtres globaux et compteurs ;
- le calcul des pénalités ;
- les libellés visibles gorgées / Team soft ;
- la logique des interactions contextuelles sans boutons redondants ;
- le ciblage équilibré ;
- les règles temporaires ;
- la migration automatique V0.9.0 → V0.9.2 ;
- la préservation d’une carte modifiée localement.

## Scénarios logiques vérifiés

- condition personnelle : droite = oui avec pénalité, gauche = non ;
- réponse ou boisson : droite = réponse, gauche = refus avec pénalité ;
- défi : droite = réussi, gauche = raté/refusé ;
- vote : sélection unique obligatoire avant validation ;
- condition collective : sélection multiple ;
- duel : sélection limitée aux deux participants ;
- tribunal : coupable ou non coupable ;
- règle temporaire : activation, rappel et oubli attribuable.

## Vérifications Android à effectuer

1. ouvrir l’URL avec `?v=092` ;
2. vérifier la version et le cache dans le diagnostic ;
3. tester un swipe gauche et droit sur chaque grande famille de carte ;
4. vérifier qu’un vote ne peut pas être validé sans personne sélectionnée ;
5. vérifier qu’une condition collective permet plusieurs sélections ;
6. vérifier qu’une cible automatique n’affiche pas tous les joueurs ;
7. vérifier les formulations gorgées et Team soft ;
8. activer une règle, vérifier son rappel dans la carte puis tester « Oubli de règle » ;
9. vérifier que Retour est intégré dans la carte et que les anciens boutons de résolution ont disparu ;
10. vérifier la fin manuelle, la reprise et les résultats finaux.

L’environnement automatisé de cette génération a validé le code et les scénarios purs, mais les gestes tactiles réels, vibrations, plein écran et orientation restent à confirmer sur Android.
