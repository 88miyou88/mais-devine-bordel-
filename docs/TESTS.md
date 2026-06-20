# Tests — V0.9.6.1

## Commandes

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

## Bibliothèques attendues

- Maestro : 172 cartes ;
- Mime : 1 000 cartes ;
- Sans le dire : 360 cartes ;
- Dessin : 420 cartes ;
- Qui boit : 1 050 cartes ;
- total : 3 002 cartes.

## Contrôles principaux

Le validateur et le smoke test couvrent :

- JSON, identifiants, catégories, difficultés et doublons ;
- versions de bibliothèques et cache V0.9.6.1 ;
- migration Maestro vers les 172 cartes actives après audit ;
- non-restauration des cartes officielles supprimées ;
- conservation des cartes personnelles et modifications locales ;
- champ `context` de Maestro ;
- mode Audit, reprise, statuts, suppression et restauration ;
- correction directe, raccourci `M`, changement de difficulté et journal `edits` ;
- motif libre et nouveaux motifs Maestro ;
- corbeille Qui boit compacte après le bouton Fin ;
- remplacement d’une mention « prennent la pénalité » par la conséquence réelle sans phrase redondante ;
- pénalités Team soft ;
- sauvegardes, modules ES, imports et absence de cycles ;
- multijoueur, Dessin et historique des cartes.

## Vérifications manuelles recommandées

1. ouvrir `?v=0961` ;
2. vérifier `Version : 0.9.6.1` et `mdb-v0-9-6-1` ;
3. ouvrir Audit, corriger une carte avec `M`, changer sa difficulté puis exporter le rapport ;
4. vérifier la présence de `edits` avec avant/après ;
5. tester « À revoir » avec un motif rapide, une précision libre et « Je ne sais pas » ;
6. vérifier la corbeille Qui boit après Fin ;
7. afficher une condition collective contenant déjà « prennent la pénalité » et vérifier qu’une seule conséquence est affichée ;
8. confirmer le rendu en paysage sur ordinateur et téléphone.
