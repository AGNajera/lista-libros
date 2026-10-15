import type { APIRoute } from 'astro';
import { SUGERENCIAS } from '../lib/sugerencias';

export const prerender = true;

/**
 * Las fichas son infinitas (todo el catálogo de Open Library), así que el sitemap solo lista la portada
 * y los libros del estante. Google llega a los demás siguiendo enlaces.
 */
export const GET: APIRoute = ({ site }) => {
	const rutas = ['/', ...SUGERENCIAS.map(({ obraId }) => `/libro/${obraId}`)];
	const urls = rutas.map((ruta) => `\t<url><loc>${new URL(ruta, site)}</loc></url>`).join('\n');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
	);
};
