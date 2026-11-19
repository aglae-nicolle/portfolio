# QUALITE.md : contrôle qualité du portfolio

## Ce qui rend ce site particulier

1. **Les images des projets sont stockées en BLOB dans la base.**
2. **Le contenu des pages projet est du HTML stocké en base** : il faut vérifier sa structure une fois rendue.
3. **Le curseur personnalisé** (`Curseur.astro`) et **la visionneuse de la galerie** (`GalerieProjet.astro`) sont les deux composants les plus risqués pour l'accessibilité.
4. **Il n'y a ni formulaire, ni compte, ni cookie, ni statistiques** : une partie des obligations RGPD ne s'applique pas.

## Méthode

J'ai fait une partie des contrôles sur mon ordinateur, avec la version finale du site lancée en local :

- **Lecture du code** : pour vérifier la structure HTML, les attributs d'accessibilité et les textes alternatifs.
- **`curl`** (un outil qui télécharge une page en ligne de commande) : pour mesurer le poids de chaque page et voir les réponses du serveur (page trouvée, page introuvable, redirection, règles de cache).
- **Requêtes SQL sur la base de données** : pour connaître le poids des images et repérer celles qui n'ont pas de texte alternatif.
- **Calcul du contraste** : pour vérifier que chaque couleur de texte se lit assez bien sur son fond, selon la formule des normes WCAG.
- **Navigation au clavier seul**, sans souris : pour vérifier que tout est utilisable de cette façon.
- **NVDA** (un lecteur d'écran) : pour entendre ce qu'une personne aveugle entend sur le site.

D'autres contrôles ne peuvent se faire que sur le site en ligne :

- **Lighthouse** : notes de performance, d'accessibilité et de référencement.
- **WAVE ou axe** : détection automatique des erreurs d'accessibilité.
- **EcoIndex** : note environnementale.
- **Validateur W3C** : vérifie que le HTML est écrit correctement.

Statuts utilisés : **Conforme**, **Corrigé**, **À corriger**, **À vérifier en ligne**.

---

## 1. Accessibilité (WCAG 2.1 AA)

**Conforme**

- `<html lang="fr">` sur toutes les pages.
- Titres de page uniques (« Olyvia | Aglaé Nicolle »…).
- Contrastes du texte entre 4,94:1 et 7,57:1.
- Tous les boutons composés d'une icône ont un `aria-label`.
- `aria-current="page"` dans le header, le footer et les filtres.
- La visionneuse est un `<dialog>` natif (focus piégé, Échap, flèches, zoom au clavier, compteur en `aria-live`).
- Les versions mobile et desktop en double sont masquées en `display: none`, le lecteur d'écran ne lit que la version visible.

**Corrigé**

- « Consulter le site » s'ouvre dans un nouvel onglet et l'annonce maintenant en `sr-only`.
- Hiérarchie des titres : sur `/projets`, les titres des cartes étaient des `<h3>` directement sous le `<h1>`. `ProjectCard` reçoit maintenant le niveau du titre : `<h2>` sur `/projets`, `<h3>` dans le carrousel de l'accueil (sous un `<h2>`).
- Contraste des filtres inactifs : l'opacité de 60 % donnait 2,89:1. Ils sont maintenant en `text-beige-80`, une couleur pleine à 6,9:1.
- Lien « Aller au contenu » ajouté dans `Layout.astro`. C'est le premier élément atteint avec Tab : invisible au départ, il apparaît quand il reçoit le focus et mène au `<main>`.
- Menu mobile : c'est maintenant un `<dialog>` ouvert avec `showModal()`. Le focus reste piégé dans le menu, Échap le ferme et le focus revient sur le bouton « Ouvrir le menu ».
- Curseur personnalisé : un bouton dans le footer permet de le désactiver (choix gardé dans `localStorage`), ce qui rend le curseur du système, par exemple le grand curseur réglé dans Windows. Il n'est jamais activé quand l'utilisateur demande un contraste élevé (`prefers-contrast: more`).
- Animations : le zoom des vignettes de la galerie, le soulèvement des cartes au survol et le défilement doux du carrousel ne s'appliquent plus quand l'utilisateur réduit les animations (`motion-safe:`).
- Taille du texte : les textes de 10 px en mobile (boutons, filtres, mentions en majuscules) passent à 12 px. Les boutons « Télécharger mon CV » ont une largeur minimale au lieu d'une largeur fixe, pour que le texte plus grand y tienne.
- Lien du CV : le lecteur d'écran annonce « Télécharger mon CV (PDF, 250 Ko) ». Le format et le poids sont dans `SITE.cvInfos` (`src/lib/site.ts`), à mettre à jour si le CV change.

Vérifié dans un navigateur sans interface (Chromium piloté par Playwright), sur le build de production lancé en local avec une base de test : 25 appuis sur Tab dans le menu mobile sans en sortir, Échap ferme le menu et rend le focus, le lien d'évitement est le premier élément atteint et mène à `<main>`, le choix du curseur est gardé après rechargement, le curseur reste désactivé en contraste élevé, aucun texte ne déborde à 375 px de large.

**Mesure en ligne**

- Score d'accessibilité Lighthouse : 100 / 100.

## 2. Sobriété et performance

Servir les images comme fichiers séparés a fait passer le HTML de la page Olyvia de 17,9 Mo à 36 Ko, celui de `/projets` de 1,66 Mo à 17,6 Ko et celui de l'accueil de 912 Ko à 91 Ko.

**Corrigé**

- Les images ne sont plus en base64 dans le HTML (+33 % de poids, aucun cache, `loading="lazy"` sans effet). Les routes `/img/projet/[id]` et `/img/galerie/[id]` les servent avec leur type MIME, `Cache-Control: max-age=86400, must-revalidate` et un ETag. Vérifié avec `curl` : 200, puis 304 avec l'ETag, 404 pour un id inconnu.
- Chaque image de carte figurait deux fois dans `/projets` (listes mobile et desktop). Elle n'est plus téléchargée qu'une fois, puisque les deux listes pointent vers la même URL.
- Poids des images en base (une image de la galerie Olyvia pesait 12,7 Mo) : le script d'import compresse maintenant chaque image en WebP qualité 80, avec 1600 px de large au maximum pour la galerie et 800 px pour les cartes (la même image sert aussi en grand dans l'en-tête de la page projet et dans l'aperçu de partage). Pour les images déjà en base, le script `bun scripts/recompresser-images.mjs` les recompresse, après avoir fait une copie de la base. L'option `--essai` affiche le gain sans rien modifier. Testé sur une base de test : 18,3 Mo d'images ramenés à 169 Ko.
- Dimensions des images : les `<img>` des cartes, de l'en-tête des pages projet et de la galerie ont maintenant `width` et `height`, donc le navigateur réserve leur place avant le chargement. Les dimensions sont lues dans l'en-tête du fichier (`dimensionsImage` dans `src/js/backend.ts`, testé sur PNG, JPEG, WebP et GIF). Il n'y a donc pas de nouvelle colonne ni de migration de la base.
- Photo de profil : recadrée en carré et générée en 294, 404 et 721 px, avec `sizes` pour que le navigateur choisisse la bonne taille. Elle pesait 561 Ko ; elle fait maintenant 26 Ko en mobile, 41 Ko en desktop et 96 Ko sur un écran haute densité.
- Polices : Manrope et Mulish sont maintenant hébergées sur le site (`public/fonts`, sous-ensemble latin, 24 Ko et 13 Ko) au lieu de Google Fonts. Kingred passe de `.otf` (62 Ko) à `.woff2` (24 Ko). Il n'y a plus aucune requête vers un autre domaine, ce qui règle aussi le problème juridique des polices Google.
- Curseur : la boucle `requestAnimationFrame` s'arrête quand l'anneau a rejoint le point et repart au mouvement suivant de la souris. La couleur du curseur est revérifiée au défilement et à la fin des transitions de couleur, et non plus toutes les 6 images. Vérifié : 0 appel en 2 secondes souris immobile.

**À faire**

- Lancer `bun scripts/recompresser-images.mjs --essai`, puis `bun scripts/recompresser-images.mjs` pour recompresser les images déjà en base. Tant que ce n'est pas fait, l'image de 12,7 Mo reste en ligne.

**À vérifier en ligne**

- Performance Lighthouse : 95 / 100 ; bonnes pratiques Lighthouse : 100 / 100 ; EcoIndex : 76 / 100 (accueil), 64 / 100 (Olyvia, plus lourde à cause des images de la galerie).

**Choix assumé**

- Le site est en SSR alors qu'un build statique suffirait, parce que la base est mise à jour sur le VPS sans rebuild.

## 3. Référencement

Tous les défauts relevés sont corrigés et vérifiés avec `curl`. Score SEO Lighthouse : 100 / 100.

- Conforme dès le départ : un `<title>` par page, balises sémantiques (`header`, `nav`, `main`, `footer`, `article`).
- Chaque page a sa propre `meta description`, coupée à 160 caractères.
- `site` est déclaré dans `astro.config.mjs` (le défaut `localhost` est retiré du workflow) et chaque page a une URL canonique. Les filtres `/projets?ecole=…` ont pour canonique `/projets`.
- `robots.txt` et `sitemap.xml` sont générés à partir de la base, donc un nouveau projet apparaît sans rebuild.
- Un projet inexistant renvoie un vrai 404 (`Astro.rewrite`) au lieu d'une redirection 302. La 404 et la page de test sont en `noindex`.
- Balises Open Graph et Twitter Card, avec une image de partage de 1200 × 630 px par défaut.
- Les URL deviennent `/projets/olyvia` au lieu de `/projets/2`, avec une redirection 301 depuis les anciennes.
- Les images ont maintenant leur propre URL et peuvent être indexées.
- Bloc JSON-LD `Person` sur l'accueil.
- Le lien « Consulter le site » est lu « Consulter le site Olyvia (nouvel onglet) ».

## 4. Conformité juridique

**Ce qui ne s'applique pas**

- Bandeau cookies : aucun cookie ni outil de statistiques. Le seul stockage est celui du curseur : sa position en `sessionStorage` et, s'il est désactivé, ce choix en `localStorage`. Ces informations ne quittent pas le navigateur et servent une fonction demandée par l'utilisateur, ce qui les dispense de consentement.
- Formulaire RGPD : le contact passe par `mailto:` et `tel:`, je ne collecte rien directement.
- CGV : aucune activité commerciale.

**Conforme**

- Lien « Mentions légales » dans le footer de toutes les pages.
- Les logos d'outils (Figma, GitHub…) ne servent qu'à désigner l'outil.
- Les projets d'école et les marques fictives sont présentés comme des exercices.

**Corrigé**

- Les polices Google envoyaient l'adresse IP des visiteurs à Google (pratique jugée contraire au RGPD, LG München, 20/01/2022). Manrope et Mulish (SIL Open Font License, auto-hébergement autorisé) sont maintenant hébergées sur le site. Vérifié dans Chromium : aucune requête vers un autre domaine.
- Identité de l'éditeur : la date de naissance, qu'aucun texte n'exige, est retirée (minimisation des données). La page précise que je publie le site à titre personnel et non professionnel, et que l'adresse indiquée est celle de l'IUT où je suis étudiante.
- Mention de Netlify : elle est remplacée. La page dit maintenant que le site lui-même n'enregistre aucune donnée de visite, et que les journaux techniques du serveur (IP, page, date) relèvent de l'hébergeur. Le VPS ne m'appartient pas : je n'indique pas de durée de conservation que je ne peux pas garantir.
- Information RGPD : la mention d'un formulaire inexistant est retirée. La section « Données & Cookies » décrit ce que le site ne fait pas (formulaire, cookie, statistiques, service extérieur), le stockage du curseur dans le navigateur, les données reçues quand on me contacte (finalité : répondre ; durée : 3 ans au plus après le dernier échange), les droits d'accès, de rectification, d'effacement et d'opposition, et la réclamation auprès de la CNIL.
- Section « Crédits » ajoutée : photo de la pâquerette (la mienne), coauteurs des projets de groupe (nommés sur chaque page projet), auteurs et licences des polices, logos des outils. Les deux photos Unsplash de `src/assets` ne sont utilisées par aucune page : elles ne sont pas publiées et n'ont pas à être créditées.
- HTTPS : vérifié sur le site en ligne, HTTP redirige vers HTTPS (308) et le certificat est valide. L'en-tête `Strict-Transport-Security` manquait. Il est ajouté par `src/middleware.ts` à toutes les réponses du site (vérifié avec `curl` en local).

**Risque accepté**

- Le HTML de la base est inséré sans filtrage (`set:html`). Je suis la seule à écrire dans la base, accessible uniquement par SSH avec une clé.

---

## Synthèse et priorités

Les défauts les plus lourds venaient d'un seul choix : mettre les images dans le HTML. Les servir comme fichiers séparés a allégé les pages, permis le cache, évité les images téléchargées deux fois, rendu les images indexables et permis les aperçus de partage. Le référencement, l'accessibilité et la conformité juridique sont entièrement corrigés.

Scores mesurés sur le site en ligne :

- Lighthouse : performance 95, accessibilité 100, bonnes pratiques 100, SEO 100.
- EcoIndex : 76 sur l'accueil, 64 sur la page Olyvia.

Ordre prévu pour la suite :

1. Remplacer l'image en png de Olyvia par un format WebP. Relever ensuite les scores à nouveau.

## Suivi des corrections

Toutes faites le 19/11/2026 :

- Images servies par `/img/…` avec cache et ETag. Vérifié : 200 puis 304, HTML d'Olyvia passé de 17,9 Mo à 36 Ko.
- Descriptions propres à chaque page. Vérifié : 7 descriptions différentes.
- `site` et canonique. Vérifié : la canonique de `/projets?ecole=UTBM` est `/projets`.
- `robots.txt` et `sitemap.xml`. Vérifié : 200, 4 pages et 3 projets.
- Vrai code 404. Vérifié : `/projets/999` répond 404.
- Open Graph. Vérifié : balises présentes, image en `image/jpeg`.
- URL lisibles. Vérifié : `/projets/2` redirige en 301 vers `/projets/olyvia`.
- JSON-LD `Person`. Vérifié : JSON valide dans le HTML.
- Lien « Consulter le site » explicite. Vérifié dans le HTML.
- Accessibilité : titres des cartes, contraste des filtres, alt, lien d'évitement, menu mobile en `<dialog>`, option pour désactiver le curseur, `motion-safe:`, texte à 12 px minimum, format et poids du CV. Vérifié dans Chromium (Playwright) : focus piégé dans le menu, Échap, lien d'évitement, curseur, aucun débordement à 375 px.
- Sobriété : compression des images à l'import et script de recompression des images en base, `width` et `height` sur les images, photo de profil recadrée en trois tailles, polices hébergées sur le site et Kingred en `.woff2`, boucle du curseur arrêtée souris immobile. Vérifié : 18,3 Mo → 169 Ko sur la base de test, photo de 561 Ko → 41 Ko, aucune requête externe, 0 appel `requestAnimationFrame` souris immobile.
- Conformité juridique : mentions légales réécrites (date de naissance retirée, Netlify remplacé, information RGPD exacte, section « Crédits »), en-tête `Strict-Transport-Security` ajouté. Vérifié : page rendue en mobile et desktop, HSTS présent sur toutes les réponses, redirection HTTP → HTTPS et certificat valides sur le site en ligne.
