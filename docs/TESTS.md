# Tests — base V0.9.6

## Commandes

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

## Validation des bibliothèques

Résultat attendu :

- Paroles : 143 cartes ;
- Mime : 1 000 cartes ;
- Sans le dire : 360 cartes ;
- Dessin : 420 cartes ;
- Qui boit, bordel ? : 1 050 cartes ;
- total : 2 973 cartes.

Le validateur contrôle notamment :

- les identifiants uniques ;
- les catégories et difficultés ;
- les champs structurés du mode Qui boit ;
- les résolutions autorisées ;
- les 73 conditions personnelles correctement typées ;
- les alternatives et intensités ;
- les textes uniques et les principales erreurs d’élision.

## Smoke test

Il contrôle notamment :

- les 60 fichiers attendus ;
- la version `0.9.6` ;
- le cache `mdb-v0-9-6` ;
- les chemins HTML, CSS, JS, JSON et manifeste ;
- la syntaxe des modules ;
- les imports et l’absence de cycles ;
- les identifiants DOM ;
- les anciennes clés de stockage ;
- les planificateurs multijoueurs ;
- les filtres globaux et compteurs ;
- le calcul des pénalités ;
- les libellés visibles gorgées / Team soft ;
- la logique des interactions contextuelles sans boutons redondants ;
- le ciblage équilibré ;
- les règles temporaires ;
- la compatibilité des anciennes sauvegardes et le rejet d’une session Qui boit V0.9.0 incomplète ;
- la présence du profil compact téléphone paysage ;
- le bloc « Comment jouer ? » repliable ;
- la préservation d’une carte modifiée localement ;
- la migration automatique des anciennes bibliothèques Mime et Qui boit ;
- le retour exact des cartes préparées après un ou plusieurs clics sur Retour.

## Scénarios logiques vérifiés

- condition personnelle : droite = oui avec pénalité, gauche = non ;
- réponse ou boisson : droite = réponse, gauche = refus avec pénalité ;
- défi : droite = réussi, gauche = raté/refusé ;
- vote : sélection unique obligatoire avant validation ;
- condition collective : sélection multiple ;
- duel : sélection limitée aux deux participants ;
- tribunal : coupable ou non coupable ;
- règle temporaire : activation, rappel et oubli attribuable.

## Vérifications Android à effectuer

1. ouvrir la base de test avec `?v=096` ;
2. vérifier la version et le cache dans le diagnostic ;
3. tester un swipe gauche et droit sur chaque grande famille de carte ;
4. vérifier qu’un vote ne peut pas être validé sans personne sélectionnée ;
5. vérifier qu’une condition collective permet plusieurs sélections ;
6. vérifier qu’une cible automatique n’affiche pas tous les joueurs ;
7. vérifier les formulations gorgées et Team soft ;
8. activer une règle, vérifier son rappel dans la carte puis tester « Oubli de règle » ;
9. vérifier que Retour est intégré dans la carte et que les anciens boutons de résolution ont disparu ;
10. vérifier la fin manuelle, la reprise et les résultats finaux.

L’environnement automatisé de cette génération a validé le code et les scénarios purs, mais les gestes tactiles réels, vibrations, plein écran et orientation restent à confirmer sur Android.

## Vérifications navigateur V0.9.4

L’application réelle, ses feuilles de style finales, son graphe de modules ES et les cinq JSON ont été chargés dans Chromium aux formats :

- 800 × 360 ;
- 915 × 412 ;
- 800 × 450 ;
- 1024 × 600, comme format tablette paysage ;
- 1280 × 720.

Les contrôles navigateur vérifient notamment :

