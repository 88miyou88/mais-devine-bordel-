# Rapports de cartes supprimées

## Objectif

Une personne peut supprimer pendant la partie une carte jugée mauvaise, incompréhensible, obsolète ou inadaptée. La carte disparaît de sa bibliothèque locale et le signalement reste disponible pour export.

## Parcours utilisateur

1. Révéler ou afficher la carte.
2. Toucher le bouton corbeille.
3. Confirmer la suppression.
4. Continuer immédiatement avec la carte suivante, sans point gagné ou perdu.
5. Ouvrir **Paramètres avancés** puis **Télécharger les cartes supprimées**.
6. Envoyer le fichier JSON à la personne qui maintient la bibliothèque.

Le journal peut être vidé après envoi. Vider le journal ne restaure pas les cartes sur le téléphone.

## Format exporté

```json
{
  "kind": "mdb-deleted-cards-report",
  "schemaVersion": 1,
  "appVersion": "0.9.6.1",
  "exportedAt": "2026-06-19T18:00:00.000Z",
  "privacy": "Aucun prénom de joueur ni contenu de partie n’est inclus.",
  "summary": {
    "uniqueCards": 1,
    "byMode": {
      "lyrics": 1,
      "mime": 0,
      "words": 0,
      "draw": 0,
      "drinking": 0
    }
  },
  "deletions": [
    {
      "key": "lyrics::identifiant-de-carte",
      "modeId": "lyrics",
      "modeName": "La suite, maestro !",
      "cardId": "identifiant-de-carte",
      "origin": "official",
      "source": "classic_game",
      "reason": "quality_rejection",
      "firstRemovedAt": "2026-06-19T17:59:00.000Z",
      "lastRemovedAt": "2026-06-19T17:59:00.000Z",
      "occurrences": 1,
      "libraryVersion": "...",
      "category": { "id": "...", "name": "..." },
      "card": { "id": "..." },
      "officialCard": { "id": "..." }
    }
  ]
}
```

## Confidentialité

Le service retire de la copie exportée les champs produits pendant une partie :

- `targetIds` ;
- `renderedPrompt` ;
- `modeId` ajouté temporairement à la carte ;
- indicateurs internes d’origine ou de modification locale.

Le rapport ne contient ni liste de joueurs, ni réponses, ni scores, ni historique de partie.

## Traitement lors d’une mise à jour officielle

Le mainteneur regroupe les rapports reçus par `modeId + cardId`, examine le contenu signalé, puis décide de :

- supprimer la carte officielle ;
- la réécrire en conservant son identifiant ;
- la reclasser ;
- ne rien modifier si le signalement n’est pas retenu.

La conservation de l’identifiant lors d’une réécriture permet aux installations existantes de recevoir correctement la nouvelle version de la carte.
