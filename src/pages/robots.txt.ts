// robots.txt généré pour contenir l'adresse absolue du sitemap (tirée de `site` dans astro.config.mjs).
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      "User-agent: *",
      "Allow: /",
      // Page de test, uniquement utile en développement
      "Disallow: /brouillon-projet",
      "",
      `Sitemap: ${new URL("/sitemap.xml", site).href}`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
