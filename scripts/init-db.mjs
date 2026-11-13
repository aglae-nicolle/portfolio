// Crée ou met à jour la base SQLite du portfolio (avec better-sqlite3).
//   npm run db:init
// - crée les tables manquantes (db/schema.sql) ;
// - ajoute les colonnes apparues depuis (ex : OUTILS.typeOutils) à une base existante, sans toucher aux données ;
// - insère les données de test (db/seed.sql) uniquement si la base ne contient encore aucun projet.
import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.DB_PATH ?? './db/portfolio.sqlite';
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(readFileSync('./db/schema.sql', 'utf8'));

// Migrations : colonnes ajoutées au schéma après la création de la base
const migrations = [
  { table: 'OUTILS', colonne: 'typeOutils', sql: "ALTER TABLE OUTILS ADD COLUMN typeOutils TEXT CHECK (typeOutils IN ('logiciel','langage'))" },
  { table: 'OUTILS', colonne: 'ordreOutils', sql: 'ALTER TABLE OUTILS ADD COLUMN ordreOutils INTEGER' },
  { table: 'IMAGE', colonne: 'altImg', sql: 'ALTER TABLE IMAGE ADD COLUMN altImg TEXT' },
];
for (const { table, colonne, sql } of migrations) {
  const existe = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === colonne);
  if (!existe) {
    db.exec(sql);
    console.log(`Colonne ajoutée : ${table}.${colonne}`);
  }
}

// Le seed n'est exécuté que si la table est vide
const { n } = db.prepare('SELECT COUNT(*) AS n FROM PROJET').get();
if (n === 0) {
  db.exec(readFileSync('./db/seed.sql', 'utf8'));
  console.log('Données de test insérées (db/seed.sql).');
}

console.log(`Base initialisée : ${dbPath}`);
db.close();
