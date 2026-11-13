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

/**
 * Renvoie une URL utilisable dans <img src> pour le champ image d'un enregistrement.
 * - Si le champ contient un chemin ou une URL (ex: "/images/x.webp"), il est renvoyé tel quel.
 * - Si le champ contient l'image elle-même (BLOB), elle est convertie en data URL.
 */
export function getImageUrl<T extends object>(record: T | null | undefined, imageField: keyof T): string | null {
    const value = record?.[imageField] as unknown;
    if (!value) return null;

    if (typeof value === "string") {
        // Chemin, URL ou data URL : utilisable directement.
        if (/^(\/|https?:\/\/|data:)/.test(value.trim())) return value.trim();
        // Sinon c'est une image binaire qui a été enregistrée comme du TEXTE :
        // ses octets ont été altérés et elle ne peut pas s'afficher.
        console.warn(`[getImageUrl] Image illisible dans le champ "${String(imageField)}" : elle doit être réenregistrée en BLOB ou remplacée par un chemin.`);
        return null;
    }

    if (!(value instanceof Uint8Array)) return null;
    const bytes = Buffer.from(value);
    // Un chemin enregistré en BLOB reste un chemin.
    const asText = bytes.subarray(0, 8).toString("utf8");
    if (/^(\/|https?:)/.test(asText)) return bytes.toString("utf8").trim();

    const mime = detectMimeType(bytes);
    if (mime === "application/octet-stream") {
        console.warn(`[getImageUrl] Format d'image non reconnu dans le champ "${String(imageField)}".`);
        return null;
    }
    return `data:${mime};base64,${bytes.toString("base64")}`;
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
