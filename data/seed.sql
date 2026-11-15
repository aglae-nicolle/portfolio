-- Données de test (à remplacer par les vrais projets)
INSERT INTO ECOLE (nomEcole) VALUES ('UTBM'), ('IUT MMI'), ('Personnels');

INSERT INTO PROJET (nomProjet, imageCard, descriptionProjet, urlProjet, contenuPageProjet, anneeRealisation) VALUES
  ('Eyeth', '/images/projets/eyeth-card.webp',
   'Application web qui permet au grand public d’apprendre la Langue des Signes Française (LSF).',
   'https://eyeth.example', '<h2>Qu’est-ce que Eyeth ?</h2><p>…</p><h2>Pourquoi Eyeth ?</h2><p>…</p><h2>Mon équipe</h2><p>Ce projet a été réalisé avec Lola Brouart et Solène Geiss.</p>', 2026),
  ('Portfolio', '/images/projets/portfolio-card.webp',
   'Site portfolio personnel conçu sur la maquette Figma.',
   NULL, '<p>…</p>', 2026);

INSERT INTO RealiserA (idEcole, idProjet) VALUES (2, 1), (3, 2);

INSERT INTO OUTILS (nomOutils, iconOutils, typeOutils, ordreOutils) VALUES
  ('Astro', '/icons/astro.svg', 'langage', 1),
  ('Tailwind CSS', '/icons/tailwind.svg', 'langage', 2),
  ('SQLite', '/icons/sqlite.svg', 'logiciel', 2),
  ('JavaScript', '/icons/javascript.svg', 'langage', 3),
  ('Figma', '/icons/figma.svg', 'logiciel', 1);

INSERT INTO Utiliser (idProjet, idOutils) VALUES (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (2, 1), (2, 2);

INSERT INTO IMAGE (idImg, img, idProjet) VALUES
  ('eyeth-screen-1', '/images/projets/eyeth-screen-1.webp', 1),
  ('eyeth-lecon-1', '/images/projets/eyeth-lecon-1.webp', 1);
