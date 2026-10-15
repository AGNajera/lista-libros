import { obtenerLibro, urlPortada } from './openlibrary';

/**
 * Libros que aparecen en al menos dos listas de más vendidos de México (consultadas el 15 de octubre de 2026):
 * «Los más leídos» de Gandhi, «Más vendidos» de Planeta de Libros México, «Top de ventas» de El Sótano
 * y los más vendidos de Amazon México del 12 de octubre. Van primero los que están en más listas y mejor colocados.
 * Actualizar cada temporada.
 * Solo entran libros que Open Library ya tiene: «Narcocracia» y «Pueblo», que están en varias listas, todavía no.
 * `obraId` es el id de la obra en Open Library; la ficha elige sola la mejor edición en español.
 * `nota` reemplaza la sinopsis de Open Library cuando no hay en español o la que hay no cuenta de qué trata el libro.
 */
export const SUGERENCIAS: { titulo: string; autor: string; apellido: string; obraId: string; nota?: string }[] = [
	{
		titulo: 'El invencible verano de Liliana',
		autor: 'Cristina Rivera Garza',
		apellido: 'Rivera Garza',
		obraId: 'OL28767610W',
		nota: 'Cristina Rivera Garza reconstruye la vida de su hermana Liliana, asesinada en 1990 por su exnovio, a partir de las cartas y los cuadernos que ella dejó. Ganó el Pulitzer de memorias en 2024.',
	},
	{
		titulo: 'Verity',
		autor: 'Colleen Hoover',
		apellido: 'Hoover',
		obraId: 'OL20068530W',
		nota: 'Una escritora sin dinero acepta terminar la serie de novelas de Verity Crawford, que quedó incapacitada tras un accidente. En la casa de la familia encuentra una autobiografía que nadie debía leer.',
	},
	{ titulo: 'Hábitos atómicos', autor: 'James Clear', apellido: 'Clear', obraId: 'OL17930368W' },
	{
		titulo: 'La psicología del dinero',
		autor: 'Morgan Housel',
		apellido: 'Housel',
		obraId: 'OL21640039W',
		nota: 'Diecinueve historias cortas sobre cómo la conducta, más que la inteligencia, decide lo que hacemos con el dinero: ahorrar, gastar, invertir y saber cuándo ya es suficiente.',
	},
	{
		titulo: 'La vegetariana',
		autor: 'Han Kang',
		apellido: 'Han Kang',
		obraId: 'OL17334243W',
		nota: 'Yeong-hye deja de comer carne después de un sueño, y su familia no se lo perdona. La cuentan su esposo, su cuñado y su hermana. Ganó el Booker Internacional en 2016; en 2024 Han Kang recibió el Nobel de Literatura.',
	},
];

export interface Sugerido {
	obraId: string;
	titulo: string;
	autor: string;
	apellido: string;
	portada?: string;
	editorial?: string;
	anio?: number;
	paginas?: number;
	idioma: string | null;
	/** Primer párrafo de la sinopsis en español, recortado en una frase completa. */
	resumen?: string;
}

/** Corta el texto en la última frase que cabe en `largo` caracteres. */
function recortar(texto: string, largo: number): string {
	if (texto.length <= largo) return texto;
	const corte = texto.slice(0, largo);
	const punto = corte.lastIndexOf('. ');
	return punto > largo * 0.3 ? corte.slice(0, punto + 1) : `${corte.slice(0, corte.lastIndexOf(' '))}…`;
}

export async function cargarSugerencias(largoResumen = 320): Promise<Sugerido[]> {
	return Promise.all(
		SUGERENCIAS.map(async ({ nota, ...sugerencia }) => {
			let libro: Awaited<ReturnType<typeof obtenerLibro>> = null;
			try {
				libro = await obtenerLibro(sugerencia.obraId);
			} catch (error) {
				console.error('Sugerencia sin datos', sugerencia.obraId, error);
			}
			const detalle = libro && !('fusionadaEn' in libro) ? libro : null;
			const parrafo = detalle?.sinopsis?.parrafos[0];
			return {
				...sugerencia,
				portada: urlPortada(detalle?.portadaId, 'L'),
				editorial: detalle?.editorial,
				anio: detalle?.anio,
				paginas: detalle?.paginas,
				idioma: detalle?.idioma ?? null,
				resumen: nota ?? (parrafo ? recortar(parrafo, largoResumen) : undefined),
			};
		}),
	);
}

/** «Planeta, 2019. 320 páginas.», como en el pie de imprenta de una ficha. La razón social («S. A. de C. V.») sobra. */
export function pieDeImprenta({ editorial, anio, paginas }: Pick<Sugerido, 'editorial' | 'anio' | 'paginas'>): string {
	const sello = editorial?.replace(/,?\s+S\.\s?A\.(\s+de\s+C\.\s?V\.)?$/i, '');
	const imprenta = [sello, anio].filter(Boolean).join(', ');
	return [imprenta && `${imprenta}.`, paginas && `${paginas} páginas.`].filter(Boolean).join(' ');
}
