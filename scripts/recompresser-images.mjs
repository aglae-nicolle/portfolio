// Recompresse les images déjà enregistrées en BLOB dans la base (cartes des projets et galeries) :
// WebP, 800 px de large au maximum pour les cartes, 1600 px pour la galerie.
// À lancer une fois sur le VPS, avec Bun (même base et même pilote SQLite que le site) :
//   bun scripts/recompresser-images.mjs --essai   → affiche le gain sans rien modifier
//   bun scripts/recompresser-images.mjs           → recompresse (une copie de la base est faite avant)
// La base utilisée est celle du site : DATABASE_PATH, sinon ./data/portfolio.sqlite.
// Les URL des images ne changent pas ; leur ETag change, donc les navigateurs reprennent
// la nouvelle version au plus tard un jour après (durée du cache).
import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { compresserImage, LARGEUR_MAX } from "./compresser-image.mjs";

const chemin = process.env.DATABASE_PATH ?? "./data/portfolio.sqlite";
const essai = process.argv.includes("--essai");
if (!existsSync(chemin)) {
  console.error(`Base introuvable : ${chemin}`);
  process.exit(1);
}
const db = new Database(chemin);

if (!essai) {
  const sauvegarde = `${chemin}.avant-recompression-${new Date().toISOString().slice(0, 10)}`;
  if (existsSync(sauvegarde)) {
    console.error(`La sauvegarde ${sauvegarde} existe déjà : supprimez-la ou renommez-la avant de relancer.`);
    process.exit(1);
  }
  db.exec(`VACUUM INTO '${sauvegarde.replaceAll("'", "''")}'`);
  console.log(`Copie de la base avant modification : ${sauvegarde}\n`);
}

const ko = (n) => `${Math.round(n / 1024)} Ko`;
let totalAvant = 0;
let totalApres = 0;

async function traiter(libelle, octets, largeurMax, enregistrer) {
  const nouveaux = await compresserImage(octets, largeurMax);
  totalAvant += octets.length;
  totalApres += nouveaux ? nouveaux.length : octets.length;
  if (!nouveaux) {
    console.log(`= ${libelle} : ${ko(octets.length)}, inchangée`);
    return;
  }
  console.log(`✓ ${libelle} : ${ko(octets.length)} → ${ko(nouveaux.length)}`);
  if (!essai) enregistrer(nouveaux);
}

const cartes = db
  .query("SELECT idProjet, nomProjet, imageCard FROM PROJET WHERE typeof(imageCard) = 'blob'")
  .all();
const majCarte = db.query("UPDATE PROJET SET imageCard = ? WHERE idProjet = ?");
for (const p of cartes)
  await traiter(`carte « ${p.nomProjet} »`, p.imageCard, LARGEUR_MAX.card, (o) => majCarte.run(o, p.idProjet));

const galerie = db
  .query("SELECT rowid AS cle, idImg, img FROM IMAGE WHERE typeof(img) = 'blob'")
  .all();
const majGalerie = db.query("UPDATE IMAGE SET img = ? WHERE rowid = ?");
for (const i of galerie)
  await traiter(`galerie ${i.idImg}`, i.img, LARGEUR_MAX.galerie, (o) => majGalerie.run(o, i.cle));

console.log(`\nTotal : ${ko(totalAvant)} → ${ko(totalApres)}${essai ? " (essai : rien n'a été modifié)" : ""}`);
if (!essai) db.exec("VACUUM"); // rend au disque la place libérée
db.close();
