# IA.md : utilisation de l'IA dans le projet portfolio

Projet : portfolio d'Aglaé Nicolle (Astro, Tailwind CSS v4, base SQLite via `bun:sqlite`, runtime Bun), à partir de la maquette Figma. Période : novembre 2026, 8 sessions de travail documentées du 12 au 19 novembre, plus une phase initiale de génération du projet. Outil : Claude (Claude Code pour le développement, chat pour l'aide et les explications).

Les demandes, les choix de design et les validations sont ceux de l'autrice. L'IA a écrit ou modifié le code, diagnostiqué les erreurs, rédigé des guides et expliqué les solutions.

Document synthétisé à partir de cinq récapitulatifs de session. Dernière mise à jour : 19 novembre 2026.

---

## 1. Chronologie

| Date                               | Sujet                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Phase initiale (date non indiquée) | Analyse de la maquette Figma, revue du modèle de données                                                                           |
| Semaine 2 (12 -> 18 oct.)          | Affichage des données depuis SQLite, intégration de la maquette, galerie d'images, animations, correction des erreurs de l'éditeur |
| Semaine 3 (19 -> 25 oct.)          | Mise en ligne sur le VPS : workflow GitHub Actions, build hors du VPS, diagnostic DNS                                              |
| Semaine 4 (02 -> 08 nov.)          | Ajustements de pages (CV, hero, favicon, mise en page « À propos », style des titres)                                              |
| Semaine 4-5 (02 -> 15 nov.)        | Aide à DataGrip et à la mise à jour de la base sur le VPS                                                                          |
| Semaine 5-6 (15 -> 19 nov.)        | Création de l'instance Infomaniak, routage de l'IP, tutoriel d'hébergement, dépannage du service systemd                           |
| Semaine 6 (16 -> 19 nov.)          | Rédaction de ce document                                                                                                           |

---

## 2. Génération initiale du projet

