# Mais devine, bordel !

Application web mobile installable (PWA) regroupant cinq mini-jeux de soirée :

- La suite, maestro !
- Ferme-la et mime !
- Sans le dire !
- Picasso en PLS
- Qui boit, bordel ?

## Version

Version actuelle : **0.9.6**

La V0.9.6 ajoute :

- un mode **Audit des cartes** accessible depuis Paramètres avancés ;
- choix du mode, des catégories, des difficultés et du type de cartes à revoir ;
- navigation sans chrono, score, joueurs ni pénalités ;
- reprise automatique à la dernière carte ;
- statuts Vue, Neutre, Excellente, À revoir et Supprimée ;
- raccourcis clavier et boutons tactiles équivalents ;
- motifs facultatifs adaptés à chaque mode ;
- annulation de la dernière décision, y compris une suppression ;
- restauration des cartes supprimées localement ;
- export d’un rapport complet et d’un JSON officiel nettoyé ;
- intégration de l’audit aux sauvegardes générales ;
- intégration de la bibliothèque Maestro révisée à 198 cartes ;
- prise en charge du champ facultatif `context` dans le jeu, l’audit et le gestionnaire.

La suppression directe en partie, l’historique corrigé, les 1 000 mimes et les 1 050 cartes Qui boit restent présents.

## Bibliothèques

| Mode | Fichier | Cartes |
|---|---|---:|
| La suite, maestro ! | `data/lyrics.json` | 198 |
| Ferme-la et mime ! | `data/mimes.json` | 1 000 |
| Sans le dire ! | `data/words.json` | 360 |
| Picasso en PLS | `data/drawings.json` | 420 |
| Qui boit, bordel ? | `data/drinking.json` | 1 050 |
| **Total** | | **3 028** |

## Audit éditorial

Accès : **Réglages → Paramètres avancés → Auditer les cartes**.

Raccourcis :

- `←` : retour ;
- `Espace` ou `→` : neutre et suivante ;
- `L` : excellente ;
- `R` : à revoir ;
- `S` ou `Suppr` : supprimer ;
- `Échap` : quitter.

Voir `docs/CARD-AUDIT.md` et `docs/editorial/`.

## Compatibilité

La migration vers la nouvelle bibliothèque Maestro :

- ajoute les 55 nouvelles cartes ;
- actualise les cartes officielles non modifiées ;
- conserve les cartes et catégories personnelles ;
- conserve les cartes officielles modifiées localement ;
- ne restaure pas les cartes supprimées localement.

Le champ `context` est désormais conservé lors de la normalisation, de l’édition, de l’import, de l’export et des sauvegardes.

## Publication

Application de référence :

`https://88miyou88.github.io/mais-devine-bordel-/`

URL de test :

`https://88miyou88.github.io/mais-devine-bordel-/?v=096`

Diagnostic attendu :

```text
Version : 0.9.6
Cache attendu : mdb-v0-9-6
```

## Développement local

Les modules ES doivent être servis par HTTP :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=096`

## Contrôles automatiques

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md`, `docs/TESTS.md`, `docs/CARD-AUDIT.md` et `docs/CARD-REMOVAL-REPORTS.md`.
