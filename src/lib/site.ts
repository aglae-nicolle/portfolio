// Informations utilisées à plusieurs endroits du site (header, menu mobile, footer, accueil…)
export const SITE = {
  nom: 'Aglaé Nicolle',
  metier: 'Développeuse full stack',
  email: 'aglaencl@gmail.com',
  telephone: '06 95 98 71 51',
  telephoneLien: '+33695987151',
  // Fichier du CV (dans public/) utilisé par les boutons « Télécharger mon CV »
  cv: '/CV.pdf',
  // Description par défaut (balise meta) si une page n'en donne pas
  description: 'Portfolio d’Aglaé Nicolle, étudiante en BUT MMI à Montbéliard et développeuse web full stack : projets, compétences et CV.',
  // Profils publics, repris dans les données structurées de l'accueil (sameAs). À compléter si besoin.
  profils: [] as string[],
};

export const PAGES = [
  { href: '/', label: 'Accueil' },
  { href: '/projets', label: 'Mes projets' },
  { href: '/a-propos', label: 'À propos' },
];

/** Vrai si le lien correspond à la page courante (ex: /projets/olyvia active « Mes projets »). */
export function estActif(href: string, chemin: string) {
  return href === '/' ? chemin === '/' : chemin.startsWith(href);
}