- **Analyse de la maquette Figma** : lecture des pages (maquette mobile, maquette desktop, guide de style), des composants (boutons, cartes, header, footer, carrousel) et des tokens (couleurs, typographies Manrope et Kingred). Le nœud racine n'étant pas utilisable directement, l'analyse s'est appuyée sur les métadonnées et les variables.
- **Revue du modèle de données (MLD)** : la première version posait plusieurs problèmes (types `image` non supportés par SQLite, `nomEcole` en INT, `svp` pour `svg`, VARCHAR(50) trop courts, `imagesProjet` au pluriel contraire à la 1NF, absence de slug, de catégorie d'outils, d'ordre d'affichage ou de flag « à la une »).
- **Décisions de l'autrice** : « Personnels » est traitée comme une école ; l'équipe est mentionnée dans `contenuPageProjet` ; la page dynamique utilise `idProjet` ; pas de table profil (les pages statiques restent dans le code).
- **Fichiers créés** : `package.json`, `db/schema.sql`, `db/seed.sql`, `scripts/init-db.mjs`, `src/lib/db.ts`, `src/styles/global.css`, `Layout.astro`, `Header.astro` (menu mobile en `<details>`), `Footer.astro`, `ProjectCard.astro`, `Carousel.astro` (scroll natif et flèches sur desktop), les pages `index`, `projets/index`, `projets/[id]`, `a-propos`, `mentions-legales` et `404`.
- **Corrections** : le paquet `@astrojs/bun` n'existant pas sur npm, il a été remplacé par `@astrojs/node` et `better-sqlite3`. L'autrice a ensuite demandé Bun : retour à `bun:sqlite`, scripts `bun --bun astro dev|build`, adaptateur `@astrojs/node` conservé en mode standalone. L'ancien `scripts/init-db.ts` a été supprimé.
- **Aide à l'utilisation** : `bun install`, `bun run db:init`, `bun run dev`. Ordre d'insertion : `PROJET` avant `RealiserA`, `Utiliser` et `IMAGE`. Identifiants des écoles : 1 UTBM, 2 IUT MMI, 3 Personnels.
- **Images** : fichiers stockés dans `public/images/projets/`, seul le chemin est enregistré en base.

---

## 3. Base de données et backend

- **Erreur `Cannot find module 'better-sqlite3'`** : le paquet n'était ni installé ni déclaré dans `package.json`. Corrigé.
- **Accès aux données** : `src/lib/db.ts` interroge directement `portfolio.sqlite` (`getProjets()`, `getProjetById()`, etc.).
- **Affichage des données** : création du composant `OutilIcon.astro` qui insère les icônes SVG stockées en base. Test des 25 outils de la table `OUTILS` sous Chrome (ordinateur et mobile), avec correction des icônes MySQL et PHP.
- **Ajout de colonnes** à `OUTILS` : `typeOutils` (`logiciel` ou `langage`) et `ordreOutils`, pour séparer les deux listes sur l'accueil. Documentées dans `schema.sql`.
- **Corrections dans la base** (après sauvegarde) : `Canvas` devient `Canva`, `'php '` devient `php`.
- **Script `init-db.mjs`** : il met à jour une base existante sans perdre les données.
- **Images abîmées** : les deux images de la base étaient enregistrées comme du texte et non comme des données binaires. Elles sont donc irrécupérables. Les tests ont été faits sur une copie de la base.
- **Conversion des images en BLOB** : requêtes SQL par moteur (SQLite : `CAST(... AS BLOB)` ; MySQL : `UNHEX` ou `LONGBLOB` ; PostgreSQL : `bytea`), script Bun `scripts/migrate-blob.mjs` qui décode le base64 ou lit un fichier, et route `src/pages/media/projet/[id].astro` à créer pour servir les images. Le script n'a pas été exécuté et aucune base n'a été modifiée pendant cette session. Une sauvegarde reste obligatoire avant toute modification.
- **Recréation de table** : requêtes `PROJET_new` avec désactivation des clés étrangères.
- **DataGrip** : pour insérer une image, clic droit sur la cellule BLOB, puis **Load from File…** et **Submit**. La colonne doit être de type BLOB, pas TEXT. Les libellés de menu varient selon la version.

---

## 4. Intégration de la maquette et front-end

- **Reproduction de la maquette** : mise en page de toutes les pages en desktop et en mobile (accueil, mes projets, page projet, à propos, mentions légales, 404, menu burger), puis comparaison de captures avec la maquette.
- **Boîte à outils** : les noms d'outils (TailwindCSS, PocketBase, WordPress…) débordaient selon la largeur. Vérification sur 10 largeurs, de 320 à 1920 px.
- **Header** : Affichage de « Développeuse full stack » dès 1024 px.
- **Images locales** : import Astro (`src/assets`) pour les visuels qui ne viennent pas de la base, comme `paquerette.webp` sur « À propos ». Favicon : `src/assets/logo/logo.svg`.
- **Éditeur VS Code** : les erreurs d'import fantômes (`Cannot find module '../../js/backend'`) venaient du cache du serveur de langage Astro. Le code était correct, confirmé par `astro check` et un build réussi. Création de `.vscode/settings.json` pour l'extension Tailwind CSS IntelliSense (avertissement `Unknown at rule @source`).
- **Galerie `GalerieProjet.astro`** : d'abord un carrousel, puis une galerie en colonnes façon Pinterest (2, 3 ou 4 colonnes selon l'écran). Au survol, le texte alternatif recouvre l'image. Au clic, une visionneuse plein écran avec zoom de 100 à 500 % (molette, pincement, double-clic).

### Animations et identité visuelle

- Propositions d'effets adaptés à l'identité du site (palette terre et jaune, Kingred, damier, pâquerette).
- **Transition carte vers page projet** avec les View Transitions : l'image et le titre glissent jusqu'à l'en-tête de la page.
- **Halo sur le damier** : ajouté puis retiré à la demande de l'autrice.
- **Curseur personnalisé `Curseur.astro`** : point et anneau qui suivent la souris, réaction au survol des liens, onde au clic. Marron foncé sur fond clair, marron clair sur fond foncé.
- **Filtres de `/projets`** : le trait jaune glisse d'une catégorie à l'autre. Correction pour que le trait jaune et le trait vert bougent ensemble lors du défilement.
- **Sommaire des pages projet** : soulignement jaune au repos, surlignage qui se remplit de gauche à droite au survol.
- **Ajustements du 17 novembre** : bouton « Télécharger mon CV » pointant vers `/CV.pdf` (il téléchargeait la 404), animation du hero appliquée à l'e-mail et au téléphone, défilement horizontal corrigé entre 1024 et 1170 px, bouton « Consulter le site » aligné sur le titre, style des `<h3>` (Manrope semi-gras, 18 px mobile, 24 px desktop), page de test `olyvia.astro` limitée au mode développement.

---

## 5. Hébergement et déploiement

### Architecture retenue

