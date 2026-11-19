// Plan du site pour les moteurs de recherche, généré à chaque requête à partir de la base :
// un projet ajouté en base apparaît tout de suite, sans rebuild.
// (@astrojs/sitemap ne connaît pas les pages dynamiques d'un site en rendu serveur.)
import type { APIRoute } from "astro";
import { getProjets, slugProjet } from "../lib/db";
import { PAGES } from "../lib/site";

export const GET: APIRoute = ({ site }) => {
  const chemins = [
    ...PAGES.map((p) => p.href),
    "/mentions-legales",
    ...getProjets().map((p) => `/projets/${slugProjet(p.nomProjet)}`),
  ];
  const urls = chemins
    .map((c) => `  <url><loc>${new URL(c, site).href}</loc></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } },
  );
};
