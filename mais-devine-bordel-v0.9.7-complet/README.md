# Mais devine, bordel !

Application web mobile installable (PWA) regroupant cinq mini-jeux de soirée :

- La suite, maestro !
- Ferme-la et mime !
- Sans le dire !
- Picasso en PLS
- Qui boit, bordel ?

## Version

Version actuelle : **0.9.7**

La V0.9.7 applique l’audit intégral des 1 000 mimes et ajoute les fonctions préparées pendant cet audit :

- bibliothèque Mime nettoyée à **644 cartes officielles** ;
- 636 mimes validés et immédiatement jouables ;
- 8 mimes conservés avec le statut `review`, disponibles dans l’Audit mais masqués des parties ;
- 354 cartes supprimées par Camille pendant l’audit ;
- 223 corrections directes intégrées ;
- 2 doublons supplémentaires retirés lors du contrôle final ;
- points selon la difficulté dans les modes à réussite : facile = 1, moyen = 2, difficile = 3 ;
- suivi local des cartes réellement affichées, réussies, passées ou expirées pendant les parties ;
- intégration de ces statistiques dans le rapport d’audit ;
- filtres Facile / Moyen / Difficile modifiables pendant une partie depuis Pause ;
- lot spécial **Nouvelles cartes à auditer** ;
- cartes officielles `pending` ou `review` exclues des parties normales ;
- correction directe d’une carte en Audit = validation immédiate, sauf reclassement explicite en « À revoir » ;
- export/import complet de l’état d’audit pour changer d’ordinateur ;
- sauvegarde générale étendue aux statistiques de partie ;
- journal éditorial Mime et liste de candidates potentielles pour le mode Dessin.

## Bibliothèques

| Mode | Fichier | Cartes officielles |
|---|---|---:|
| La suite, maestro ! | `data/lyrics.json` | 172 |
| Ferme-la et mime ! | `data/mimes.json` | 644 |
| Sans le dire ! | `data/words.json` | 360 |
| Picasso en PLS | `data/drawings.json` | 420 |
| Qui boit, bordel ? | `data/drinking.json` | 1 050 |
| **Total** | | **2 646** |

Pour Mime, 8 des 644 cartes sont conservées uniquement pour révision et ne sont pas proposées en partie normale.

## Points selon la difficulté

Dans La suite, maestro !, Ferme-la et mime !, Sans le dire ! et Picasso en PLS :

- Facile : 1 point ;
- Moyen : 2 points ;
- Difficile : 3 points.

Une carte passée ou expirée rapporte 0 point. Le bouton Retour annule exactement les points du résultat annulé. Qui boit, bordel ? conserve son propre système de pénalités et n’utilise pas ce barème.

## Audit éditorial

Accès : **Réglages → Paramètres avancés → Auditer les cartes**.

Raccourcis :

- `←` : retour ;
- `Espace` ou `→` : neutre et suivante ;
- `L` : excellente ;
- `R` : à revoir ;
- `M` : corriger la carte ou sa difficulté ;
- `S` ou `Suppr` : supprimer ;
- `Échap` : quitter.

Le filtre **Nouvelles cartes à auditer** affiche uniquement les cartes officielles marquées `pending`.

Voir `docs/CARD-AUDIT.md` et `docs/editorial/`.

## Statistiques de parties

Chaque appareil conserve localement, par carte :

- nombre d’affichages réels ;
- réussites ;
- passages ;
- expirations ;
- temps cumulé lorsque le mode le permet.

Ces informations sont des signaux secondaires. Une carte passée une seule fois n’est pas automatiquement mauvaise : les taux doivent toujours être interprétés avec le nombre d’affichages.

Le rapport téléchargé depuis l’Audit regroupe désormais les décisions éditoriales et ces statistiques de partie.

## Difficultés actives pendant une partie

Le menu Pause permet d’activer ou de désactiver Facile, Moyen et Difficile pour la partie en cours.

Désactiver une difficulté :

- retire ses cartes encore en attente ;
- remplace la carte courante si elle appartient à cette difficulté ;
- ne modifie pas les cartes déjà jouées ni le score ;
- n’altère pas la difficulté éditoriale des cartes ;
- fonctionne en partie libre et multijoueur.

## Compatibilité et migrations

La migration Mime vers `2026.06.20-audit-1` :

- retire les cartes officielles supprimées par l’audit ;
- installe les 644 cartes conservées ;
- préserve les cartes personnelles ;
- préserve les cartes officielles réellement modifiées localement ;
- ne restaure pas les suppressions locales antérieures ;
- applique les statuts d’audit officiels.

Les décisions intégrées aux JSON sont récupérées sur un nouvel ordinateur. Pour déplacer un audit local encore non publié, utiliser **Exporter l’état d’audit** puis **Importer un état d’audit**.

## Publication

Application de référence :

`https://88miyou88.github.io/mais-devine-bordel-/`

URL de test :

`https://88miyou88.github.io/mais-devine-bordel-/?v=097`

Diagnostic attendu :

```text
Version : 0.9.7
Cache attendu : mdb-v0-9-7
```

## Développement local

Les modules ES doivent être servis par HTTP :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=097`

## Contrôles automatiques

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md`, `docs/TESTS.md`, `docs/CARD-AUDIT.md`, `docs/GAMEPLAY-FEEDBACK.md` et `docs/CARD-REMOVAL-REPORTS.md`.