- **Site** : `aglaenicolle.fr`, Astro en SSR avec `@astrojs/node` (standalone), runtime Bun, base SQLite hors dépôt.
- **Hébergement** : VPS Infomaniak Public Cloud, Ubuntu 24.04 (2 vCPU, 4 Go de RAM, 50 Go de disque), utilisateur système dédié.
- **Dépôt** : `aglae-nicolle/portfolio` (public) sur GitHub.
- **Reverse proxy** : Caddy, HTTPS automatique, proxy vers le service local (`127.0.0.1:3001`), blocage de `/db/*`, `*.sqlite*`, `.git` et `.env`.
- **Service** : `portfolio.service` (systemd) avec isolation (User, ProtectSystem…), environnement dans `/etc/portfolio/portfolio.env`, règle sudoers pour redémarrer le service sans mot de passe.
- **Données** : base hors dépôt dans `/var/lib/portfolio/db`, lien symbolique `db` dans le clone.
- **Build** : fait sur GitHub Actions (le processeur du VPS n'a pas AVX2, requis par le compilateur natif d'Astro). Le dossier `dist/` est envoyé sur le VPS.
- **CI/CD** : workflow `deploy.yml` sur push vers `main`, secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_PORT`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`. Option de repli : runner auto-hébergé si seul le port 443 est ouvert.
- **Vérification finale** : le workflow testait `/api/composants`, une route inexistante, et échouait toujours. Il teste désormais la page d'accueil (commit `ba1765f`).

### Création de l'instance et réseau

- Image Ubuntu 24.04 LTS, réseau public `ext-net1`. La paire de clés doit exister avant la création de l'instance (import via « Import Public Key »).
- Clé ed25519 générée sous Windows (PowerShell) : `ssh-keygen -t ed25519 -f $HOME\.ssh\infomaniak_vps`.
- Les identifiants OpenStack et Public Cloud ne sont pas des adresses IP.
- Le tutoriel indiquait `ssh root@`, alors que l'utilisateur de départ est `ubuntu`. Un utilisateur `etudiant` a ensuite été créé.
- **Association de l'IP flottante** : erreur, le réseau externe n'était pas accessible depuis le sous-réseau de l'instance. Solution proposée : créer un routeur (passerelle `ext-floating1`), puis ajouter une interface sur le sous-réseau privé.
- **SSH** : timeout sur le port 22 lors de la première tentative. Pistes : IP bien associée, règle TCP 22 dans le groupe de sécurité, statut « Actif » dans Horizon.

### Dépannage

|Problème|Cause|Solution appliquée|
|---|---|---|
|`Could not resolve hostname github-portfolio` au clone|`sudo git clone` lancé en root, qui ne lit pas `~/.ssh/config`|Clone sans `sudo`, dossier donné à `etudiant`|
|`bun install` échoue sur `better-sqlite3`|`node-gyp` absent (exit 127)|Suppression de la dépendance, car `bun:sqlite` est utilisé|
|`bun run build` plante en `SIGILL`|Pas d'AVX2 sur le VPS|Build déplacé sur GitHub Actions, `dist/` envoyé par `scp`|
|Workflow introuvable|`.github/workflows/` absent|Création de `deploy.yml`, commit et push|
|`/etc/portfolio` absent|Étape de structure sautée|Création du dossier et du fichier d'environnement|
|Port 4321 déjà utilisé|Autre processus|Passage au port 4400, à modifier dans le service, l'environnement et Caddy|
|Service en boucle de redémarrage|`astro preview` charge le compilateur natif, donc `SIGILL`|Service arrêté avec `systemctl stop` et `reset-failed`, diagnostic en cours|
|Site inaccessible|Aucun enregistrement `A` chez Infomaniak|Vérification de Caddy (proxy vers `127.0.0.1:3001`, HTTPS automatique), vidage du cache DNS local|

### Tutoriel d'hébergement

Un tutoriel complet a été rédigé pour un site Astro SSR avec SQLite sur VPS Infomaniak : préparation du VPS (UFW, Bun, Nginx, Certbot), dossier de données hors dépôt, service systemd, reverse proxy, HTTPS, déploiement automatique avec health check, sauvegarde quotidienne avec `sqlite3 .backup`, tableau de dépannage et checklist finale. Ce tutoriel utilise Nginx, alors que le portfolio utilise Caddy. Il sert de référence générale.

### Configuration locale

