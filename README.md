# Mais devine, bordel !

Application web mobile installable (PWA) regroupant plusieurs mini-jeux de soirée. La version actuelle contient :

- La suite, maestro ! ;
- Ferme-la et mime ! ;
- Sans le dire ! ;
- Picasso en PLS.

L’interface et le moteur multijoueur sont conçus pour accepter de nouveaux modes sans limiter le planning aux quatre modes actuels.

## Version

Version actuelle : **0.7.2**

La V0.7.2 consolide l’interface de la V0.7.1 sans modifier le moteur multijoueur :

- affichage compact des modes actifs avec leurs icônes uniquement ;
- suppression des flèches et libellés trop larges dans les récapitulatifs ;
- nouvel habillage des modes Paroles et Mime ;
- nouvelle icône PWA « MDB! » ;
- accueil et configuration multijoueur accessibles sur les fenêtres étroites ;
- tentative de verrouillage automatique en paysage et écran de rotation propre lorsque le navigateur refuse le verrouillage.

Le multijoueur local conserve :

- de 2 à 12 joueurs ;
- plusieurs cycles ;
- ordre commun ou rotation équilibrée ;
- une manche chronométrée complète par joueur ;
- enchaînement de tous les modes sélectionnés pendant la même manche ;
- scores cumulés et détail par mode sous la forme réussites/tentatives ;
- classement final ;
- sauvegarde et reprise d’une partie interrompue entre deux manches.

La partie libre de la V0.6.0 reste disponible. Le Dessin peut toujours être joué seul ou mélangé aux autres modes.

## Déroulement multijoueur

Chaque joueur garde le téléphone pendant toute sa manche, par exemple 60 secondes, et enchaîne les modes sélectionnés selon son parcours :

```text
Camille : Paroles → Dessin → Mime → Paroles → …
Léa     : Dessin → Mime → Paroles → Dessin → …
```

Le téléphone n’est transmis qu’à la fin de la manche du joueur.

### Ordre commun

Tous les joueurs utilisent le même parcours de modes.

### Rotation équilibrée

Chaque joueur reçoit tous les modes dans un ordre différent lorsque c’est possible. Le planificateur équilibre les ordres et les positions sans calculer toutes les permutations, afin de rester rapide quand de nouveaux modes seront ajoutés.

## Dessin mélangé

Lorsqu’un dessin arrive pendant une manche mixte :

1. le chronomètre général se met en pause ;
2. le signal sonore et la vibration se déclenchent directement sur l’écran où la consigne est cachée ;
3. le joueur révèle volontairement le mot ;
4. il dessine sur le téléphone, sur papier ou passe ;
5. une pénalité fixe est appliquée ;
6. un compte à rebours permet de remettre le téléphone sur le front ;
7. la manche reprend avec le mode suivant.

L’ancien écran intermédiaire « Récupère le téléphone » a été supprimé.

## Données locales

La V0.7.2 conserve les clés de stockage existantes et reste compatible avec les données V0.5.x et V0.6.0 :

- cartes personnelles ;
- cartes officielles modifiées ;
- catégories personnelles ;
- sélections et réglages ;
- sauvegardes.

La session multijoueur active utilise une clé distincte et n’est pas incluse dans les sauvegardes permanentes.

## Récupération technique

La V0.7.2 conserve le système de récupération PWA : ressources critiques versionnées, mise à jour forcée du service worker et écran de réparation du cache en cas de chargement incomplet. Cette réparation supprime uniquement le cache technique et conserve le stockage local de l’utilisateur.

## Utilisation

Application publiée :

`https://88miyou88.github.io/mais-devine-bordel-/`

URL de test conseillée :

`https://88miyou88.github.io/mais-devine-bordel-/?v=072`

L’application est conçue principalement pour Android, en mode paysage et avec des interactions tactiles.

## Développement local

Les modules ES doivent être servis par HTTP. Ne pas ouvrir directement `index.html` avec une adresse `file://`.

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=072`

## Contrôles automatiques

Depuis la racine du dépôt :

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir aussi `docs/ARCHITECTURE.md` et `docs/TESTS.md`.
