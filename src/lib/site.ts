// Informations utilisées à plusieurs endroits du site (header, menu mobile, footer, accueil…)
export const SITE = {
  nom: 'Aglaé Nicolle',
  metier: 'Développeuse full stack',
  email: 'aglaencl@gmail.com',
  telephone: '06 95 98 71 51',
  telephoneLien: '+33695987151',
  // Fichier du CV (dans public/) utilisé par les boutons « Télécharger mon CV »
  cv: '/CV.pdf',
};

export const PAGES = [
  { href: '/', label: 'Accueil' },
  { href: '/projets', label: 'Mes projets' },
  { href: '/a-propos', label: 'À propos' },
];

/** Vrai si le lien correspond à la page courante (ex: /projets/1 active « Mes projets »). */
export function estActif(href: string, chemin: string) {
  return href === '/' ? chemin === '/' : chemin.startsWith(href);
}
