# Guide éditorial — Ferme-la et mime !

## But de ce fichier

Ce document constitue la mémoire éditoriale du mode **« Ferme-la et mime ! »**. Il doit être joint au JSON du mode dans toute conversation future consacrée à la création, à l’audit ou à la réécriture des mimes.

Il synthétise les règles réellement déduites de l’audit complet de 1 000 cartes réalisé par Camille le 20 juin 2026. Il ne remplace pas le journal détaillé des décisions : il en extrait les tendances utilisables pour juger de nouvelles propositions.

## Résultat de l’audit

- 1 000 cartes vues ;
- 210 cartes jugées excellentes ;
- 428 cartes conservées comme neutres et fonctionnelles ;
- 8 cartes laissées à revoir ;
- 354 cartes supprimées ;
- 223 cartes corrigées directement ;
- 644 cartes conservées dans la bibliothèque officielle ;
- 636 cartes immédiatement jouables ;
- 8 cartes masquées jusqu’à révision.
- 2 doublons supplémentaires détectés et retirés lors de la validation technique finale.

## Principe central

Le mode se joue vite, généralement pendant une manche d’environ 60 secondes. Une carte n’est pas bonne parce qu’elle décrit une scène imaginative : elle est bonne si un joueur peut comprendre immédiatement **quoi faire avec son corps** et si les autres peuvent identifier une réponse suffisamment précise.

La priorité est donc :

1. geste immédiatement disponible ;
2. réponse devinable ;
3. formulation courte ;
4. rythme de jeu ;
5. potentiel amusant.

## Ce qui caractérise une excellente carte

Les cartes excellentes sont nettement plus courtes : longueur moyenne de **24,9 caractères**, contre **43,3** pour les cartes supprimées.

Elles reposent souvent sur :

- un animal à silhouette ou comportement iconique ;
- un métier associé à un geste évident ;
- un sport dont le mouvement est immédiatement reconnaissable ;
- une action quotidienne universelle ;
- un objet manipulé de façon claire ;
- une action unique plutôt qu’une histoire complète.

Exemples positifs issus de l’audit :

- `mime-001` — Un éléphant
- `mime-002` — Un singe
- `mime-003` — Un kangourou
- `mime-036` — Un médecin
- `mime-037` — Un pompier
- `mime-038` — Un policier
- `mime-071` — Jouer au football
- `mime-072` — Jouer au tennis
- `mime-073` — Faire du vélo
- `mime-106` — Se brosser les dents
- `mime-107` — Prendre une douche
- `mime-108` — Se maquiller
- `mime-211` — Utiliser un téléphone
- `mime-212` — Utiliser un fer à repasser
- `mime-213` — Utiliser un marteau-piqueur

## Ce qui caractérise une carte simplement fonctionnelle

Une carte neutre n’est pas mauvaise. Elle peut être moins drôle ou moins immédiate qu’une carte excellente, mais elle reste :

- compréhensible ;
- faisable sans accessoire ;
- suffisamment distincte ;
- devinable dans un temps raisonnable ;
- compatible avec le rythme du jeu.

L’absence de mention « excellente » ne doit jamais être interprétée comme un rejet.

## Défauts les plus fréquents

| Motif | Nombre de cartes |
|---|---:|
| Trop difficile à mimer | 95 |
| Trop abstrait | 84 |
| Trop long ou complexe | 63 |
| Doublon ou trop similaire | 49 |
| Trop difficile à deviner | 49 |
| Peu amusant | 15 |
| Nécessite un objet | 5 |
| Autre motif | 2 |

### 1. Trop difficile à mimer

La consigne exige souvent de représenter un objet absent, une autre personne, une relation spatiale complexe ou un résultat invisible.

Une action peut être visuelle sur le papier tout en étant peu traduisible corporellement.

### 2. Trop abstrait

Les intentions, pensées, concepts, relations de cause à effet et états invisibles sont à éviter. Le joueur ne doit pas être obligé de transformer le mime en charade.

### 3. Trop long ou complexe

Les cartes qui additionnent plusieurs événements ralentissent la manche. Une bonne correction consiste souvent à conserver uniquement le noyau gestuel.