- `src/lib/db.ts` utilise `bun:sqlite`, avec `PRAGMA journal_mode = WAL` et `PRAGMA foreign_keys = ON`.
- `import.meta.env` est figé au build : le chemin de la base est lu avec `process.env` à l'exécution.
- Chemin par défaut corrigé en `./db/portfolio.sqlite`, avec création du dossier via `mkdirSync`. Le fichier `.env` est facultatif.
- Erreurs corrigées : `Cannot find module 'bun:sqlite'` dans l'éditeur (installation de `@types/bun`, ajout dans `tsconfig.json`), et `ERR_UNSUPPORTED_ESM_URL_SCHEME` (Astro lancé par Node au lieu de Bun, d'où les scripts `bun --bun astro`).

### Mise à jour de la base sur le VPS

- `scp` remplace un fichier existant. Les cas de blocage (droits d'accès, fichiers `-wal` et `-shm` du mode WAL quand le site garde la base ouverte) ont été expliqués avec les commandes à utiliser.

---

## 6. Points à vérifier

Les sources se contredisent ou sont devenues obsolètes sur les points suivants :

- **Emplacement de la base** : `db/portfolio.sqlite` dans les récapitulatifs antérieurs, `data/` d'après la session du 17-18 novembre. La connexion DataGrip pointait encore vers l'ancien chemin.
- **Port de l'application** : 4321 puis 4400 dans le service, mais les logs affichaient encore `--port 4321`. Le tutoriel utilise 3000 et Caddy vise 3001. Un seul port doit être retenu partout.
- **Mode SSR ou statique** : question ouverte dans le récapitulatif du 19 novembre. La configuration Caddy vers un port local suppose le mode SSR.
- **DNS** : le récapitulatif du 15 novembre signale l'absence d'enregistrement `A`, tandis qu'un autre indique que le DNS pointe déjà vers le VPS. À confirmer.
- **IP** : l'IP flottante n'était pas associée et le SSH expirait. Le récapitulatif le plus récent fait état d'un clone et d'un `dist/` présents sur le VPS, ce qui laisse supposer que ces points sont résolus.
- **Images** : elles étant irrécupérables, la conversion en BLOB ne concernera que les nouvelles images. La requête `CAST` ne restaure rien.
- **Compilation** : la mention « non compilé ni testé » de la phase initiale est dépassée. Le build a réussi le 12 novembre.

---

## 7. État actuel et prochaines étapes

**État** :

- Site fonctionnel en local, validé sur ordinateur et mobile.
- Code et `dist/` présents sur le VPS, service systemd arrêté en échec à la dernière mise à jour.
- Visuels (portrait, logos, captures Eyeth) non exportés depuis Figma. Police Kingred non hébergée.
- Route `/media/projet/[id]` et migration BLOB non intégrées aux cartes (`ProjectCard.astro` utilise encore `imageCard`).
- Section « Mes outils » : catégories logiciel et langage gérées par la base, mais le tableau correspondant reste à finaliser.
- Pas de flag « à la une » : le carrousel d'accueil affiche les 6 projets les plus récents.
- URL des projets basées sur `idProjet` (`/projets/1`), non sur un slug lisible.

**Prochaines étapes** :

1. Vérifier si `dist/server/entry.mjs` existe, puis trancher SSR ou statique.
2. Harmoniser le port (service, environnement, Caddy, workflow) et recharger les services.
3. Recharger Caddy, vérifier le HTTPS sur `aglaenicolle.fr`, contrôler que `/db/portfolio.sqlite` renvoie 404.
4. Configurer les secrets GitHub et tester un déploiement automatique.
5. Appliquer les permissions de sécurité (étape 6 du guide) : base, environnement, pare-feu UFW, audit `systemd-analyze`.
6. Ajouter les visuels et la police Kingred dans `public/`.
7. Décider du slug, de la catégorie des outils et du flag « à la une ».
8. Vérifier le rendu mobile et desktop face à la maquette.
9. Si le passage en BLOB est retenu, intégrer la route des images et réparer les cartes.

---

## 8. Fichiers et documents produits

- Base de code initiale du projet Astro (schéma SQL, données de test, scripts, styles, composants, pages), largement modifiée ensuite par l'autrice (textes, code et détails).
- Commentaires explicatifs du code, rédigés par l'IA.
- Archive `portfolio.zip`, mise à jour plusieurs fois.
- `deploy.yml` (GitHub Actions), commit `ba1765f` pour la vérification finale.
- Tutoriel d'hébergement Astro SSR et SQLite sur VPS Infomaniak.
- Scripts `scripts/migrate-blob.mjs` (non exécuté) et requêtes de migration des images.
- Ce document `IA.md`.
