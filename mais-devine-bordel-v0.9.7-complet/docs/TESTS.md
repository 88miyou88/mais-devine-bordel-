# Tests — V0.9.7

## Commandes

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

## Bibliothèques attendues

- Maestro : 172 cartes ;
- Mime : 644 cartes, dont 636 approuvées et 8 à revoir ;
- Sans le dire : 360 cartes ;
- Dessin : 420 cartes ;
- Qui boit : 1 050 cartes ;
- total : 2 646 cartes.

## Contrôles principaux

Le validateur et le smoke test couvrent :

- JSON, identifiants, catégories, difficultés et doublons ;
- statuts et empreintes d’audit Mime ;
- version de bibliothèque Mime `2026.06.20-audit-1` ;
- cache `mdb-v0-9-7` ;
- migration depuis l’ancienne bibliothèque de 1 000 mimes ;
- application des suppressions officielles ;
- conservation des cartes personnelles et modifications locales ;
- exclusion des 8 cartes Mime à revoir des parties normales ;
- barème facile = 1, moyen = 2, difficile = 3 ;
- annulation exacte des points avec Retour ;
- suivi des affichages, réussites, passages et expirations ;
- intégration des statistiques aux rapports et sauvegardes ;
- filtres de difficultés dans Pause ;
- lot « Nouvelles cartes à auditer » ;
- export/import complet de l’état d’audit ;
- sauvegardes, modules ES, imports et absence de cycles ;
- multijoueur, Dessin et historique des cartes.

## Vérifications manuelles recommandées

1. ouvrir `?v=097` ;
2. vérifier `Version : 0.9.7` et `mdb-v0-9-7` ;
3. lancer une partie avec les trois difficultés puis désactiver Difficile dans Pause ;
4. confirmer que la carte difficile courante est remplacée sans modifier le score ;
5. réussir une carte facile, moyenne puis difficile et vérifier 1, 2 puis 3 points ;
6. passer plusieurs cartes et télécharger le rapport d’audit et de parties ;
7. vérifier les compteurs `shownCount`, `validCount`, `passedCount` et `expiredCount` ;
8. ouvrir « Nouvelles cartes à auditer » ;
9. exporter l’état d’audit, l’importer dans un profil de test et vérifier la reprise ;
10. confirmer le rendu à 800 × 360, 915 × 412 et 1280 × 720.