L’audit confirme cette tendance : les 154 formulations corrigées sont passées en moyenne de **43,1** à **33,8 caractères**.

### 4. Doublon ou variante superficielle

Une précision supplémentaire ne suffit pas à créer une nouvelle carte lorsque le geste reste identique. Il faut comparer les cartes par **gestuelle produite**, pas seulement par texte.

### 5. Trop difficile à deviner

La personne qui mime peut parfois exécuter l’action, mais les observateurs ne peuvent pas atteindre la réponse précise attendue. Une carte doit tolérer les formulations naturelles sans exiger un détail invisible.

### 6. Peu amusant

Une carte peut être techniquement faisable tout en étant plate, passive ou sans intérêt visuel. Ce motif reste secondaire par rapport à la jouabilité, mais il compte.

### 7. Nécessite un objet

Les objets imaginaires simples sont acceptables lorsqu’ils correspondent à un geste universel. Ils deviennent problématiques lorsque l’identité de l’objet est indispensable mais impossible à faire comprendre.

## Exemples négatifs représentatifs

Ces cartes ont été supprimées non parce qu’elles étaient imaginatives, mais parce que le mime ne permettait pas d’atteindre facilement la réponse exacte.

### Trop difficiles à mimer

- `mime-095` — « Courir un marathon complètement épuisé » : le geste montre surtout courir ou être fatigué ; le marathon reste invisible.
- `mime-104` — « Un joueur de tennis qui envoie la balle dans le filet » : le tennis est mimable, mais le filet et l’échec précis le sont beaucoup moins.
- `mime-167` — « Recevoir un cadeau affreux et faire semblant d’être content » : trop d’intention invisible et plusieurs étapes.
- `mime-181` — « Barbie » : personnage reconnaissable visuellement, mais sans geste suffisamment distinctif.

### Trop abstraites

- `mime-136` — « Chercher son téléphone alors qu’on l’a dans la main » : le contraste essentiel est difficile à faire comprendre sans parole.
- `mime-149` — « Réaliser qu’on a raté son arrêt et paniquer » : le lieu, l’arrêt et la prise de conscience sont invisibles.
- `mime-165` — « Cacher un objet cassé puis faire semblant d’être innocent » : repose sur une histoire et une intention.
- `mime-166` — « Arriver devant une porte et réaliser qu’on a oublié ses clés » : la cause exacte de la réaction n’est pas devinable.

### Trop longues ou complexes

- `mime-154` — « Faire tomber son plateau, se cacher le visage et tout ramasser en vitesse » : trois actions successives.
- `mime-160` — « Coincer sa manche dans une poignée, tirer discrètement puis se débattre » : trop de détails et d’étapes.
- `mime-383` — « Envoyer un message puis essayer frénétiquement de l’effacer » : téléphone et suppression sont difficiles à distinguer.
- `mime-385` — « Faire coucou à quelqu’un qui saluait la personne derrière » : le malentendu dépend de personnes invisibles.

### Faisables mais trop difficiles à deviner

- `mime-062` — « Un archéologue qui découvre un trésor » : peut ressembler à chercher, creuser ou trouver n’importe quel objet.
- `mime-065` — « Un présentateur météo en pleine tempête » : plusieurs réponses concurrentes restent plausibles.
- `mime-140` — « Ouvrir un sac-poubelle qui se déchire » : le sac et sa matière sont difficiles à identifier.
- `mime-179` — « Elsa dans La Reine des Neiges » : le pouvoir de glace peut être mimé, mais pas forcément le personnage exact.

## Ce que révèlent les corrections directes

Camille a corrigé 223 cartes, dont 154 formulations. La stratégie dominante n’a pas été d’ajouter des explications, mais de retirer les détails invisibles ou superflus.

Exemples :

