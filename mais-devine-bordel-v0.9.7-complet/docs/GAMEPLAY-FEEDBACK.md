# Retours de parties sur les cartes — V0.9.7

## Objectif

Les décisions d’audit donnent un jugement éditorial direct. Les vraies parties apportent un second niveau d’information : une carte peut sembler correcte à la lecture mais être systématiquement passée, ratée ou trop lente en jeu.

Ces données restent des **signaux secondaires**, jamais des verdicts automatiques.

## Données conservées

Pour chaque carte réellement affichée :

- `shownCount` : nombre d’affichages ;
- `validCount` : réussites ;
- `passedCount` : passages volontaires ;
- `expiredCount` : fins de chrono ;
- `totalUsedMs` : temps cumulé lorsque disponible ;
- difficulté observée ;
- version de bibliothèque.

## Interprétation

Exemples :

- 1 passage sur 1 affichage : information trop faible ;
- 1 passage sur 100 affichages : incident isolé ;
- 40 passages sur 50 affichages : carte probablement problématique ;
- beaucoup de réussites rapides : carte jouable, mais pas nécessairement excellente ;
- beaucoup d’expirations sur une carte facile : difficulté ou formulation à revoir.

Les taux doivent toujours être lus avec le nombre d’affichages.

## Confidentialité

Aucun prénom, score individuel, joueur ciblé, réponse personnelle ou ordre complet de partie n’est exporté.

## Export

Le bouton **Télécharger le rapport d’audit et de parties** produit un fichier unique contenant :

- décisions d’audit ;
- corrections ;
- suppressions ;
- résumé des parties ;
- statistiques par carte ;
- cartes jouées qui n’ont pas encore été auditées.

## Sauvegarde

Les statistiques sont stockées localement sous `mdb-card-gameplay-v1` et intégrées aux sauvegardes générales V9 ainsi qu’aux exports d’état d’audit.
