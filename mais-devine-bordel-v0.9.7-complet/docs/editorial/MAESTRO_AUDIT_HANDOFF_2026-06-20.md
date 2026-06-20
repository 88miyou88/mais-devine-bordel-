# PASSATION ÉDITORIALE — AUDIT COMPLET DE « LA SUITE, MAESTRO ! »

## But de ce fichier

Ce fichier est destiné à la conversation spécialisée consacrée à l’éditorial de **« La suite, maestro ! »**.

Il doit être transmis avec :

- `lyrics.json` de la V0.9.6.1 ;
- `MAESTRO_EDITORIAL_GUIDE.md` ;
- `MAESTRO_AUDIT_DECISIONS_2026-06-20.json` ;
- `mdb-audit-cartes-2026-06-20-final.json`.

Son objectif est de transmettre les résultats d’un audit humain complet afin que la conversation éditoriale :

1. apprenne les critères explicites et implicites de Camille ;
2. distingue les exemples positifs, neutres, à corriger et supprimés ;
3. retravaille les cartes encore incertaines sans repartir de zéro ;
4. évite de réintroduire des cartes rejetées ou des défauts similaires ;
5. rende ensuite un JSON complet accompagné de rapports normalisés.

Ce fichier **ne demande aucune modification du code**. Les changements HTML, CSS, JavaScript, migrations, tests et publications restent réservés à la conversation technique principale.

## Périmètre et bilan consolidé

La bibliothèque de départ contenait **198 cartes**. Le rapport cumulatif final en contient **196** ; deux cartes avaient déjà été supprimées avant le lancement du mode Audit (`lyrics-037` et `lyrics-095`).

| Statut | Nombre | Interprétation |
|---|---:|---|
| Excellente | 86 | Exemple positif explicite |
| Neutre | 62 | Carte vue sans jugement fort ; elle n’est pas mauvaise |
| À revoir | 24 | Carte à corriger ou à discuter |
| Supprimée | 26 | Carte retirée de la bibliothèque officielle |
| Total | 198 | Audit humain complet |

Après les suppressions, la bibliothèque officielle de la V0.9.6.1 contient **172 cartes actives**.

Parmi les 24 cartes initialement marquées « À revoir » :

- **6 corrections ont déjà été appliquées** ;
- **18 cartes restent à retravailler** dans la conversation éditoriale.

## Comment interpréter les données

- **Excellente** : carte particulièrement réussie, utile comme exemple positif.
- **Neutre** : carte fonctionnelle ou sans réaction forte. L’absence de like n’est pas un signal négatif.
- **À revoir** : faiblesse identifiée ; la carte doit être corrigée ou comparée à d’autres passages.
- **Supprimée** : signal négatif explicite et contre-exemple à conserver dans le journal.
- **Motif clarifié par Camille** : information prioritaire sur le motif initial enregistré dans l’application.
- Une règle générale ne doit être déduite qu’à partir de plusieurs retours cohérents.

## Tendances de l’audit

- **Carte trop difficile** : 15 carte(s)
- **Passage peu mémorable** : 8 carte(s)
- **Coupure mal placée** : 7 carte(s)
- **Chanson trop peu connue** : 7 carte(s)
- **Pas assez de contexte** : 5 carte(s)
- **Suite pas évidente** : 2 carte(s)
- **Suppression antérieure sans motif détaillé** : 2 carte(s)
- **Paroles fausses / à corriger** : 2 carte(s)
- **Comparer avec un autre passage** : 1 carte(s)
- **Réponse trop longue** : 1 carte(s)
- **Plusieurs réponses possibles** : 1 carte(s)

Les conclusions les plus solides sont :

1. Une chanson connue ne suffit pas : le passage choisi doit déclencher spontanément l’air.
2. Une amorce trop courte ou isolée peut rendre une carte injouable ; le contexte gris ou une coupure plus tardive devient alors nécessaire.
3. Une carte difficile doit rester claire et chantable. « Difficile » ne doit jamais masquer une chanson inconnue ou une coupure arbitraire.
4. Les cartes anglaises ne fonctionnent que lorsque le passage est extrêmement ancré chez un public francophone.
5. Les meilleures cartes coupent souvent un vers culte à un endroit naturel et laissent une suite unique.
6. Les cartes neutres ne doivent pas être supprimées par défaut : elles constituent une base fonctionnelle.

## Cartes supprimées

