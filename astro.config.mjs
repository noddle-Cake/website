import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
// https://astro.build/config
export default defineConfig({
    site: 'https://cjservin.com',
    // no base needed — custom domain serves from root
    vite: {
        plugins: [tailwindcss()],
    },
});