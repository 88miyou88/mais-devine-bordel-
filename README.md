# Mais devine, bordel !

Application web mobile installable (PWA) regroupant quatre jeux de soirée :

- Deviner les paroles ;
- Mimer ;
- Sans le dire ! ;
- Dessine-moi ça !

## Version

Version actuelle : **0.6.0**

La V0.6.0 ajoute le **Dessin mélangé**. Le mode Dessin peut désormais être joué seul ou être combiné avec un ou plusieurs modes classiques. Lorsqu'une carte Dessin arrive, le chronomètre général se met en pause, le mini-jeu de dessin se déroule sur téléphone ou sur papier, une pénalité fixe est appliquée, puis la partie reprend après un compte à rebours.

La version conserve l'architecture modulaire ES de la V0.5.1 et reste compatible avec les personnalisations et sauvegardes existantes.

## Utilisation

Application publiée :

`https://88miyou88.github.io/mais-devine-bordel/`

URL de test conseillée pour cette version :

`https://88miyou88.github.io/mais-devine-bordel/?v=060`

L'application est conçue principalement pour Android, en mode paysage et avec des interactions tactiles.

## Dessin mélangé

Dans les réglages du mode Dessin, le joueur peut définir :

- de 1 à 5 dessins par manche mélangée ;
- les catégories et difficultés ;
- la durée des dessins faciles, moyens et difficiles ;
- le son d'arrivée d'une carte Dessin ;
- le son de fin du mini-chronomètre.

Les dessins sont répartis dans la zone centrale de la manche, ne sont jamais déclenchés consécutivement et ne sont plus proposés lorsqu'il ne reste pas assez de temps. Leur pénalité est calculée à partir de la durée de la manche et du nombre de dessins demandé. Pour une durée personnalisée trop courte, l'application réduit clairement le nombre possible ou bloque le lancement si aucun dessin ne peut être placé proprement.

## Développement local

Les modules ES doivent être servis par HTTP. Il ne faut pas ouvrir directement `index.html` avec une adresse `file://`.

Exemple avec Python :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=060`

## Contrôles automatiques

Depuis la racine du dépôt :

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md` et `docs/TESTS.md`.
