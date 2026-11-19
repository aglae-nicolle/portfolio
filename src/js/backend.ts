// Accès aux données du portfolio via la base SQLite (db/portfolio.sqlite).
// La connexion est ouverte une seule fois dans src/lib/db.ts et réutilisée ici.
import { db, type Projet, type Image } from "../lib/db";

/** Tous les projets, du plus récent au plus ancien. */
export function getProjets(): Projet[] {
    return db
        .prepare("SELECT * FROM PROJET ORDER BY anneeRealisation DESC, idProjet DESC")
        .all() as Projet[];
}

/** Un projet par son id, ou null s'il n'existe pas. */
export function getProjetById(idProjet: number): Projet | null {
    try {
        return (db.prepare("SELECT * FROM PROJET WHERE idProjet = ?").get(idProjet) as Projet | undefined) ?? null;
    } catch (error) {
        console.error("Error fetching projet by ID:", error);
        return null;
    }
}

/** Les images (table IMAGE) rattachées à un projet. */
export function getImagesDuProjet(idProjet: number): Image[] {
    return db.prepare("SELECT * FROM IMAGE WHERE idProjet = ?").all(idProjet) as Image[];
}

/** Contenu d'un champ image : soit un chemin / une URL, soit l'image elle-même (octets + type MIME). */
export type ContenuImage = { url: string } | { bytes: Buffer; mime: string };

/**
 * Lit le champ image d'un enregistrement.
 * - Chemin ou URL (ex: "/images/x.webp") : renvoyé tel quel dans `url`.
 * - Image binaire (BLOB) : renvoyée en octets avec son type MIME.
 * - Champ vide ou illisible : null.
 */
export function lireImage(value: unknown, champ = "image"): ContenuImage | null {
    if (!value) return null;

    if (typeof value === "string") {
        // Chemin, URL ou data URL : utilisable directement.
        if (/^(\/|https?:\/\/|data:)/.test(value.trim())) return { url: value.trim() };
        // Sinon c'est une image binaire qui a été enregistrée comme du TEXTE :
        // ses octets ont été altérés et elle ne peut pas s'afficher.
        console.warn(`[lireImage] Image illisible dans le champ "${champ}" : elle doit être réenregistrée en BLOB ou remplacée par un chemin.`);
        return null;
    }

    if (!(value instanceof Uint8Array)) return null;
    const bytes = Buffer.from(value);
    // Un chemin enregistré en BLOB reste un chemin.
    const asText = bytes.subarray(0, 8).toString("utf8");
    if (/^(\/|https?:)/.test(asText)) return { url: bytes.toString("utf8").trim() };

    const mime = detectMimeType(bytes);
    if (mime === "application/octet-stream") {
        console.warn(`[lireImage] Format d'image non reconnu dans le champ "${champ}".`);
        return null;
    }
    return { bytes, mime };
}

/**
 * Renvoie une URL utilisable dans <img src> pour le champ image d'un enregistrement.
 * Un BLOB devient une data URL : à réserver aux cas où aucune route /img/… n'existe
 * (les pages utilisent urlImageCard / urlImageGalerie, qui pointent vers un vrai fichier mis en cache).
 */
export function getImageUrl<T extends object>(record: T | null | undefined, imageField: keyof T): string | null {
    const image = lireImage(record?.[imageField], String(imageField));
    if (!image) return null;
    return "url" in image ? image.url : `data:${image.mime};base64,${image.bytes.toString("base64")}`;
}

/** URL de l'image de carte d'un projet : servie par src/pages/img/projet/[id].ts (et non plus en base64 dans le HTML). */
export function urlImageCard(projet: { idProjet: number; imageCard: unknown }): string | null {
    const image = lireImage(projet.imageCard, "imageCard");
    if (!image) return null;
    return "url" in image ? image.url : `/img/projet/${projet.idProjet}`;
}

/** URL d'une image de galerie : servie par src/pages/img/galerie/[id].ts (id = rowid de la ligne IMAGE, champ `cle`). */
export function urlImageGalerie(image: { cle: number; img: unknown }): string | null {
    const contenu = lireImage(image.img, "img");
    if (!contenu) return null;
    return "url" in contenu ? contenu.url : `/img/galerie/${image.cle}`;
}

/** Réponse HTTP pour une image en BLOB, avec cache navigateur et ETag (réponse 304 si l'image n'a pas changé). */
export function reponseImage(value: unknown, requete: Request): Response {
    const image = lireImage(value);
    if (!image || "url" in image) return new Response(null, { status: 404 });
    const etag = `"${Bun.hash(image.bytes).toString(36)}"`;
    const entetes = {
        "Content-Type": image.mime,
        // Une journée en cache, puis revalidation par l'ETag (l'image peut être remplacée en base).
        "Cache-Control": "public, max-age=86400, must-revalidate",
        ETag: etag,
    };
    if (requete.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers: entetes });
    return new Response(image.bytes, { headers: entetes });
}

/**
 * Largeur et hauteur d'une image en BLOB, lues dans l'en-tête du fichier (PNG, JPEG, WebP, GIF).
 * Elles servent aux attributs width / height des <img> : le navigateur réserve la place de l'image
 * avant son chargement, et la page ne « saute » pas. Pas de colonne en base, donc rien à migrer.
 * Renvoie null pour un chemin, un SVG ou un format non reconnu.
 */
export function dimensionsImage(value: unknown): { width: number; height: number } | null {
    const image = lireImage(value);
    if (!image || "url" in image) return null;
    const b = image.bytes;
    try {
        switch (image.mime) {
            case "image/png":
                return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
            case "image/gif":
                return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
            case "image/webp": {
                const bloc = b.toString("ascii", 12, 16);
                if (bloc === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
                if (bloc === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
                if (bloc === "VP8L") {
                    const bits = b.readUInt32LE(21);
                    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
                }
                return null;
            }
            case "image/jpeg": {
                // On parcourt les segments jusqu'à l'en-tête de trame (SOF0 à SOF15, sauf C4, C8 et CC).
                let i = 2;
                while (i + 9 < b.length) {
                    if (b[i] !== 0xff) return null;
                    const marqueur = b[i + 1];
                    if (marqueur === 0xff) { i++; continue; }
                    if (marqueur >= 0xc0 && marqueur <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marqueur))
                        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
                    if (marqueur === 0xd8 || marqueur === 0x01 || (marqueur >= 0xd0 && marqueur <= 0xd7)) { i += 2; continue; }
                    i += 2 + b.readUInt16BE(i + 2);
                }
                return null;
            }
        }
    } catch {
        // Fichier tronqué : on se passe des dimensions.
    }
    return null;
}

/** Code SVG d'une icône stockée directement en base (OUTILS.iconOutils), sinon null. */
export function getInlineSvg(value: unknown): string | null {
    return typeof value === "string" && value.trim().startsWith("<svg") ? value : null;
}

/** Retire les balises HTML (pour les balises <meta> ou les attributs alt). */
export function stripHtml(html: string | null | undefined): string {
    return (html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function detectMimeType(bytes: Buffer): string {
    const hex = bytes.subarray(0, 12).toString("hex");
    if (hex.startsWith("89504e47")) return "image/png";
    if (hex.startsWith("ffd8ff")) return "image/jpeg";
    if (hex.startsWith("47494638")) return "image/gif";
    if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") return "image/webp";
    if (bytes.subarray(0, 256).toString("utf8").includes("<svg")) return "image/svg+xml";
    return "application/octet-stream";
}
