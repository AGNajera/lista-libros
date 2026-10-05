import { pedirJSON } from './http';

export interface Sinopsis {
	/** Párrafos en texto plano, sin HTML ni Markdown. */
	parrafos: string[];
	fuente: 'catalogo' | 'wikipedia';
	/** Enlace al artículo cuando la fuente es Wikipedia. */
	url?: string;
}

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/**
 * Las descripciones de Open Library llegan como HTML, Markdown o texto plano
 * (a veces mezclados). Esto las deja en párrafos de texto limpio.
 */
export function limpiarDescripcion(texto: string): string[] {
	const limpio = texto
		// Notas al pie de Open Library: «----------» seguido de enlaces, o «([source][1])».
		.split(/\r?\n\s*-{3,}|\(\[source\]/i)[0]
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|li|h\d)>/gi, '\n\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&(#x?[\da-f]+|\w+);/gi, (entidad, codigo: string) => {
			if (codigo[0] === '#') {
				const numero = codigo[1].toLowerCase() === 'x' ? parseInt(codigo.slice(2), 16) : Number(codigo.slice(1));
				return Number.isFinite(numero) ? String.fromCodePoint(numero) : entidad;
			}
			return ENTIDADES[codigo.toLowerCase()] ?? entidad;
		})
		// Markdown: [texto](url), [texto][1], **negritas**, *cursivas*, _cursivas_.
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]+)\]\[\d+\]/g, '$1')
		.replace(/^\s*\[\d+\]:.*$/gm, '')
		.replace(/(\*\*|__)(.+?)\1/g, '$2')
		.replace(/(^|\W)[*_]([^*_\n]+)[*_](?=\W|$)/g, '$1$2');

	return limpio
		.split(/\n\s*\n/)
		.map((parrafo) => parrafo.replace(/\s+/g, ' ').trim())
		.filter(Boolean);
}

/**
 * Palabras muy frecuentes de cada idioma. Se dejan fuera las que comparten el español y sus vecinos
 * («que», «se», «por», «de»): con ellas, una sinopsis en portugués pasaba por española.
 */
const FRECUENTES = {
	espanol: ['el', 'la', 'los', 'las', 'y', 'del', 'una', 'un', 'con', 'en', 'su', 'sus', 'es', 'al', 'lo', 'más', 'pero'],
	ingles: ['the', 'and', 'of', 'is', 'with', 'his', 'her', 'that', 'to', 'in'],
	portugues: ['o', 'os', 'as', 'e', 'do', 'da', 'dos', 'das', 'um', 'uma', 'com', 'em', 'não', 'na', 'seu', 'sua', 'seus', 'é', 'ao', 'mais', 'são'],
	frances: ['les', 'et', 'des', 'du', 'une', 'dans', 'est', 'au', 'il', 'elle', 'pour', 'sur', 'qui', 'ce'],
	italiano: ['il', 'gli', 'e', 'di', 'della', 'che', 'per', 'non', 'è', 'sono', 'nel', 'i'],
} as const;

type IdiomaTexto = keyof typeof FRECUENTES;

/** El idioma con más palabras frecuentes en el texto, o null si hay empate: una heurística sencilla pero suficiente para sinopsis. */
function idiomaProbable(texto: string): IdiomaTexto | null {
	const palabras = texto.toLowerCase().match(/\p{L}+/gu) ?? [];
	const conteo = (Object.keys(FRECUENTES) as IdiomaTexto[])
		.map((idioma) => ({ idioma, total: palabras.filter((p) => (FRECUENTES[idioma] as readonly string[]).includes(p)).length }))
		.sort((a, b) => b.total - a.total);
	return conteo[0].total > conteo[1].total ? conteo[0].idioma : null;
}

export function pareceEspanol(texto: string): boolean {
	return idiomaProbable(texto) === 'espanol';
}

export function pareceIngles(texto: string): boolean {
	return idiomaProbable(texto) === 'ingles';
}

// ---------- Wikipedia en español ----------

interface PaginaWikipedia {
	index: number;
	title: string;
	description?: string;
	extract?: string;
	fullurl: string;
}

const ES_LIBRO = /novela|libro|obra|ensayo|cuento|relatos|poemario|poema|saga|historieta|c[oó]mic|manga|memorias|biograf[ií]a|autobiograf[ií]a/i;
const NO_ES_LIBRO = /pel[ií]cula|serie|televisi[oó]n|telenovela|[aá]lbum|canci[oó]n|sencillo|videojuego|obra de teatro|musical/i;

/** Minúsculas, sin acentos ni puntuación. Con `sinParentesis` quita aclaraciones como «(novela)». */
function normalizar(texto: string, sinParentesis = true): string {
	return (sinParentesis ? texto.replace(/\(.*?\)/g, '') : texto)
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}

function coincideTitulo(pagina: string, titulos: string[]): boolean {
	const a = normalizar(pagina);
	return titulos.some((titulo) => {
		const b = normalizar(titulo.split(/[:(]/)[0]);
		return b.length >= 3 && (a === b || (a.length >= 6 && (a.startsWith(b) || b.startsWith(a))));
	});
}

/**
 * Busca el artículo del libro en Wikipedia en español y devuelve su introducción.
 * Solo acepta artículos que Wikipedia describe como libro (no películas ni series)
 * y cuyo título coincide con el del libro o cuyo texto menciona el título original.
 */
export async function sinopsisDeWikipedia(titulos: string[], autor: string | undefined): Promise<Sinopsis | undefined> {
	const apellido = autor?.trim().split(/\s+/).pop();
	const params = new URLSearchParams({
		action: 'query',
		format: 'json',
		formatversion: '2',
		generator: 'search',
		gsrsearch: [titulos[0], autor].filter(Boolean).join(' '),
		gsrlimit: '5',
		prop: 'extracts|description|info',
		inprop: 'url',
		exintro: '1',
		explaintext: '1',
	});

	const datos = await pedirJSON<{ query?: { pages: PaginaWikipedia[] } }>(`https://es.wikipedia.org/w/api.php?${params}`);
	const paginas = (datos.query?.pages ?? []).sort((a, b) => a.index - b.index);

	const pagina = paginas.find((p) => {
		const descripcion = p.description ?? '';
		const extracto = p.extract ?? '';
		if (!ES_LIBRO.test(descripcion) || NO_ES_LIBRO.test(descripcion)) return false;
		if (apellido && !normalizar(descripcion + ' ' + extracto).includes(normalizar(apellido))) return false;
		// El título original suele venir entre paréntesis: «La dama de blanco (The Woman in White) es…».
		const mencionaTitulo = titulos.some((t) => normalizar(extracto, false).includes(normalizar(t.split(/[:(]/)[0])));
		return coincideTitulo(p.title, titulos) || mencionaTitulo;
	});
	if (!pagina?.extract) return undefined;

	const parrafos = pagina.extract
		.split(/\n+/)
		.map((p) => p.trim())
		.filter(Boolean)
		.slice(0, 3);
	return { parrafos, fuente: 'wikipedia', url: pagina.fullurl };
}
