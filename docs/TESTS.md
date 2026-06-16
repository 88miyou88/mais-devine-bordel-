# Tests — V0.5.1

## Tests automatiques

Les scripts nécessitent Node.js et doivent être exécutés depuis la racine du dépôt.

### Validation des bibliothèques

```bash
node tests/validate-data.mjs
```

Ce contrôle vérifie notamment :

- la validité des quatre JSON ;
- les identifiants uniques ;
- l’existence des catégories référencées ;
- les difficultés autorisées ;
- les champs obligatoires ;
- les cinq mots interdits du mode Sans le dire ! ;
- les nombres attendus de cartes.

Résultat attendu :

- paroles : 143 cartes ;
- mime : 395 cartes ;
- Sans le dire ! : 360 cartes ;
- dessin : 420 cartes ;
- total : 1 318 cartes.

### Contrôle architectural

```bash
node tests/smoke-test.mjs
```

Ce contrôle vérifie notamment :

- l’arborescence attendue ;
- l’absence des anciens fichiers plats ;
- la syntaxe JavaScript ;
- la résolution des imports ;
- la direction des dépendances ;
- la présence des anciennes clés de stockage ;
- les chemins HTML, manifeste et service worker ;
- la version 0.5.1 et le cache `mdb-v0-5-1`.

## Test dans un navigateur

Les modules ES doivent être servis par HTTP.

```bash
python3 -m http.server 8000
```

Ouvrir ensuite :

`http://localhost:8000/?v=051`

Ne pas tester en ouvrant directement `index.html` avec `file://`.

## Vérifications manuelles Android

Après publication sur GitHub Pages :

1. ouvrir `https://88miyou88.github.io/mais-devine-bordel/?v=051` ;
2. ouvrir le diagnostic et vérifier `Version : 0.5.1` ;
3. vérifier les quatre nombres de cartes ;
4. tester l’accueil sans défilement vertical en paysage ;
5. lancer une partie classique ;
6. tester swipe droite, swipe gauche, retour, pause et fin manuelle ;
7. lancer Dessin seul ;
8. tester révélation, téléphone, papier, Trouvé, Passer et expiration ;
9. tester crayon, couleurs, épaisseur, gomme, annulation et poubelle ;
10. vérifier les cartes et catégories personnelles déjà enregistrées ;
11. créer puis restaurer une sauvegarde ;
12. fermer et rouvrir l’application installée pour contrôler le cache.

Le test réel des gestes et vibrations sur Android reste nécessaire : les contrôles automatiques ne remplacent pas un appareil tactile.
