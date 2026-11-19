# Portfolio — Aglaé Nicolle

Site portfolio réalisé avec [Astro](https://docs.astro.build) et Tailwind CSS.
Les projets et les outils sont stockés dans une base **SQLite** lue avec **better-sqlite3**.

Prérequis : Node.js 22.23.4 ou plus récent.

## Commandes

À lancer depuis la racine du projet :

| Commande | Action |
| :--- | :--- |
| `npm install` | Installe les dépendances |
| `npm run dev` | Lance le serveur de développement sur `localhost:4321` |
| `npm run build` | Construit le site de production dans `./dist/` |
| `npm run preview` | Prévisualise le build en local |
| `npm run db:init` | Crée ou met à jour la base `db/portfolio.sqlite` (voir ci-dessous) |
| `npm run db:image -- …` | Enregistre une image dans la base (voir ci-dessous) |

## Base de données

- `db/schema.sql` : structure des tables (`PROJET`, `OUTILS`, `IMAGE`, `ECOLE`, `RealiserA`, `Utiliser`).
- `db/seed.sql` : données de test, insérées seulement si la base ne contient encore aucun projet.
- `db/portfolio.sqlite` : la base utilisée par le site (chemin modifiable avec la variable `DB_PATH`).

`npm run db:init` crée les tables manquantes et ajoute à une base existante les colonnes apparues depuis
(par exemple `OUTILS.typeOutils`), **sans modifier les données déjà présentes**.

### Images

Les images doivent être enregistrées en **BLOB**, pas en texte (le texte abîme les octets de l'image) :

```sh
npm run db:image -- card 1 chemin/vers/image.webp     # image de la carte du projet 1
npm run db:image -- galerie 1 chemin/vers/image.webp  # image de la galerie du projet 1
npm run db:image -- nettoyer 1                        # supprime les images illisibles du projet 1
```

### Outils

Dans la table `OUTILS`, `typeOutils` (`'logiciel'` ou `'langage'`) choisit la colonne de la boîte à outils
de l'accueil, et `ordreOutils` l'ordre d'affichage. `iconOutils` contient le code SVG de l'icône.

## Structure

```text
data/            schéma, données de test et base SQLite
public/        fichiers servis tels quels (polices, favicon, CV)
scripts/       scripts de gestion de la base (init-db.mjs, import-image.mjs)
src/
  assets/      images et icônes du site
  components/  Header, Footer, cartes projet, carrousel…
  js/backend.ts  accès aux images et utilitaires (getImageUrl, stripHtml…)
  layouts/     gabarit commun des pages
  lib/         connexion à la base (db.ts) et infos du site (site.ts)
  pages/       accueil, projets, page projet, à propos, mentions légales, 404
  styles/      global.css (tokens et styles issus de la maquette Figma)
```