- la cible tactile de sélection de mode à 44 × 44 px ;
- la séparation entre sélection et ouverture de configuration, à la souris et au clavier ;
- l’exclusivité de Qui boit et la désactivation du multijoueur classique ;
- l’absence de débordement global sur tous les formats ;
- une carte classique occupant environ 98 % du viewport compact ;
- le HUD et les commandes classiques superposés dans la carte ;
- le swipe gauche/droite, Retour, Pause, Retourner et Terminer ;
- l’absence de changement de carte après un simple toucher ;
- une carte Qui boit occupant environ 98 % du viewport compact, sans cadre extérieur ;
- un montage extrême à 800 × 360 avec douze joueurs, trois règles longues et une question longue ;
- le tap court sur un joueur, le swipe commencé sur un joueur ou une règle et l’exclusion des vrais boutons ;
- l’absence d’erreur JavaScript dans la console.

Le navigateur disponible dans l’environnement interdit les navigations HTTP par une politique d’administration. Le serveur local a donc été vérifié séparément, puis Chromium a chargé exactement les mêmes fichiers dans un harnais local sans réécriture du code applicatif. Le comportement final via HTTP et le tactile physique restent à confirmer sur Android.


## Contrôles spécifiques V0.9.4

Le smoke test vérifie aussi :

- la zone tactile de sélection de mode et sa taille minimale de 44 px ;
- la séparation entre sélection et ouverture de configuration ;
- le HUD classique superposé sous le profil paysage compact ;
- la progression Qui boit présente dans la carte ;
- l’absence de troncature et de défilement horizontal des règles ;
- le libellé accessible « Signaler un oubli de règle » ;
- l’autorisation du swipe depuis `[data-swipe-tap]` avec suppression du clic après glissement ;
- l’exclusion persistante des vrais boutons d’action.


## Contrôles spécifiques de suppression

Le smoke test vérifie également :

- la présence du service `card-removals.js` et des commandes dans les cinq modes ;
- une cible tactile minimale de 44 × 44 px ;
- la suppression fonctionnelle d’une carte officielle dans une bibliothèque en mémoire ;
- l’ajout de son identifiant à `deletedOfficialCardIds` ;
- la déduplication et la confidentialité du rapport ;
- l’absence des champs dynamiques `targetIds` et `renderedPrompt` ;
- la présence du journal dans une sauvegarde de schéma 7 ;
- la compatibilité des sauvegardes antérieures ;
- le retrait de la carte des files actives sans modification de score ;
- la restitution de la carte suivante prévue lorsqu’un résultat est annulé ;
- la restitution de plusieurs cartes dans leur ordre initial après plusieurs retours successifs.

À confirmer sur Android : confort du bouton, dialogue de confirmation, téléchargement réel du JSON depuis Chrome/PWA et comportement après fermeture puis relance de l’application.

## Régression V0.9.5.1

Le smoke test reconstruit aussi l’état défectueux observé sur téléphone :

- 395 cartes Mime présentes ;
- version locale déjà indiquée comme `2026.06.19-1` ;
- 605 nouveautés et nouvelles catégories marquées à tort comme supprimées.

Le test vérifie que le chargement restaure 1 000 cartes, 21 catégories, sélectionne les nouvelles catégories et retire les faux marqueurs de suppression. Il vérifie également la présence du libellé visible `Suppr.` sur les boutons de suppression des modes classiques et de Qui boit.


## Régression V0.9.6 — Audit et Maestro

Les contrôles couvrent :

- les 198 cartes Maestro et leurs 9 catégories ;
- le champ `context` sur toutes les cartes ;
- la migration depuis `2026.06.15-3` ;
- la conservation d’une carte Maestro modifiée localement ;
- la non-restauration d’une carte supprimée localement ;
- la présence du mode Audit, de ses raccourcis et de ses boutons tactiles ;
- la création, la reprise et l’achèvement d’une session d’audit ;
- les statuts neutre, excellente, à revoir et supprimée ;
- l’annulation et la restauration d’une suppression ;
- l’absence de données privées dans le rapport ;
- l’intégration de l’audit dans les sauvegardes de schéma 8 ;
- le rendu à 800 × 360, 915 × 412 et 1280 × 720.
