# QUALITE.md : contrôle qualité du portfolio

## Ce qui rend ce site particulier

Je n'ai pas retenu une grille générique. Je suis partie de ce qui distingue mon site et peut poser problème :

1. **Les images des projets sont stockées en BLOB dans la base.** Au départ, elles étaient envoyées dans le HTML sous forme de `data:` URL en base64 (`getImageUrl` dans `src/js/backend.ts`). Depuis la correction P2, elles sont servies par des routes `/img/…`. Cela pèse sur tout le reste : poids des pages, cache, chargement différé, référencement des images.
2. **Le contenu des pages projet est du HTML stocké en base** (`contenuPageProjet`, `descriptionProjet`). Je ne contrôle donc pas sa structure dans le code : il faut la vérifier une fois rendue.
3. **Il y a un curseur personnalisé** (`Curseur.astro`) qui masque le curseur natif, et une **galerie avec une visionneuse** qui gère le zoom (`GalerieProjet.astro`). Ce sont les deux composants les plus risqués pour l'accessibilité.
4. **Le site affiche mes coordonnées personnelles** (email, téléphone, CV) et charge des **polices Google**. Ce sont les deux points juridiques qui me concernent directement.
5. **Il n'y a ni formulaire, ni compte, ni cookie, ni outil de statistiques.** Une partie des obligations RGPD habituelles ne s'applique donc pas. Je le justifie plus bas au lieu de recopier des critères sans objet.

## Méthode et outils

