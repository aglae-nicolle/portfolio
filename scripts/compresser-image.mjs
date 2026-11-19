// Compression des images avant leur enregistrement en base (utilisé par import-image.mjs
// et recompresser-images.mjs). sharp est déjà installé avec Astro : rien à ajouter aux dépendances.
import sharp from "sharp";

// Largeur maximale en pixels.
// - card : 246 px affichés dans les cartes, mais la même image sert en grand dans l'en-tête
//   de la page projet et dans l'aperçu de partage (Open Graph) : 800 px suffisent.
// - galerie : affichée en plein écran dans la visionneuse.
export const LARGEUR_MAX = { card: 800, galerie: 1600 };

/**
 * Redimensionne (sans agrandir) et convertit en WebP qualité 80.
 * Renvoie les nouveaux octets, ou null si l'image doit rester telle quelle :
 * SVG, GIF animé, ou résultat plus lourd que l'original.
 */
export async function compresserImage(octets, largeurMax) {
  const entree = Buffer.from(octets);
  const infos = await sharp(entree).metadata();
  if (infos.format === "svg" || (infos.pages ?? 1) > 1) return null;
  const sortie = await sharp(entree)
    .rotate() // applique l'orientation EXIF (les métadonnées ne sont pas gardées)
    .resize({ width: largeurMax, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toBuffer();
  return sortie.length < entree.length ? sortie : null;
}