| ID | Titre | Artiste/source | Motif |
|---|---|---|---|
| lyrics-037 | J’en ai marre ! | Alizée | Suppression antérieure sans motif détaillé |
| lyrics-063 | Allumer le feu | Johnny Hallyday | Chanson trop peu connue |
| lyrics-090 | Dancing Queen | ABBA | Suite pas évidente |
| lyrics-095 | Beat It | Michael Jackson | Suppression antérieure sans motif détaillé |
| lyrics-100 | Umbrella | Rihanna | Passage peu mémorable |
| lyrics-107 | Shape of You | Ed Sheeran | Chanson trop peu connue |
| lyrics-108 | Perfect | Ed Sheeran | Chanson trop peu connue |
| lyrics-111 | As It Was | Harry Styles | Chanson trop peu connue |
| lyrics-112 | Don’t Start Now | Dua Lipa | Chanson trop peu connue |
| lyrics-114 | Yellow | Coldplay | Chanson trop peu connue |
| lyrics-115 | Smells Like Teen Spirit | Nirvana | Carte trop difficile |
| lyrics-116 | Bring Me to Life | Evanescence | Carte trop difficile |
| lyrics-117 | In the End | Linkin Park | Carte trop difficile |
| lyrics-119 | I Want It That Way | Backstreet Boys | Carte trop difficile |
| lyrics-122 | Shallow | Lady Gaga & Bradley Cooper | Carte trop difficile |
| lyrics-127 | Malbrough s'en va-t-en guerre | Chanson traditionnelle | Carte trop difficile |
| lyrics-129 | Auprès de ma blonde | Chanson traditionnelle | Carte trop difficile |
| lyrics-130 | Nous n'irons plus au bois | Chanson traditionnelle | Coupure mal placée |
| lyrics-131 | Gentil coquelicot | Chanson traditionnelle | Carte trop difficile |
| lyrics-136 | Compère Guilleri | Chanson traditionnelle | Carte trop difficile |
| lyrics-139 | Twinkle, Twinkle, Little Star | Traditional | Carte trop difficile |
| lyrics-140 | Row, Row, Row Your Boat | Traditional | Carte trop difficile |
| lyrics-142 | London Bridge Is Falling Down | Traditional | Carte trop difficile |
| lyrics-143 | Mary Had a Little Lamb | Traditional | Carte trop difficile |
| lyrics-160 | Le Pouvoir des fleurs | Laurent Voulzy | Chanson trop peu connue |
| lyrics-163 | J’ai deux amours | Joséphine Baker | Carte trop difficile |

Les identifiants supprimés ne doivent pas être réutilisés. Ces cartes ne doivent pas être réintroduites sous une simple variante cosmétique sans nouvelle validation humaine.

## Corrections déjà décidées et intégrées

| ID | Titre | Motif clarifié | Modification appliquée |
|---|---|---|---|
| lyrics-010 | L’Assasymphonie | Paroles fausses / à corriger | `answer` : « Aux requiems anatomiques » → « Aux requiems, tuant par dépit ce que je sème » |
| lyrics-040 | Dernière danse | Pas assez de contexte | `context` : «  » → « Oh, ma douce souffrance » |
| lyrics-053 | Les Démons de minuit | Pas assez de contexte | `context` : «  » → « Ils m’entraînent au bout de la nuit » |
| lyrics-061 | Un autre monde | Coupure mal placée | `context` : « Je rêvais d’un autre monde » → «  »<br>`prompt` : « Où la Terre serait ronde » → « Je rêvais d’un autre monde »<br>`answer` : « Où la lune serait blonde » → « Où la Terre serait ronde » |
| lyrics-150 | Femme Like U | Paroles fausses / à corriger | `answer` : « Ton body, baby » → « Ton corps, baby » |
| lyrics-167 | Le Paradis blanc | Pas assez de contexte | `context` : «  » → « Recommencer là où le monde a commencé » |

La correction de `lyrics-010` remplace la fausse formulation « Aux requiems anatomiques » par la suite correcte et conserve une réponse de longueur raisonnable.

## Cartes restant à retravailler

La conversation éditoriale doit proposer pour chacune une version **complète** : contexte éventuel, amorce, suite, difficulté et justification. Elle ne doit pas écrire seulement « ajouter la phrase précédente ».

