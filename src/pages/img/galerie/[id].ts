// Image de galerie (IMAGE.img, stockée en BLOB), identifiée par le rowid de sa ligne.
import type { APIRoute } from "astro";
import { getImageParRowid } from "../../../lib/db";
import { reponseImage } from "../../../js/backend";

export const GET: APIRoute = ({ params, request }) => {
  const image = getImageParRowid(Number(params.id));
  return reponseImage(image?.img, request);
};
