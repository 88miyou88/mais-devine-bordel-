# Rapport de validation — bibliothèque Mime V0.9.7

## Source

Audit complet exporté le 20 juin 2026 depuis l’application V0.9.6.1.

## Transformation

- 1 000 cartes d’origine ;
- 354 cartes supprimées pendant l’audit ;
- 2 doublons supplémentaires retirés au contrôle final ;
- 356 cartes retirées du JSON actif au total ;
- 223 cartes corrigées selon les valeurs finales du rapport ;
- 644 cartes conservées ;
- 636 cartes avec `auditStatus: approved` ;
- 8 cartes avec `auditStatus: review` ;
- 0 carte `pending` dans cette bibliothèque ;
- 21 catégories conservées ;
- identifiants historiques préservés ;
- aucun identifiant supprimé réutilisé.

## Répartition finale

- Facile : 281
- Moyen : 233
- Difficile : 130

## Contrôles attendus

- JSON analysable ;
- identifiants uniques ;
- catégories valides ;
- prompts non vides ;
- statuts d’audit valides ;
- cartes `review` absentes des parties normales mais disponibles dans l’Audit ;
- migration depuis `2026.06.19-1` ;
- conservation des cartes personnelles et des suppressions locales antérieures.

## Doublons techniques retirés

- `mime-322` doublonnait `mime-093` après simplification en « Chanter au karaoké ».
- `mime-923` doublonnait `mime-902` après simplification en « Jouer du piano ».

Les formulations originales étaient distinctes, mais les corrections directes les ont rendues identiques. Les versions déjà existantes ont été conservées.
