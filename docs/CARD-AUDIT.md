# Audit des cartes — V0.9.6

## Accès

Accueil → Réglages → Paramètres avancés → **Auditer les cartes**.

## Fonctionnement

L’audit ne lance ni chrono, ni score, ni joueur, ni pénalité. Il permet de filtrer un mode par catégories et difficultés, puis de parcourir les cartes dans l’ordre de la bibliothèque. La session en cours est sauvegardée automatiquement.

Actions :

- **Neutre / suivante** : la carte a été vue sans jugement fort ;
- **Excellente** : signal positif explicite ;
- **À revoir** : carte conservée mais signalée comme douteuse ou améliorable ;
- **Supprimer** : retrait immédiat de la bibliothèque locale et ajout au rapport ;
- **Retour** : annule la dernière décision, y compris une suppression.

Les motifs proposés après « À revoir » ou « Supprimer » sont facultatifs ; « Autre / je ne sais pas » permet de continuer sans diagnostic précis.

## Raccourcis

- `←` : retour ;
- `Espace` ou `→` : neutre et suivante ;
- `L` : excellente ;
- `R` : à revoir ;
- `S` ou `Suppr` : supprimer ;
- `Échap` : quitter.

Les mêmes actions sont disponibles sous forme de boutons tactiles, avec leur touche affichée.

## Exports

- **Télécharger le rapport d’audit** : cartes vues, neutres, excellentes, à revoir et supprimées, sans prénom ni résultat individuel ;
- **Exporter le JSON nettoyé** : copie de la bibliothèque officielle sans les cartes supprimées localement. Cette copie doit être vérifiée avant publication sur GitHub.

## Suppression locale et restauration

Une suppression est définitive sur l’appareil tant que la carte n’est pas restaurée. La liste de restauration est disponible dans l’écran de préparation de l’audit. La suppression globale pour tous les utilisateurs nécessite toujours une mise à jour du JSON officiel.
