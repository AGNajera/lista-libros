// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	// Las búsquedas y la ubicación del usuario cambian en cada petición,
	// así que las páginas se renderizan en el servidor.
	output: 'server',
	// El sitio no usa sesiones ni <Image>, así que no hace falta un KV ni Cloudflare Images.
	adapter: cloudflare({ imageService: 'passthrough' }),
	session: false,
	prefetch: { defaultStrategy: 'hover' },
	fonts: [
		{
			// Libron no está en Google Fonts: sus archivos viven en src/assets/fonts.
			provider: fontProviders.local(),
			name: 'Libron',
			cssVariable: '--font-libro',
			options: {
				variants: [
					{ src: ['./src/assets/fonts/Libron-Regular.woff2'], weight: 400, style: 'normal' },
					{ src: ['./src/assets/fonts/Libron-Italic.woff2'], weight: 400, style: 'italic' },
					{ src: ['./src/assets/fonts/Libron-Bold.woff2'], weight: 700, style: 'normal' },
					{ src: ['./src/assets/fonts/Libron-BoldItalic.woff2'], weight: 700, style: 'italic' },
				],
			},
			fallbacks: ['Georgia', 'serif'],
		},
	],
});
