# PROMPT COMPLET — AUDIT, RÉVISION ET EXTENSION DE « LA SUITE, MAESTRO ! »

Je développe une application web/PWA appelée « Mais devine, bordel ! ». Le mode concerné s’appelle « La suite, maestro ! ».

Je fournis :

- le ZIP complet de l’application ;
- le fichier `data/lyrics.json` ;
- le rapport `docs/MAESTRO_EDITORIAL_GUIDE.md` ;
- éventuellement un journal des validations humaines.

## Mission

Auditer, corriger et éventuellement enrichir la bibliothèque de chansons sans perdre les décisions éditoriales déjà prises.

Le ZIP et le JSON fourni sont les seules sources de vérité pour :

- la structure technique ;
- les identifiants ;
- les catégories ;
- les difficultés ;
- les propriétés utilisées par le moteur ;
- les chansons déjà présentes.

Lis entièrement les fichiers avant toute proposition.

## Première action obligatoire

1. Extraire le ZIP.
2. Lire `README.md`, `docs/ARCHITECTURE.md` et `docs/TESTS.md`.
3. Lire intégralement `data/lyrics.json`.
4. Vérifier comment `prompt`, `answer`, `context`, `title`, `source` et `difficulty` sont chargés et affichés.
5. Recalculer le nombre de cartes par catégorie et difficulté.
6. Repérer les titres dupliqués et les chansons possédant plusieurs cartes.
7. Exécuter les tests existants.
8. Présenter une synthèse technique avant de modifier les données.

## Principe fondamental du jeu

Une personne chante la partie `prompt`. Les autres doivent continuer avec la partie `answer`.

La carte est bonne si une personne connaissant normalement la chanson peut retrouver spontanément une seule suite précise.

Le jeu ne doit pas tester une connaissance encyclopédique des couplets. Il doit provoquer une réponse immédiate.

## Règles éditoriales obligatoires

### 1. Priorité des passages

Choisir dans cet ordre :

1. refrain très connu ;
2. phrase culte ;
3. ouverture iconique ;
4. couplet seulement s’il est particulièrement reconnaissable.

Ne pas conserver un passage secondaire lorsque le refrain fournit une meilleure carte.

### 2. Coupure

Privilégier une coupure au milieu d’un vers connu :

- `prompt` = début du vers ;
- `answer` = fin du même vers.

La coupure doit être naturelle musicalement et grammaticalement.

Elle ne doit pas :

- arriver avant que l’air soit identifiable ;
- laisser plusieurs continuations possibles ;
- révéler presque toute la réponse ;
- produire une réponse arbitraire d’un seul mot inconnu.

### 3. Contexte gris

La propriété facultative `context` sert uniquement à aider à retrouver l’air.

L’utiliser lorsque :

- le prompt est trop court ou générique ;
- la chanson peut être confondue avec une autre ;
- le passage commence au milieu du refrain ;
- la phrase précédente déclenche immédiatement la mélodie.

Ne pas l’utiliser systématiquement.

Le contexte ne doit pas :

- contenir la réponse ;
- être nécessaire pour comprendre la grammaire de la phrase ;
- brouiller la mélodie ;
- rallonger artificiellement la carte.

### 4. Ambiguïtés

Refuser ou recouper la carte si :

- la même amorce apparaît plusieurs fois avec des suites différentes ;
- plusieurs paroles peuvent logiquement suivre ;
- la carte demande de connaître l’ordre exact de couplets similaires ;
- la réponse proposée n’est pas celle que la majorité chanterait spontanément.

### 5. Chansons existantes

Ne pas supprimer une chanson parce que son passage actuel est mauvais.

Pour une carte existante :

- conserver son ID ;
- conserver la chanson ;
- chercher un meilleur passage de la même chanson ;
- modifier seulement `context`, `prompt`, `answer`, `difficulty` ou la catégorie si nécessaire.

Ne jamais attribuer un nouvel ID à une chanson existante par erreur.

### 6. Nouvelles chansons

Avant toute proposition :

- vérifier le titre et l’artiste dans le JSON ;
- signaler clairement `NOUVELLE` ou `EXISTANTE À RÉVISER` ;
- proposer une carte complète ;
- ne jamais fournir seulement une liste de titres.

Les nouvelles propositions doivent être francophones, très connues, intergénérationnelles, populaires en soirée, au karaoké ou durablement présentes dans les classements.

Ne plus proposer de nouvelles chansons anglaises.

### 7. Chansons anglaises

- conserver les cartes anglaises existantes ou déjà validées ;
- classer toutes les cartes anglaises en difficulté `hard` ;
- ne proposer aucun nouveau titre anglais ;
- privilégier uniquement les passages mondialement connus pour les cartes conservées.

### 8. Plusieurs cartes d’une même chanson

Autorisé uniquement si la chanson possède plusieurs passages cultes réellement différents.

Chaque carte doit :

- avoir un ID unique ;
- utiliser un passage distinct ;
- offrir une expérience différente ;
- ne pas être une variante cosmétique.

### 9. Difficultés

`easy` : refrain massif, coupure évidente, réponse immédiate.

`medium` : passage populaire mais demandant davantage de mémoire, réponse plus longue ou contexte utile.

`hard` : toutes les chansons anglaises, ou chanson francophone moins connue/ancienne mais toujours jouable.

Une carte difficile ne doit jamais être obscure ou ambiguë.

## Présentation obligatoire avant intégration

Présenter les cartes par lots avec le format suivant :

### ID ou identifiant provisoire — Titre — Artiste

- Statut : EXISTANTE À RÉVISER / NOUVELLE
- Contexte gris : texte complet ou `aucun`
- À chanter : **prompt complet**
- Suite attendue : **answer complète**
- Catégorie : catégorie existante
- Difficulté : Facile / Moyen / Difficile
- Pourquoi ce passage fonctionne : justification précise
- Décision humaine : À DÉCIDER

Ne jamais écrire :

- « ajouter le vers précédent » ;
- « choisir un meilleur refrain » ;
- « passage à compléter » ;
- « paroles à fournir ».

Toute carte soumise à validation doit être complète.

## Validation humaine

Ne rien intégrer définitivement avant validation humaine.

Interprétation des retours :

- `ok` = intégrer exactement ;
- `ok avec modification` = intégrer uniquement la version corrigée par l’utilisatrice ;
- `non` = ne pas intégrer ce passage, mais conserver la chanson si elle existe ;
- `mouais` = non validé, rechercher mieux ;
- correction de quelques mots = considérer la nouvelle formulation comme référence.

Conserver un journal de chaque décision et de sa raison.

## Livrables finaux

1. `data/lyrics.json` complet et valide.
2. Tous les IDs historiques préservés.
3. Nouveaux IDs uniques et continus.
4. Propriété `context` conservée.
5. Rapport des cartes modifiées et ajoutées.
6. Rapport des cartes refusées ou restant à revoir.
7. Rapport éditorial complet expliquant les bonnes et mauvaises cartes.
8. Tests de validation du JSON.
9. ZIP prêt à intégrer.

## Contrôles finaux

Vérifier :

- JSON valide ;
- IDs uniques ;
- aucune carte vide ;
- catégories existantes ;
- difficultés valides ;
- toutes les cartes anglaises en `hard` ;
- aucun doublon involontaire ;
- aucune suite manifestement ambiguë ;
- contexte absent ou utile ;
- rendu correct sur téléphone ;
- conservation du champ `context` dans le moteur, l’éditeur, l’import et l’export.

Le rapport éditorial fourni est contraignant : ne pas repartir de zéro et ne pas ignorer les validations humaines antérieures.
