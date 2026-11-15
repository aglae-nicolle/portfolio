import { Database } from 'bun:sqlite';

const dbPath = process.env.DATABASE_PATH ?? './data/portfolio.sqlite';

export const db = new Database(dbPath, { create: true });
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export type Projet = {
  idProjet: number;
  nomProjet: string;
  imageCard: string | Buffer | null; // chemin, ou image binaire (BLOB)
  descriptionProjet: string | null;
  urlProjet: string | null;
  contenuPageProjet: string | null;
  anneeRealisation: number | null;
};
export type Outil = {
  idOutils: number;
  nomOutils: string;
  iconOutils: string | null;
  typeOutils: 'logiciel' | 'langage' | null;
  ordreOutils: number | null;
};
export type Image = { idImg: string | null; img: string | Buffer; idProjet: number; altImg: string | null };

/** Projets, filtrables par école (nomEcole). Sans filtre : tous les projets. */
export function getProjets(ecole?: string): (Projet & { ecoles: string })[] {
  const sql = `
    SELECT p.*, GROUP_CONCAT(e.nomEcole, ', ') AS ecoles
    FROM PROJET p
    LEFT JOIN RealiserA r ON r.idProjet = p.idProjet
    LEFT JOIN ECOLE e ON e.idEcole = r.idEcole
    ${ecole ? 'WHERE e.nomEcole = ?' : ''}
    GROUP BY p.idProjet
    ORDER BY p.anneeRealisation DESC, p.idProjet DESC`;
  const stmt = db.prepare(sql);
  return (ecole ? stmt.all(ecole) : stmt.all()) as (Projet & { ecoles: string })[];
}

export function getProjet(id: number): Projet | null {
  return (db.prepare('SELECT * FROM PROJET WHERE idProjet = ?').get(id) as Projet | undefined) ?? null;
}

export function getOutilsDuProjet(id: number): Outil[] {
  return db
    .prepare(`SELECT o.* FROM OUTILS o JOIN Utiliser u ON u.idOutils = o.idOutils WHERE u.idProjet = ?
              ORDER BY o.typeOutils DESC, o.ordreOutils, o.idOutils`)
    .all(id) as Outil[];
}

export function getImagesDuProjet(id: number): Image[] {
  return db.prepare('SELECT * FROM IMAGE WHERE idProjet = ?').all(id) as Image[];
}

export function getAllOutils(): Outil[] {
  return db.prepare('SELECT * FROM OUTILS ORDER BY ordreOutils, idOutils').all() as Outil[];
}

/** Outils séparés en « Les logiciels » / « Les langages » (colonne typeOutils). */
export function getOutilsParType() {
  const outils = getAllOutils();
  return {
    logiciels: outils.filter((o) => o.typeOutils !== 'langage'),
    langages: outils.filter((o) => o.typeOutils === 'langage'),
  };
}
