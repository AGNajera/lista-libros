// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	// Las búsquedas y la ubicación del usuario cambian en cada petición,
	// así que las páginas se renderizan en el servidor.
	output: 'server',
	adapter: vercel({ webAnalytics: { enabled: true } }),
	prefetch: { defaultStrategy: 'hover' },
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Alegreya',
			cssVariable: '--font-libro',
			weights: ['400 800'],
			styles: ['normal', 'italic'],
			fallbacks: ['Georgia', 'serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'Alegreya Sans',
			cssVariable: '--font-ui',
			weights: [400, 500, 700],
			styles: ['normal'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
	],
});