| ID | Titre | Motif | Amorce actuelle | Suite actuelle | Précision de Camille |
|---|---|---|---|---|---|
| lyrics-013 | Papaoutai | Pas assez de contexte | Dites-moi d’où il vient | Enfin, je saurai où je vais | L’amorce est trop courte pour retrouver l’air. Aucun texte supplémentaire exact n’a été fourni : carte laissée à retravailler. |
| lyrics-020 | Résiste | Réponse trop longue | Résiste, prouve que tu existes | Cherche ton bonheur partout, va |  |
| lyrics-035 | Vivre à en crever | Passage peu mémorable | Vivre à en crever | Pour décrocher les étoiles |  |
| lyrics-036 | Tout le monde veut devenir un cat | Carte trop difficile | Tout le monde veut devenir un cat | Parce qu’un chat quand il est cat |  |
| lyrics-049 | Envole-moi | Coupure mal placée | Envole-moi, envole-moi loin de cette | Fatalité |  |
| lyrics-078 | Bande organisée | Pas assez de contexte, Comparer avec un autre passage | Bande organisée | Personne peut nous canaliser | Comparer une version avec phrase précédente et un autre passage plus reconnaissable avant de trancher. |
| lyrics-096 | Smooth Criminal | Coupure mal placée | You’ve been hit by | You’ve been struck by a smooth criminal |  |
| lyrics-098 | ...Baby One More Time | Passage peu mémorable | My loneliness is killing me | I must confess I still believe |  |
| lyrics-099 | Toxic | Passage peu mémorable | With a taste of your lips | I’m on a ride |  |
| lyrics-102 | Poker Face | Passage peu mémorable | Can’t read my, can’t read my | No, he can’t read my poker face |  |
| lyrics-104 | Roar | Coupure mal placée | I got the eye of the tiger | A fighter, dancing through the fire |  |
| lyrics-105 | Hello | Passage peu mémorable | Hello from the other side | I must’ve called a thousand times |  |
| lyrics-106 | Someone Like You | Suite pas évidente | Never mind, I’ll find | Someone like you |  |
| lyrics-113 | Viva la Vida | Passage peu mémorable | I used to rule the world | Seas would rise when I gave the word |  |
| lyrics-157 | Don’t Stop Me Now | Passage peu mémorable | Don’t stop me now | I’m having such a good time |  |
| lyrics-169 | À nos actes manqués | Plusieurs réponses possibles | À nos actes manqués | À nos erreurs |  |
| lyrics-185 | Écris l’histoire | Coupure mal placée | Écris l’histoire, tout ce que tu voudras | Entre mes lignes |  |
| lyrics-191 | J’me tire | Coupure mal placée | J’me tire, me demande pas pourquoi | Je suis parti sans motif |  |

Points explicitement signalés :

- `lyrics-013` — *Papaoutai* : pas assez de contexte ; le texte exact à ajouter doit être validé humainement.
- `lyrics-078` — *Bande organisée* : comparer une phrase précédente et un autre passage plus reconnaissable.
- Les cartes anglaises à revoir doivent être évaluées avec une exigence forte : le passage doit être universellement mémorisé, pas seulement la chanson.

## Exemples positifs

Les **86 cartes marquées Excellente** sont répertoriées dans `liked-cards-journal.json`. Elles montrent notamment une préférence pour :

- les amorces immédiatement chantables ;
- les refrains et passages cultes ;
- les coupures naturelles au milieu d’un vers ;
- les réponses courtes mais non arbitraires ;
- les classiques français, Disney, comptines et tubes de soirée réellement connus ;
- quelques chansons anglaises seulement lorsque la continuation est devenue quasi universelle.

## Sortie exigée de la conversation éditoriale

La conversation spécialisée doit rendre exactement :

1. `lyrics.json` — bibliothèque complète finale ;
2. `MAESTRO_EDITORIAL_GUIDE.md` — guide cumulatif mis à jour ;
3. `MAESTRO_DECISIONS.json` — journal structuré avant/après ;
4. `MAESTRO_VALIDATION_REPORT.md` — statistiques et contrôles finaux ;
5. `maestro-editorial-delivery.zip` — archive contenant les quatre fichiers précédents.

Elle ne doit modifier aucun fichier HTML, CSS ou JavaScript.

## Sources à conserver

- rapport cumulatif final : 196 cartes auditées ;
- suppressions antérieures : 2 cartes ;
- guide éditorial Maestro validé ;
- JSON officiel V0.9.6.1 : 172 cartes actives ;
- journal positif : 86 cartes ;
- journal négatif : 26 cartes.
