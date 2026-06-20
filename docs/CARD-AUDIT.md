# Audit des cartes — V0.9.6.1

## Accès

Accueil → Réglages → Paramètres avancés → **Auditer les cartes**.

## Fonctionnement

L’audit ne lance ni chrono, ni score, ni joueur, ni pénalité. Il permet de filtrer un mode par catégories et difficultés, puis de parcourir les cartes dans l’ordre de la bibliothèque. La session en cours est sauvegardée automatiquement.

Actions :

- **Neutre / suivante** : la carte a été vue sans jugement fort ;
- **Excellente** : signal positif explicite ;
- **À revoir** : carte conservée mais signalée comme douteuse ou améliorable ;
- **Corriger** : ouvre l’éditeur de la carte courante ;
- **Supprimer** : retrait immédiat de la bibliothèque locale et ajout au rapport ;
- **Retour** : annule la dernière décision, suppression ou correction.

L’éditeur permet notamment de modifier le texte, le contexte, la catégorie et la difficulté. Chaque correction est enregistrée dans le rapport avec un état avant/après et le détail des champs modifiés.

Après « À revoir » ou « Supprimer », il est possible de :

- choisir un motif rapide propre au mode ;
- écrire une précision libre ;
- continuer avec « Je ne sais pas ».

Pour Maestro, les motifs comprennent désormais « Paroles fausses / à corriger » et « Pas assez de contexte ».

## Raccourcis

- `←` : retour ;
- `Espace` ou `→` : neutre et suivante ;
- `L` : excellente ;
- `R` : à revoir ;
- `M` : corriger ;
- `S` ou `Suppr` : supprimer ;
- `Échap` : quitter.

Les mêmes actions sont disponibles sous forme de boutons tactiles, avec leur touche affichée.

## Exports

- **Télécharger le rapport d’audit** : cartes vues, neutres, excellentes, à revoir, corrigées et supprimées, sans prénom ni résultat individuel ;
- **Exporter le JSON audité** : copie de la bibliothèque sans les cartes supprimées localement et avec les corrections locales actuelles.

Le rapport contient pour chaque correction un tableau `edits` avec les valeurs avant/après et les champs modifiés.

## Suppression locale et restauration

Une suppression est définitive sur l’appareil tant que la carte n’est pas restaurée. La liste de restauration est disponible dans l’écran de préparation de l’audit. La suppression globale pour tous les utilisateurs nécessite toujours une mise à jour du JSON officiel.