| Avant | Après | Enseignement |
|---|---|---|
| Faire du trampoline et manquer de tomber à chaque saut | Faire du trampoline | garder l’action identifiable |
| Faire du yoga sans réussir à tenir l’équilibre | Faire du yoga | supprimer la mini-catastrophe |
| Un chien qui se secoue après son bain | Un chien qui se secoue | retirer une cause impossible à voir |
| Un serveur qui renverse une boisson sur un client | Un serveur qui renverse une boisson | ne pas imposer un second personnage |
| Lancer une boule de bowling dans la rigole | Lancer une boule de bowling | supprimer le résultat trop précis |
| Ramasser ses pièces au sol pendant que la file avance | Ramasser ses pièces au sol | enlever le contexte invisible |
| Regarder un film d’horreur en se cachant derrière un coussin | Regarder un film d’horreur | conserver le noyau gestuel |
| Faire une marche arrière en regardant derrière soi | Faire une marche arrière | ne pas écrire la chorégraphie |

Deux corrections ont créé des doublons exacts lors du contrôle final :

- `mime-322` est devenu identique à `mime-093` — « Chanter au karaoké » ;
- `mime-923` est devenu identique à `mime-902` — « Jouer du piano ».

Elles ont été retirées techniquement. Cela confirme qu’après simplification, il faut refaire une vérification de doublons par texte **et par gestuelle**.

## Règles de formulation

- Une seule action principale.
- Supprimer les conséquences et précisions non indispensables.
- Utiliser une formulation naturelle et directe.
- Éviter les propositions subordonnées en cascade.
- Ne pas écrire la chorégraphie complète.
- Ne pas imposer un résultat trop précis si le geste ne permet pas de le distinguer.
- Ne pas ajouter « complètement », « beaucoup trop », « pendant que », « sans réussir à » ou une mini-catastrophe si cela ne crée pas un geste différent.
- Préférer « Faire du trampoline » à une longue description de l’échec autour du trampoline.
- Préférer « Un chien qui se secoue » à une cause précise que les autres ne peuvent pas voir.

## Test de validation d’une nouvelle carte

Avant d’ajouter une carte, répondre oui aux questions suivantes :

1. Le joueur comprend-il la consigne en moins de trois secondes ?
2. Peut-il commencer par un geste évident ?
3. La réponse est-elle identifiable sans parole ?
4. La carte fonctionne-t-elle sans matériel ?
5. La réponse attendue correspond-elle réellement à ce que les gestes permettent de comprendre ?
6. La carte produit-elle une gestuelle différente des cartes existantes ?
7. Peut-elle être jouée dans une petite pièce sans danger ?
8. Sa formulation peut-elle être raccourcie sans perdre l’idée ?
9. Reste-t-elle amusante ou satisfaisante à jouer ?

## Difficulté

L’audit a entraîné 117 changements de difficulté :

- medium → hard : 60 cartes
- easy → medium : 33 cartes
- easy → hard : 15 cartes
- hard → medium : 6 cartes
- medium → easy : 2 cartes
- hard → easy : 1 cartes

### Facile

- geste universel ;
- réponse courte ;
- silhouette ou mouvement iconique ;
- très peu d’ambiguïté.

### Moyen

- plusieurs indices corporels simples ;
- petite mise en situation ;
- réponse moins immédiate mais encore claire.

### Difficile

- construction gestuelle plus précise ;
- distinction avec une réponse proche ;
- plusieurs étapes utiles, sans devenir une mini-histoire.

Une carte impossible, abstraite ou arbitraire ne devient pas bonne en étant classée difficile.

## Catégories

Les catégories les plus efficaces sont notamment :

- Sports et loisirs : 68 % de cartes excellentes, 8 % supprimées ;
- Actions du quotidien : 58 % excellentes, 14 % supprimées ;
- Animaux : 38 % excellentes, 4 % supprimées ;
- Objets et machines : 38 % excellentes, 22 % supprimées.

Les catégories les plus fragiles sont :

- Situations absurdes : 76 % supprimées ;
- Situations gênantes et catastrophes : 66 % supprimées ;
- Magasins et lieux publics : 59 % supprimées ;
- École, travail et réunions : 56 % supprimées.

Cela ne signifie pas qu’il faut interdire ces catégories. Elles exigent simplement un filtre beaucoup plus sévère : une scène drôle ou visuelle n’est pas forcément mimable rapidement.

### Tableau complet par catégorie