| Outil / méthode | Utilisé pour |
| --- | --- |
| Lecture du code source (`src/`) | Structure HTML, attributs ARIA, textes alternatifs, balises `<head>` |
| `curl` sur le build de production lancé en local (`bun dist/server/entry.mjs`) | Poids réel de chaque page, codes HTTP, en-têtes `Cache-Control`, présence de `robots.txt` ou d'un sitemap |
| Requêtes SQL sur `data/portfolio.sqlite` | Taille des images en base, textes alternatifs (`altImg`) manquants |
| Script de calcul du contraste (formule WCAG 2.x de luminance relative), appliqué aux couleurs de `global.css` | Rapports de contraste de chaque paire texte/fond utilisée |
| Navigation au clavier seul (Tab, Maj+Tab, Entrée, Échap, flèches) | Ordre du focus, menu mobile, visionneuse |
| Lighthouse (Chrome DevTools), mobile, navigation privée | Scores performance, accessibilité, SEO, sur le site en ligne |
| WAVE ou axe DevTools | Détection automatique des erreurs d'accessibilité |
| NVDA (lecteur d'écran sous Windows) | Annonce des liens, boutons, titres, de la visionneuse |
| GreenIT-Analysis ou EcoIndex | Note environnementale (taille du DOM, nombre de requêtes, poids) |
| Validateur W3C (validator.w3.org) | Validité du HTML rendu |

Légende des statuts :

- ✅ **Conforme** : vérifié, rien à corriger.
- 🛠️ **Corrigé** : défaut trouvé puis corrigé (la correction est décrite).
- ❌ **À corriger** : défaut trouvé, correction prévue (décrite dans la dernière colonne).
- 🔲 **À vérifier en ligne** : ne peut se contrôler que sur le site déployé (en-têtes du serveur de production, scores Lighthouse).

---

## 1. Accessibilité

Référence : WCAG 2.1 niveau AA (base du RGAA).

| # | Critère | Vérification | Constat sur mon site | Statut / correction |
| --- | --- | --- | --- | --- |
| A1 | Langue de la page déclarée | Code de `Layout.astro` | `<html lang="fr">` sur toutes les pages | ✅ |
| A2 | Titre de page unique et explicite | `curl` + `<title>` de chaque page | « Accueil \| Aglaé Nicolle », « Olyvia \| Aglaé Nicolle »… tous distincts | ✅ |
| A3 | Un seul `<h1>` par page, hiérarchie des titres sans saut | `curl` + lecture des composants | Un seul `<h1>` partout. Mais sur `/projets`, les cartes ont un `<h3>` directement sous le `<h1>` (il manque un niveau `<h2>`) | ❌ Passer le titre de `ProjectCard` en `<h2>` sur `/projets` (prop `niveau`), ou ajouter un `<h2>` masqué visuellement « Liste des projets » |
| A4 | Contraste du texte ≥ 4,5:1 | Script de calcul sur les couleurs du thème | Texte vert foncé sur beige 7,47:1 ; titres marron sur beige 7,57:1 ; liens vert clair sur vert foncé 5,33:1 ; lien actif jaune sur vert foncé 4,94:1 ; bouton `.btn` marron sur jaune 5,01:1 ; texte des cartes 5,06:1 | ✅ |
| A5 | Contraste des filtres inactifs de `/projets` | Même script, avec l'opacité de 60 % appliquée | Vert foncé à 60 % sur beige : **2,89:1** (en dessous de 4,5:1) | ❌ Remplacer `lg:opacity-60` par une couleur pleine qui respecte 4,5:1 (par exemple `text-beige-80` #58534e) |
| A6 | Textes alternatifs des images | Code + requête SQL sur `IMAGE.altImg` | Toutes les images de galerie ont un `altImg` (0 manquant sur 11). Les images décoratives (logo, flèches, icônes) ont `alt=""`. Les images des cartes ont `alt=""` parce que le titre du projet les suit, ce qui est voulu. Faute dans l'alt de l'accueil : « qui souri » | ❌ Corriger en « qui sourit » dans `index.astro` |
| A7 | Boutons composés seulement d'une icône : nom accessible | Code | Menu (« Ouvrir le menu », « Fermer le menu »), flèches du carrousel (« Projets précédents / suivants »), visionneuse (« Zoomer », « Fermer »…) : tous ont un `aria-label` | ✅ |
| A8 | Page courante signalée dans la navigation | Code | `aria-current="page"` dans le header, le footer et les filtres | ✅ |
| A9 | Focus visible au clavier | Navigation au clavier | Visible sur les vignettes de galerie (anneau jaune), les liens du sommaire (surlignage) et les boutons de la visionneuse. Sur le reste, c'est l'outline par défaut du navigateur : à vérifier sur le header vert foncé | 🔲 Si l'outline par défaut est peu visible sur le vert, ajouter `focus-visible:outline-jaune` |
| A10 | Lien d'évitement (« Aller au contenu ») | Code | Absent. Le header est répété sur chaque page | ❌ Ajouter dans `Layout.astro` un lien `#contenu`, masqué jusqu'à ce qu'il reçoive le focus, avec `id="contenu"` sur `<main>` |
| A11 | Menu mobile utilisable au clavier | Clavier + code de `Header.astro` | `role="dialog"` et `aria-modal`, `aria-expanded` à jour, fermeture par Échap, le focus va sur « Fermer » à l'ouverture puis revient sur le bouton. Mais le focus n'est **pas piégé** : Tab finit par sortir du menu vers la page cachée derrière | ❌ Remplacer la `<div>` par un `<dialog>` ouvert avec `showModal()` (comme la visionneuse), qui piège le focus nativement |
| A12 | Visionneuse de la galerie utilisable au clavier et au lecteur d'écran | Clavier + code | `<dialog>` natif (focus piégé, Échap), focus rendu à la vignette à la fermeture, flèches ← → pour naviguer, + / − / 0 pour zoomer, compteur en `aria-live`. Le bouton de chaque vignette annonce « Agrandir l'image : … » | ✅ |
| A13 | Curseur personnalisé | Code de `Curseur.astro` | Il n'est activé qu'avec une vraie souris (`pointer: fine`), il est en `aria-hidden` et ne gêne donc ni le tactile ni le lecteur d'écran. Mais `cursor: none !important` **supprime aussi le grand curseur** que certaines personnes malvoyantes règlent dans Windows | ❌ Prévoir un bouton pour désactiver le curseur (choix gardé en `localStorage`), et ne pas l'activer quand `prefers-contrast: more` |
| A14 | Respect de `prefers-reduced-motion` | Code de `global.css` et `Curseur.astro` | Défilement doux, transitions entre pages et onde au clic sont désactivés quand l'utilisateur réduit les animations. Il reste le zoom au survol des vignettes (`group-hover:scale-105`) | ❌ Ajouter `motion-safe:` devant `group-hover:scale-105` |
| A15 | Taille minimale du texte | Lecture du guide de style | Les boutons et mentions en majuscules font **10 px** en mobile (`text-btn`, `text-sm-upper`, sous-titre du footer) | ❌ Passer à 12 px minimum en mobile. Le zoom du navigateur reste possible (tailles en px, pas de blocage du zoom dans le viewport) |
| A16 | Lien qui ouvre un nouvel onglet | Code de `projets/[slug].astro` | « Consulter le site » s'ouvrait en `target="_blank"` sans prévenir | 🛠️ Ajout de `<span class="sr-only"> Olyvia (nouvel onglet)</span>` dans le lien (corrigé en même temps que R11) |
| A17 | Lien de téléchargement du CV | Code | « Télécharger mon CV » n'indique ni le format ni le poids | ❌ Afficher « (PDF, 250 Ko) » |
| A18 | Contenu en double masqué | Code | Les versions mobile et desktop du footer et de la liste des projets sont toutes les deux dans le DOM, l'une en `display: none`. Le lecteur d'écran ne lit que la version visible | ✅ (c'est en revanche un problème de poids, voir P3) |
| A19 | Audit automatique | WAVE / axe + Lighthouse | Scores à relever sur le site en ligne | 🔲 Accessibilité Lighthouse : [à compléter] / 100 |

## 2. Sobriété et performance

Mesures faites sur le build de production lancé en local (HTML non compressé). Avant la correction P2, les images étaient dans le HTML. Après, elles sont des fichiers à part, mis en cache et chargés à la demande :

| Page | HTML avant (images comprises) | HTML après P2 (19/11/2026) |
| --- | --- | --- |
| `/a-propos` | 12,7 Ko (+ photo de 561 Ko) | 13,7 Ko (+ photo de 561 Ko) |
| `/mentions-legales` | 11,2 Ko | 12,1 Ko |
| Eyeth | 248 Ko | 52,9 Ko |
| `/` (accueil) | 912 Ko | 91,2 Ko |
| TiK•TaK | 1,26 Mo | 49,2 Ko |
| `/projets` | 1,66 Mo | 17,6 Ko |
| Olyvia | **17,9 Mo** | 36,0 Ko (+ images de galerie, dont une de 12,7 Mo : voir P1) |

Le léger gain de poids des petites pages vient des balises ajoutées pour le référencement (canonique, Open Graph).

| # | Critère | Vérification | Constat sur mon site | Statut / correction |
| --- | --- | --- | --- | --- |
| P1 | Poids des images adapté à leur taille d'affichage | SQL `length(img)` + `curl` | Une image de la galerie Olyvia pèse **12,7 Mo**. C'est elle qui fait monter la page à 17,9 Mo. Les images de carte font de 103 à 340 Ko pour un affichage de 246 px de large | ❌ Recompresser avant l'import (WebP, 1600 px de large au maximum pour la galerie, 500 px pour les cartes, environ 200 Ko au maximum) puis réimporter avec `npm run db:image` |
| P2 | Images servies comme fichiers (cache, chargement différé) | Code de `getImageUrl` | Les BLOB étaient transformés en `data:` base64 directement dans le HTML. Conséquences : +33 % de poids à cause du base64, **aucune mise en cache** (tout était retéléchargé à chaque visite), et `loading="lazy"` ne servait à rien puisque les octets étaient déjà dans la page | 🛠️ Deux routes, `src/pages/img/projet/[id].ts` (image de carte) et `src/pages/img/galerie/[id].ts`, renvoient le BLOB avec son `Content-Type`, `Cache-Control: public, max-age=86400, must-revalidate` et un `ETag`. Je n'ai pas mis `immutable` parce que l'URL ne change pas quand je remplace une image en base. **Vérifié** avec `curl` : 200 avec le bon type MIME, puis **304** quand on renvoie l'ETag, 404 pour un id inconnu, plus aucune `data:image` dans le HTML de `/projets` |
| P3 | Pas de ressources chargées deux fois | Code de `projets/index.astro` | Les listes mobile et desktop des projets sont toutes deux dans le HTML : chaque image de carte (en base64) y figurait **deux fois**. C'est pour cela que `/projets` pesait 1,66 Mo | 🛠️ Réglé par P2 : les deux listes pointent maintenant vers la même URL et le navigateur ne télécharge l'image qu'une fois (`/projets` : 1,66 Mo → 17,6 Ko). La double liste reste dans le DOM. C'est acceptable vu sa taille |
| P4 | Images avec `width` et `height` (pas de décalage de mise en page) | Code | Présents sur le logo, les icônes, la photo (via `<Image>`). Absents sur les images des cartes et de la galerie | ❌ Enregistrer les dimensions en base lors de l'import et les passer à `<img>` |
| P5 | Photo de profil redimensionnée | `curl` sur `/_image` | `<Image>` sans `width` : le fichier généré fait 721 × 1433 px (561 Ko) alors qu'il s'affiche à 147 px en mobile et 404 px en desktop | ❌ Ajouter `width={808}` et `widths`/`sizes` au composant `<Image>` |
| P6 | Polices | Code de `Layout.astro` et `global.css` | Kingred en `.otf` (62 Ko) avec `font-display: swap` et `preload` : bien. Manrope et Mulish viennent de Google Fonts, ce qui ajoute 2 domaines tiers et une requête bloquante | ❌ Passer Kingred en `.woff2` et héberger Manrope et Mulish sur le site (voir aussi J5) |
| P7 | JavaScript minimal | Code | Pas de framework côté client, seulement de petits scripts Astro. Mais le curseur lance une boucle `requestAnimationFrame` **qui ne s'arrête jamais**, même souris immobile, et appelle `getComputedStyle` toutes les 6 images : le processeur travaille en permanence | ❌ Arrêter la boucle quand l'anneau a rejoint le point, et la relancer au `pointermove` |
| P8 | Cache des ressources statiques | `curl -I` en local | `/_astro/*` (fichiers dont le nom contient un hash) et `/fonts/` sont servis avec `Cache-Control: public, max-age=0` par le serveur Node | 🔲 Vérifier en ligne. Si le reverse proxy ne corrige pas cet en-tête, ajouter une règle `max-age=31536000, immutable` pour `/_astro/` |
| P9 | Compression gzip ou Brotli | `curl` en local | Le serveur Node ne compresse pas | 🔲 Vérifier en ligne (`curl -I -H "Accept-Encoding: br" …`). À activer dans le reverse proxy si ce n'est pas fait |
| P10 | Rendu serveur justifié | Analyse | Le site est en SSR parce qu'il lit SQLite à chaque requête, alors que le contenu ne change qu'au moment où j'ajoute un projet. Un build statique (`output: 'static'`) servirait des fichiers prêts, sans calcul côté serveur | Choix assumé pour l'instant (la base est mise à jour sur le VPS sans rebuild). Piste d'amélioration |
| P11 | Mesure globale | Lighthouse + EcoIndex sur le site en ligne | À relever avant et après les corrections P1 à P3 | 🔲 Performance Lighthouse : [à compléter] ; EcoIndex : [à compléter] (accueil), [à compléter] (Olyvia) |

## 3. Référencement

| # | Critère | Vérification | Constat sur mon site | Statut / correction |
| --- | --- | --- | --- | --- |
| R1 | `<title>` unique par page | `curl` | Oui, et le titre des pages projet vient de la base | ✅ |
| R2 | `meta description` pertinente et unique | `curl` + code | Les pages projet utilisaient `descriptionProjet`. Accueil, Projets, À propos et Mentions légales avaient **la même** description par défaut | 🛠️ Chaque page passe sa propre `description` à `<Layout>`. `/projets?ecole=…` a une description qui dépend du filtre (seulement pour les 4 filtres connus). Les pages projet commencent par le nom du projet. Le Layout coupe sur un mot au-delà de 160 caractères, la limite d'affichage de Google. **Vérifié** avec `curl` sur les 7 pages : 7 descriptions différentes |
| R3 | Structure sémantique | Code | `<header>`, `<nav aria-label>`, `<main>`, `<footer>`, `<article>` sur les pages projet, un seul `<h1>` | ✅ (voir A3 pour la hiérarchie) |
| R4 | `site` déclaré dans Astro et URL canonique | Code de `astro.config.mjs` + `curl` | Le workflow passait `SITE_URL` au build mais `astro.config.mjs` ne le lisait pas, et sa valeur par défaut était `http://localhost:3001`. Aucune balise `<link rel="canonical">`. Les filtres `/projets?ecole=…` donnaient 4 URL au contenu presque identique | 🛠️ `site: process.env.SITE_URL \|\| 'https://aglaenicolle.fr'` dans [astro.config.mjs](astro.config.mjs). Le workflow ne force plus `localhost`. [Layout.astro](src/layouts/Layout.astro) ajoute `<link rel="canonical">` construit à partir du seul chemin. **Vérifié** : `/projets?ecole=UTBM` a pour canonique `https://aglaenicolle.fr/projets` |
| R5 | `robots.txt` et sitemap | `curl /robots.txt`, `/sitemap-index.xml` | Les deux renvoyaient 404 | 🛠️ [robots.txt.ts](src/pages/robots.txt.ts) (avec la ligne `Sitemap:` en URL absolue, et la page de test exclue) et [sitemap.xml.ts](src/pages/sitemap.xml.ts). Le sitemap est lu dans la base à chaque requête : un projet ajouté y apparaît sans rebuild. Je n'ai pas utilisé `@astrojs/sitemap`, qui ne voit pas les routes dynamiques d'un site en SSR. `<link rel="sitemap">` dans le `<head>`. **Vérifié** : les deux répondent 200, et le sitemap liste les 4 pages et les 3 projets |
| R6 | Code HTTP correct pour une page inexistante | `curl /projets/999` | Une URL inconnue servait bien la page 404 avec le code 404. Mais un projet inexistant faisait une **redirection 302** vers `/404`, que Google traite comme une « soft 404 » | 🛠️ `return Astro.rewrite("/404")` : la page 404 s'affiche à l'adresse demandée, avec le code 404. La page 404 et la page de test ont aussi `<meta name="robots" content="noindex">` et pas de canonique. **Vérifié** : `/projets/999` et `/projets/inconnu` répondent 404 |
| R7 | Partage sur les réseaux (Open Graph) | `curl` | Aucune balise `og:title`, `og:description`, `og:image`. Un lien collé sur LinkedIn ou dans Discord n'affichait pas d'aperçu, ce qui compte pour un portfolio envoyé à des recruteurs | 🛠️ `og:type` (`article` pour les projets), `og:site_name`, `og:locale`, `og:title`, `og:description`, `og:url`, `og:image` en URL absolue, `twitter:card`. Image d'un projet : son image de carte (`/img/projet/<id>`, possible grâce à P2). Image des autres pages : la photo de l'accueil recadrée en 1200 × 630 px en JPEG, le format conseillé par les réseaux sociaux. **Vérifié** : balises présentes, l'image répond 200 en `image/jpeg`. 🔲 À tester sur le site en ligne avec l'inspecteur de publication de LinkedIn |
| R8 | URL lisibles | Lecture des routes | `/projets/1`, `/projets/2` : l'URL ne disait rien du projet | 🛠️ La route devient `projets/[slug].astro` → `/projets/eyeth`, `/projets/olyvia`, `/projets/tik-tak`. Le slug est calculé à partir du nom (`slugProjet` dans `src/lib/db.ts`), donc pas de nouvelle colonne ni de migration de la base sur le VPS. Les anciennes URL numériques font une **redirection 301** vers la nouvelle, pour que les liens déjà partagés continuent de marcher. La page de test `projets/olyvia.astro`, qui aurait pris la place de `/projets/olyvia`, est déplacée dans `brouillon-projet.astro`. **Vérifié** : `/projets/2` → 301 vers `/projets/olyvia` |
| R9 | Images indexables | Code | Les images en `data:` ne sont pas indexées par Google Images | 🛠️ Réglé par P2 : chaque image a maintenant sa propre URL, et son `alt` (vient de la base) |
| R10 | Données structurées | — | Aucune. Un bloc JSON-LD `Person` (nom, métier, liens) aiderait le moteur à associer le site à mon nom | 🛠️ JSON-LD `Person` sur l'accueil : nom, métier, URL, email, ville, formation, langages (repris de la base). Le champ `SITE.profils` (dans `src/lib/site.ts`) servira à ajouter les liens LinkedIn ou GitHub (`sameAs`). 🔲 À valider en ligne avec le test des résultats enrichis de Google (search.google.com/test/rich-results) |
| R11 | Liens explicites | Code | Les boutons sont explicites (« En savoir plus sur mes projets »). « Consulter le site » se comprenait dans la page du projet mais pas hors contexte | 🛠️ Ajout du nom du projet et de « (nouvel onglet) » en `sr-only` : le lien est lu « Consulter le site Olyvia (nouvel onglet) » |
| R12 | Audit | Lighthouse SEO + Search Console | À relever en ligne après le déploiement. Penser à envoyer `https://aglaenicolle.fr/sitemap.xml` dans la Search Console | 🔲 SEO Lighthouse : [à compléter] / 100 |

## 4. Conformité juridique

### Ce qui ne s'applique pas, et pourquoi

- **Bandeau cookies** : le site ne dépose aucun cookie et n'utilise aucun outil de statistiques ni de publicité. Le seul stockage est un `sessionStorage` (la position du curseur entre deux pages) : il ne quitte pas le navigateur et disparaît à la fermeture de l'onglet. Aucun consentement n'est donc à recueillir (art. 82 de la loi Informatique et Libertés, lignes directrices de la CNIL). Les polices Google sont un cas à part, traité en J5.
- **Politique de confidentialité détaillée et formulaire RGPD** : il n'y a pas de formulaire ; le contact passe par `mailto:` et `tel:`. Je ne collecte donc rien directement. Une courte section d'information suffit (voir J4).
- **CGV** : le site n'a aucune activité commerciale.

| # | Critère | Vérification | Constat sur mon site | Statut / correction |
| --- | --- | --- | --- | --- |
| J1 | Mentions légales accessibles depuis toutes les pages (LCEN, art. 6-III) | Code du footer | Lien « Mentions légales » dans le footer, sur mobile et sur desktop | ✅ |
| J2 | Identité de l'éditeur | Page `/mentions-legales` | Nom, email et téléphone présents. L'adresse indiquée est celle de l'IUT et non mon domicile. Pour un particulier non professionnel, la LCEN permet de ne pas publier son adresse à condition que l'hébergeur ait mes coordonnées. La **date de naissance** n'est demandée par aucun texte | ❌ Retirer la date de naissance (minimisation des données). Indiquer que l'adresse est celle de l'établissement, ou choisir la formule « éditeur non professionnel, coordonnées détenues par l'hébergeur » |
| J3 | Hébergeur exact | Comparaison entre la page et l'hébergement réel | La section Hébergement indique Infomaniak (correct). Mais la section Données parle de statistiques « opérées par l'hébergeur **Netlify** », qui n'est pas mon hébergeur | ❌ Remplacer par Infomaniak et décrire ce qui est vraiment collecté : journaux du serveur (adresse IP, page, date), leur durée de conservation, aucune statistique |
| J4 | Information RGPD exacte | Lecture de la page | Elle parle de données collectées « via le formulaire » alors qu'il n'y en a pas | ❌ Réécrire : responsable du traitement, données traitées (emails reçus, journaux du serveur), finalité, durée, droits (accès, effacement) et comment les exercer, droit de réclamation auprès de la CNIL |
| J5 | Transferts de données vers des tiers | Onglet Réseau de DevTools + code | Chaque visite envoie l'adresse IP du visiteur à Google (fonts.googleapis.com, fonts.gstatic.com) sans qu'il le sache. Un tribunal allemand a jugé cette pratique contraire au RGPD (LG München, 20/01/2022) | ❌ Héberger Manrope et Mulish sur le site (`public/fonts`). Cela règle aussi P6 |
| J6 | Droits sur les polices | Licences | Manrope et Mulish : SIL Open Font License, auto-hébergement autorisé. **Kingred** : police d'une fonderie indépendante dont la licence gratuite est souvent limitée à l'usage personnel | 🔲 Retrouver la licence de Kingred et la conserver. Le portfolio est non commercial, mais il faut le vérifier. Créditer la police dans les mentions légales |
| J7 | Droits sur les images | Inventaire de `src/assets` et de la base | Captures et maquettes de mes projets : j'en suis l'autrice. Pour les projets de groupe (TiK•TaK…), les membres de l'équipe sont coauteurs. Il y a des photos **Unsplash** dans `src/assets` (`crunch/`, `jeuLettres/`) : la licence Unsplash permet de les utiliser sans obligation de citer l'auteur. L'origine de la paquerette de la page d'accueil n'est pas documentée | ❌ Ajouter une section « Crédits » : photographes Unsplash avec un lien, origine de la paquerette, mention des coauteurs des projets de groupe (déjà nommés dans le contenu des projets) |
| J8 | Logos de marques (outils) | Liste des outils | Logos Figma, GitHub, Astro… : ils ne servent qu'à désigner l'outil que j'utilise, sans laisser croire à un partenariat | ✅ |
| J9 | Données personnelles publiées volontairement | Lecture des pages + CV.pdf | Email et téléphone affichés en clair sur 3 pages, CV téléchargeable. C'est mon choix pour être contactée, mais cela expose au démarchage et aux robots collecteurs d'adresses. Le CV ne doit pas contenir d'adresse postale complète | 🔲 Relire le CV avant chaque mise en ligne. Option : n'afficher le téléphone que dans le CV |
| J10 | Contenus des projets d'école | — | Les sujets d'évaluation de l'IUT et les marques fictives (TiK•TaK) sont présentés comme des exercices, sans prétendre à une marque réelle | ✅ |
| J11 | Sécurité (HTTPS) | En-têtes de la production | À vérifier : redirection HTTP vers HTTPS, certificat valide, en-tête `Strict-Transport-Security` | 🔲 |
| J12 | Injection de HTML depuis la base | Code (`set:html`) | Le HTML stocké en base est inséré sans être filtré. Le risque est limité parce que je suis la seule à écrire dans la base, mais un accès au VPS suffirait pour injecter un script | Risque accepté et documenté. La base n'est accessible que par SSH avec une clé |

---

## Synthèse et priorités

Les défauts qui ont le plus d'effet venaient tous du même choix : **mettre les images dans le HTML**. En les servant comme de vrais fichiers (P2), j'ai réglé en même temps P2, P3, R9, et rendu R7 possible. Le HTML de la page Olyvia est passé de 17,9 Mo à 36 Ko. Il reste à recompresser les images elles-mêmes (P1).

Tous les critères de **référencement** que j'ai relevés sont corrigés. Il reste à les contrôler en ligne (R7, R10, R12).

Ordre de correction prévu pour la suite :

1. **P1** : recompresser les images de la base, à commencer par celle de 12,7 Mo de la galerie Olyvia.
2. **J3 + J4 + J2** : corriger les mentions légales (Netlify, formulaire inexistant, date de naissance). Ce sont des corrections simples mais visibles par le jury.
3. **J5 + P6** : héberger les polices sur le site.
4. **A5, A10, A11, A13** : contraste des filtres, lien d'évitement, focus piégé dans le menu mobile, option pour désactiver le curseur.
5. Relever les scores Lighthouse et EcoIndex en ligne (lignes 🔲) et les noter ici.

## Suivi des corrections

| Date | Critère | Correction faite | Vérification après correction |
| --- | --- | --- | --- |
| 19/11/2026 | P2, P3, R9 | Images en BLOB servies par `/img/projet/<id>` et `/img/galerie/<id>`, avec cache d'un jour et ETag, au lieu de `data:` base64 | `curl` : 200 puis 304 avec l'ETag. HTML de `/projets` passé de 1,66 Mo à 17,6 Ko, celui d'Olyvia de 17,9 Mo à 36 Ko |
| 19/11/2026 | R2 | Description propre à chaque page, coupée à 160 caractères | `curl` : 7 descriptions différentes |
| 19/11/2026 | R4 | `site` dans `astro.config.mjs`, canonique dans `Layout.astro`, valeur par défaut `localhost` retirée du workflow | `curl` : la canonique de `/projets?ecole=UTBM` est `/projets` |
| 19/11/2026 | R5 | Routes `robots.txt` et `sitemap.xml` générées à partir de la base | `curl` : 200, 4 pages et 3 projets dans le sitemap |
| 19/11/2026 | R6 | `Astro.rewrite("/404")` au lieu d'une redirection 302 ; `noindex` sur la 404 et la page de test | `curl` : `/projets/999` répond 404 |
| 19/11/2026 | R7 | Balises Open Graph et Twitter Card ; image de partage par défaut en 1200 × 630 px | `curl` : balises présentes, image en 200 `image/jpeg` |
| 19/11/2026 | R8 | URL `/projets/<slug>` calculées à partir du nom, 301 depuis les anciennes URL numériques, page de test déplacée | `curl` : `/projets/2` → 301 vers `/projets/olyvia` |
| 19/11/2026 | R10 | JSON-LD `Person` sur l'accueil | JSON présent et valide dans le HTML. Test des résultats enrichis de Google à faire en ligne |
| 19/11/2026 | R11, A16 | Nom du projet et « (nouvel onglet) » en `sr-only` dans « Consulter le site » | HTML vérifié avec `curl` |
