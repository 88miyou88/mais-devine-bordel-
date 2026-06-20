# Passation de l’audit Mime — 20 juin 2026

## But de ce dossier

Ce dossier doit être transmis à la conversation spécialisée **« Audit Mimes »**.

Il lui permet de comprendre précisément :

- les décisions prises sur les 1 000 cartes ;
- les corrections déjà effectuées par Camille ;
- les suppressions et leurs motifs ;
- les 8 cartes encore à revoir ;
- les règles éditoriales déduites ;
- les cartes susceptibles d’être adaptées au mode Dessin.

La conversation spécialisée ne doit pas modifier le code de l’application. Elle doit exploiter ces fichiers pour approfondir les règles éditoriales, retravailler les cartes à revoir et proposer de futures cartes compatibles avec les préférences observées.

## Fichiers

- `mimes.json` : bibliothèque officielle nettoyée de 644 cartes ;
- `MIME_EDITORIAL_GUIDE.md` : synthèse des bonnes et mauvaises cartes ;
- `MIME_AUDIT_DECISIONS_2026-06-20.json` : décision détaillée pour les 1 000 cartes ;
- `MIME_DRAWING_CANDIDATES_2026-06-20.json` : suggestions de transfert vers Dessin ;
- `MIME_VALIDATION_REPORT.md` : contrôles et chiffres finaux ;
- `mdb-audit-mimes-1000-final.json` : rapport brut complet.

## Consigne de reprise

La conversation doit traiter en priorité les 8 cartes `review`. Toute carte retravaillée conserve son identifiant. Les 356 identifiants retirés ne doivent jamais être réutilisés.
