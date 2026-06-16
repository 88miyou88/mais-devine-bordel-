# Mais devine, bordel !

Application web mobile installable (PWA) regroupant plusieurs jeux de soirée :

- Deviner les paroles ;
- Mimer ;
- Sans le dire ! ;
- Dessine-moi ça !

## Version

Version actuelle : **0.5.1**

La V0.5.1 est une refonte exclusivement architecturale de la V0.5.0. Elle ne crée aucun nouveau mode de jeu. Elle range le dépôt, transforme les scripts en modules ES et conserve les données locales existantes.

## Utilisation

L’application publiée est accessible à l’adresse :

`https://88miyou88.github.io/mais-devine-bordel/`

URL conseillée pour tester cette version en contournant un ancien cache de navigation :

`https://88miyou88.github.io/mais-devine-bordel/?v=051`

L’application est conçue principalement pour Android, en mode paysage et avec des interactions tactiles.

## Développement local

Les modules ES doivent être servis par HTTP. Il ne faut pas ouvrir directement `index.html` avec une adresse `file://`.

Exemple avec Python :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

`http://localhost:8000/?v=051`

## Contrôles automatiques

Depuis la racine du dépôt :

```bash
node tests/validate-data.mjs
node tests/smoke-test.mjs
```

Voir également `docs/ARCHITECTURE.md` et `docs/TESTS.md`.
