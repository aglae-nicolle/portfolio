-- MLD corrigé : base SQLite du portfolio
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ECOLE (
  idEcole   INTEGER PRIMARY KEY AUTOINCREMENT,
  nomEcole  TEXT NOT NULL            -- 'UTBM', 'IUT MMI', 'Personnels'
);

CREATE TABLE IF NOT EXISTS PROJET (
  idProjet            INTEGER PRIMARY KEY AUTOINCREMENT,
  nomProjet           TEXT NOT NULL,
  imageCard           TEXT,          -- chemin de l'image de la carte (ex: /images/projets/eyeth-card.webp)
  descriptionProjet   TEXT,
  urlProjet           TEXT,
  contenuPageProjet   TEXT,          -- contenu de la page dynamique (HTML/Markdown, inclut l'équipe)
  anneeRealisation    INTEGER
);

CREATE TABLE IF NOT EXISTS OUTILS (
  idOutils    INTEGER PRIMARY KEY AUTOINCREMENT,
  nomOutils   TEXT NOT NULL,
  iconOutils  TEXT,                  -- code SVG de l'icône (ou chemin vers un fichier)
  typeOutils  TEXT CHECK (typeOutils IN ('logiciel','langage')), -- colonne « Les logiciels » / « Les langages »
  ordreOutils INTEGER                -- ordre d'affichage dans sa colonne
);

CREATE TABLE IF NOT EXISTS IMAGE (
  idImg     TEXT PRIMARY KEY,
  img       TEXT NOT NULL,           -- chemin de l'image
  idProjet  INTEGER NOT NULL REFERENCES PROJET(idProjet) ON DELETE CASCADE,
  altImg    TEXT                     -- texte alternatif (affiché au survol dans la galerie)
);

CREATE TABLE IF NOT EXISTS RealiserA (
  idEcole   INTEGER NOT NULL REFERENCES ECOLE(idEcole) ON DELETE CASCADE,
  idProjet  INTEGER NOT NULL REFERENCES PROJET(idProjet) ON DELETE CASCADE,
  PRIMARY KEY (idEcole, idProjet)
);

CREATE TABLE IF NOT EXISTS Utiliser (
  idProjet  INTEGER NOT NULL REFERENCES PROJET(idProjet) ON DELETE CASCADE,
  idOutils  INTEGER NOT NULL REFERENCES OUTILS(idOutils) ON DELETE CASCADE,
  PRIMARY KEY (idProjet, idOutils)
);
