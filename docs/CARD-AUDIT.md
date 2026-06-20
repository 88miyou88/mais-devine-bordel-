# Audit des cartes — V0.9.7

## Accès

Accueil → Réglages → Paramètres avancés → **Auditer les cartes**.

## Fonctionnement

L’audit ne lance ni chrono, ni score, ni joueur, ni pénalité. Il permet de filtrer un mode par catégories et difficultés, puis de parcourir les cartes dans l’ordre de la bibliothèque. La session en cours est sauvegardée automatiquement.

Actions :

- **Neutre / suivante** : carte vue sans jugement fort ; elle devient jouable si elle était nouvelle ;
- **Excellente** : signal positif explicite ; elle devient jouable si elle était nouvelle ;
- **À revoir** : carte conservée mais masquée des parties normales ;
- **Corriger** : ouvre l’éditeur ; une correction vaut validation immédiate ;
- **Supprimer** : retrait immédiat de la bibliothèque locale et ajout au rapport ;
- **Retour** : annule la dernière décision, suppression ou correction.

Après une correction, la carte passe à `auditStatus: approved`. Camille peut ensuite la remettre explicitement « À revoir » si nécessaire.

## Cartes nouvelles

Une bibliothèque peut activer :

```json
{
  "auditPolicy": {
    "newCardsRequireAudit": true,
    "approvedStatuses": ["approved"],
    "hiddenStatuses": ["pending", "review"]
  }
}
```

Dans ce cas :

- `pending` : nouvelle carte, visible uniquement dans « Nouvelles cartes à auditer » ;
- `approved` : carte jouable ;
- `review` : carte masquée jusqu’à correction ou validation.

La vraie catégorie éditoriale de la carte n’est jamais remplacée par une fausse catégorie « nouvelles cartes ».

## Raccourcis

- `←` : retour ;
- `Espace` ou `→` : neutre et suivante ;
- `L` : excellente ;
- `R` : à revoir ;
- `M` : corriger ;
- `S` ou `Suppr` : supprimer ;
- `Échap` : quitter.

Les mêmes actions sont disponibles sous forme de boutons tactiles.

## Motifs facultatifs

Après « À revoir » ou « Supprimer », il est possible de choisir un motif propre au mode, d’écrire une précision libre ou de continuer avec « Je ne sais pas ».

Ces motifs servent à accélérer l’apprentissage éditorial, sans rendre le formulaire obligatoire.

## Exports

- **Télécharger le rapport d’audit et de parties** : décisions d’audit, corrections avant/après et statistiques de vraies parties ;
- **Exporter le JSON audité** : bibliothèque locale nettoyée avec corrections et statuts ;
- **Exporter l’état d’audit** : progression, cartes locales, suppressions, corrections et statistiques ;
- **Importer un état d’audit** : reprise sur un autre ordinateur.

Le rapport ne contient aucun prénom, score individuel, ciblage ou réponse personnelle.

## Persistance entre appareils

Deux niveaux sont distingués :

1. **registre officiel** : statuts et corrections intégrés au JSON, disponibles sur tous les appareils après publication ;
2. **état local en cours** : données du navigateur, transférables avec l’export/import d’état d’audit.

L’import est normalisé contre la bibliothèque officielle installée afin de ne pas réintroduire volontairement des cartes retirées par une version plus récente.

## Suppression locale et restauration

Une suppression est définitive sur l’appareil tant que la carte n’est pas restaurée. La liste de restauration est disponible dans l’écran de préparation de l’audit. La suppression globale pour tous les utilisateurs nécessite une mise à jour du JSON officiel.
