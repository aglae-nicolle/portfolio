// Enregistre une image dans la base en BLOB (et non en texte, qui abîme les octets).
// L'image est d'abord compressée en WebP et réduite (800 px de large pour une carte,
// 1600 px pour la galerie, voir compresser-image.mjs). Si le résultat est plus lourd, l'original est gardé.
//
// Image de carte d'un projet :
//   node scripts/import-image.mjs card <idProjet> <fichier>
// Image de la galerie d'un projet (table IMAGE) :
//   node scripts/import-image.mjs galerie <idProjet> <fichier> ["texte alternatif"]
// Supprimer les images de galerie illisibles (enregistrées en texte) d'un projet :
//   node scripts/import-image.mjs nettoyer <idProjet>
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { compresserImage, LARGEUR_MAX } from "./compresser-image.mjs";

const [mode, idArg, fichier, alt] = process.argv.slice(2);
const idProjet = Number(idArg);

if (!["card", "galerie", "nettoyer"].includes(mode) || !Number.isInteger(idProjet) || (mode !== "nettoyer" && !fichier)) {
    console.error("Usage : node scripts/import-image.mjs <card|galerie> <idProjet> <fichier>\n        node scripts/import-image.mjs nettoyer <idProjet>");
    process.exit(1);
}

const db = new Database(process.env.DB_PATH ?? "./db/portfolio.sqlite", { fileMustExist: true });

if (mode === "nettoyer") {
    const { changes } = db.prepare("DELETE FROM IMAGE WHERE idProjet = ? AND typeof(img) = 'text' AND img NOT LIKE '/%' AND img NOT LIKE 'http%'").run(idProjet);
    console.log(`${changes} image(s) illisible(s) supprimée(s) pour le projet ${idProjet}.`);
} else {
    const original = readFileSync(fichier);
    const bytes = (await compresserImage(original, LARGEUR_MAX[mode])) ?? original; // Buffer → stocké en BLOB par better-sqlite3
    if (mode === "card") {
        const { changes } = db.prepare("UPDATE PROJET SET imageCard = ? WHERE idProjet = ?").run(bytes, idProjet);
        if (!changes) { console.error(`Aucun projet avec l'id ${idProjet}.`); process.exit(1); }
    } else {
        const idImg = `${idProjet}-${basename(fichier, extname(fichier))}`;
        db.prepare("INSERT OR REPLACE INTO IMAGE (idImg, img, idProjet, altImg) VALUES (?, ?, ?, ?)").run(idImg, bytes, idProjet, alt ?? null);
    }
    console.log(`${basename(fichier)} (${Math.round(original.length / 1024)} Ko → ${Math.round(bytes.length / 1024)} Ko) enregistrée pour le projet ${idProjet}.`);
}

db.close();
