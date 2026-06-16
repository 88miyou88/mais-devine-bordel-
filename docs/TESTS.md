# Tests — V0.6.0

## Tests automatiques

Exécuter depuis la racine du dépôt :

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

### Validation des bibliothèques

`validate-data.mjs` contrôle :

- validité des quatre JSON ;
- identifiants uniques ;
- catégories référencées ;
- difficultés autorisées ;
- champs obligatoires ;
- cinq mots interdits par carte dans Sans le dire ! ;
- nombres de cartes attendus.

Résultat attendu :

- paroles : 143 ;
- mime : 395 ;
- Sans le dire : 360 ;
- dessin : 420 ;
- total : 1 318.

### Contrôle architectural et fonctionnel statique

`smoke-test.mjs` contrôle notamment :

- arborescence et fichiers requis ;
- syntaxe de tous les modules ;
- résolution des imports ;
- absence d'import circulaire ;
- direction des dépendances ;
- références DOM principales ;
- anciennes clés de stockage ;
- chemins HTML, manifeste et service worker ;
- version `0.6.0` ;
- cache `mdb-v0-6-0` ;
- présence du module Dessin mélangé ;
- suppression de l'ancienne exclusivité du mode Dessin ;
- pénalités de référence pour 30, 60 et 90 secondes ;
- répartition ordonnée des déclenchements ;
- garde de temps minimum avant un dessin ;
- réduction contrôlée du nombre de dessins pour les durées trop courtes ;
- compatibilité des données locales et sauvegardes V0.5.x.

## Test dans un navigateur

Les modules ES doivent être servis par HTTP :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=060`

Ne pas utiliser `file://`.

## Vérifications manuelles Android

Après publication :

1. ouvrir `https://88miyou88.github.io/mais-devine-bordel/?v=060` ;
2. vérifier `Version : 0.6.0` et `Cache : mdb-v0-6-0` dans le diagnostic ;
3. vérifier les quatre nombres de cartes ;
4. vérifier que Dessin seul fonctionne toujours ;
5. sélectionner Dessin avec chacun des trois modes classiques ;
6. sélectionner les quatre modes ensemble ;
7. tester 1, 2, 3, 4 puis 5 dessins sur plusieurs durées ;
8. vérifier qu'un dessin n'arrive qu'après une carte normale ;
9. vérifier qu'aucun dessin n'est consécutif ;
10. vérifier que le chrono général ne bouge pas pendant le dessin ;
11. tester révélation, téléphone, papier et Passer avant démarrage ;
12. tester Trouvé, Passer et expiration ;
13. vérifier la vibration et le son d'arrivée ;
14. vérifier le son de fin activé puis désactivé ;
15. vérifier le maintien de 0,5 seconde et son annulation hors du bouton ;
16. tester pause/reprise pendant le dessin ;
17. terminer manuellement la manche pendant une interruption Dessin ;
18. vérifier le compte à rebours de retour au front ;
19. vérifier que la pénalité n'est appliquée qu'une fois ;
20. vérifier les résultats détaillés et l'ordre chronologique ;
21. vérifier une manche trop courte ou terminée avant tous les dessins ;
22. vérifier les anciennes cartes, catégories, réglages et sauvegardes locales ;
23. fermer puis rouvrir l'application pour contrôler le service worker.

Les gestes, vibrations, sons, orientation et mise en arrière-plan doivent être validés sur un véritable téléphone Android.
