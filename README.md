# Mais devine, bordel !

Application web mobile installable (PWA) regroupant cinq mini-jeux de soirée :

- La suite, maestro !
- Ferme-la et mime !
- Sans le dire !
- Picasso en PLS
- Qui boit, bordel ?

## Version

Version actuelle : **0.9.6.1**

La V0.9.6.1 consolide la V0.9.6 et ajoute :

- le mode **Audit des cartes** accessible depuis Paramètres avancés ;
- choix du mode, des catégories, des difficultés et du type de cartes à revoir ;
- navigation sans chrono, score, joueurs ni pénalités ;
- reprise automatique à la dernière carte ;
- statuts Vue, Neutre, Excellente, À revoir et Supprimée ;
- raccourcis clavier et boutons tactiles équivalents ;
- motifs rapides et précision libre facultative adaptés à chaque mode ;
- correction directe d’une carte depuis l’audit, avec journal avant/après ;
- changement direct de catégorie et de difficulté via le même éditeur ;
- annulation de la dernière décision, y compris une suppression ;
- restauration des cartes supprimées localement ;
- export d’un rapport complet et d’un JSON audité intégrant les corrections locales ;
- intégration de l’audit aux sauvegardes générales ;
- application de l’audit Maestro : 26 cartes retirées, 6 corrigées et 18 conservées à revoir ;
- bibliothèque Maestro active à 172 cartes ;
- suppression des répétitions de pénalité dans les conditions collectives de Qui boit ;
- corbeille Qui boit compacte, placée après « Fin » ;
- prise en charge du champ facultatif `context` dans le jeu, l’audit et le gestionnaire.

La suppression directe en partie, l’historique corrigé, les 1 000 mimes et les 1 050 cartes Qui boit restent présents.

## Bibliothèques

| Mode | Fichier | Cartes |
|---|---|---:|
| La suite, maestro ! | `data/lyrics.json` | 172 |
| Ferme-la et mime ! | `data/mimes.json` | 1 000 |
| Sans le dire ! | `data/words.json` | 360 |
| Picasso en PLS | `data/drawings.json` | 420 |
| Qui boit, bordel ? | `data/drinking.json` | 1 050 |
| **Total** | | **3 002** |

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

Voir `docs/CARD-AUDIT.md` et `docs/editorial/`.

## Compatibilité

La migration vers la bibliothèque Maestro issue de l’audit :

- retire les anciennes cartes officielles supprimées lors de l’audit ;
- conserve les 172 cartes actives ;
- actualise les cartes officielles non modifiées ;
- conserve les cartes et catégories personnelles ;
- conserve les cartes officielles modifiées localement ;
- ne restaure pas les cartes supprimées localement.

Le champ `context` est désormais conservé lors de la normalisation, de l’édition, de l’import, de l’export et des sauvegardes.

## Publication

Application de référence :

`https://88miyou88.github.io/mais-devine-bordel-/`

URL de test :

`https://88miyou88.github.io/mais-devine-bordel-/?v=0961`

Diagnostic attendu :

```text
Version : 0.9.6.1
Cache attendu : mdb-v0-9-6-1
```

## Développement local

Les modules ES doivent être servis par HTTP :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=0961`

## Contrôles automatiques

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md`, `docs/TESTS.md`, `docs/CARD-AUDIT.md` et `docs/CARD-REMOVAL-REPORTS.md`.