| Catégorie | Total | Excellentes | Neutres | À revoir | Supprimées | Taux de suppression |
|---|---:|---:|---:|---:|---:|---:|
| Actions du quotidien | 50 | 29 | 14 | 0 | 7 | 14% |
| Animaux | 50 | 19 | 22 | 7 | 2 | 4% |
| Cuisine et nourriture | 50 | 15 | 22 | 0 | 13 | 26% |
| Expressions et situations à interpréter | 52 | 7 | 32 | 0 | 13 | 25% |
| Galères technologiques | 50 | 16 | 12 | 0 | 22 | 44% |
| Magasins et lieux publics | 51 | 0 | 21 | 0 | 30 | 59% |
| Maison, ménage et bricolage | 50 | 7 | 26 | 0 | 17 | 34% |
| Musique, scène et spectacle | 50 | 4 | 23 | 0 | 23 | 46% |
| Métiers | 50 | 14 | 29 | 0 | 7 | 14% |
| Nature et aventure | 50 | 0 | 32 | 0 | 18 | 36% |
| Objets et machines | 50 | 19 | 20 | 0 | 11 | 22% |
| Personnages et univers connus | 48 | 4 | 20 | 0 | 24 | 50% |
| Réactions visibles | 49 | 9 | 19 | 0 | 21 | 43% |
| Santé et premiers secours | 50 | 0 | 45 | 0 | 5 | 10% |
| Situations absurdes | 50 | 1 | 11 | 0 | 38 | 76% |
| Situations gênantes et catastrophes | 50 | 0 | 17 | 0 | 33 | 66% |
| Soirées et fêtes | 50 | 14 | 18 | 0 | 18 | 36% |
| Sports et loisirs | 50 | 34 | 12 | 0 | 4 | 8% |
| Transports et voyages | 50 | 15 | 14 | 1 | 20 | 40% |
| École, travail et réunions | 50 | 3 | 19 | 0 | 28 | 56% |

## Transfert potentiel vers Dessin

Certaines cartes supprimées du Mime peuvent être pertinentes pour le Dessin, notamment les situations absurdes ou composées de plusieurs éléments visuels.

Le fichier `MIME_DRAWING_CANDIDATES_2026-06-20.json` contient 125 suggestions automatiques. Elles ne doivent jamais être transférées directement : chacune doit être reformulée et auditée selon les règles du Dessin.

## Cartes encore à revoir

| ID | Formulation actuelle | Motif |
|---|---|---|
| `mime-009` | Un canard qui marche en se dandinant | Trop difficile à mimer |
| `mime-021` | Un hérisson qui se met en boule | Trop difficile à mimer |
| `mime-022` | Un coq qui chante en battant des ailes | Trop long ou complexe |
| `mime-023` | Une loutre qui ouvre un coquillage sur son ventre | Trop long ou complexe |
| `mime-026` | Un paon qui fait la roue | Trop difficile à mimer |
| `mime-029` | Un ours qui plonge la patte dans une ruche | Trop difficile à mimer |
| `mime-030` | Une araignée qui tisse sa toile | Trop difficile à mimer |
| `mime-349` | Tirer une valise | Autre motif |

Ces cartes restent dans le JSON avec le statut `review`, mais sont masquées des parties normales jusqu’à correction ou validation.

## Règles induites et niveau de confiance

### Règles solides

- Les consignes courtes et mono-action sont nettement plus performantes.
- Les gestes universels sont préférables aux scènes narratives.
- Une précision invisible pour les observateurs doit être supprimée.
- Les doublons doivent être évalués par la gestuelle produite.
- « Difficile » ne doit pas servir de refuge aux cartes imprécises.

### Tendances probables

- Les situations absurdes conviennent souvent mieux au Dessin qu’au Mime.
- Les cartes de lieux publics ou de réunions ont tendance à exiger trop de contexte.
- Les animaux simples fonctionnent mieux que les comportements animaux très spécifiques.

### Points à confirmer en vraies parties

- taux réel de passage selon la difficulté ;
- temps moyen nécessaire ;
- cartes neutres qui sont systématiquement évitées ;
- différences entre joueurs habitués et débutants.

Les futurs rapports de partie devront être utilisés comme signaux secondaires, jamais comme verdicts isolés.
