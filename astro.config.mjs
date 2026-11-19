// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Adresse publique du site : sert aux URL absolues (canonique, Open Graph, sitemap, robots.txt).
  // Peut être remplacée au build par la variable SITE_URL (variable GitHub « SITE_URL »).
  site: process.env.SITE_URL || 'https://aglaenicolle.fr',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
  },
});
