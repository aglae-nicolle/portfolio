// Image de carte d'un projet (PROJET.imageCard, stockée en BLOB), servie comme un vrai fichier :
// le navigateur la met en cache et ne la télécharge qu'une fois, même si elle apparaît plusieurs fois.
import type { APIRoute } from "astro";
import { getProjet } from "../../../lib/db";
import { reponseImage } from "../../../js/backend";

export const GET: APIRoute = ({ params, request }) => {
  const projet = getProjet(Number(params.id));
  return reponseImage(projet?.imageCard, request);
};
