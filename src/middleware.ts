// En-têtes ajoutés à toutes les réponses générées par le site (pages, images /img/…, sitemap…).
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (_contexte, suivant) => {
  const reponse = await suivant();
  // HSTS : après une première visite en HTTPS, le navigateur n'utilise plus que HTTPS pour ce site
  // pendant un an, même si on tape http:// (le serveur redirige déjà HTTP vers HTTPS, mais cette
  // première requête en clair pourrait être interceptée). Les navigateurs ignorent cet en-tête
  // quand il arrive en HTTP, donc il ne gêne pas le développement en local.
  reponse.headers.set("Strict-Transport-Security", "max-age=31536000");
  return reponse;
});
