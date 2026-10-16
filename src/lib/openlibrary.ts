import { ErrorHttp, pedirJSON } from './http';
import { ESPANOL } from './idiomas';
import { limpiarDescripcion, pareceEspanol, sinopsisDeWikipedia, type Sinopsis } from './sinopsis';

/** Cliente de Open Library (https://openlibrary.org/developers/api). Es gratis y no pide llave. */
const BASE = 'https://openlibrary.org';
const pedir = <T>(ruta: string) => pedirJSON<T>(BASE + ruta);

export interface Libro {
	/** Id de la obra, p. ej. OL17930368W. */
	obraId: string;
	/** Id de la edición elegida, p. ej. OL51155019M. */
	edicionId?: string;
	titulo: string;
	autores: string[];
	/** Código MARC del idioma de la edición (spa, eng…) o null si no se sabe. */
	idioma: string | null;
	isbn?: string;
	editorial?: string;
	anio?: number;
	portadaId?: number;
}

export interface DetalleLibro extends Libro {
	subtitulo?: string;
	paginas?: number;
	/** Sinopsis en español, del catálogo o de Wikipedia. */
	sinopsis?: Sinopsis;
	/** Descripción del catálogo cuando solo existe en otro idioma. */
	sinopsisOriginal?: string[];
	/** La mejor edición en español cuando la elegida está en otro idioma. */
	edicionEspanol?: Libro;
	totalEdicionesEspanol: number;
	/** La obra tiene más ediciones de las que se revisaron: el total en español es un mínimo. */
	edicionesIncompletas: boolean;
}

/** Open Library fusiona obras duplicadas: el id viejo solo dice en cuál quedó. */
export interface ObraFusionada {
	fusionadaEn: string;
}

// ---------- Búsqueda ----------

interface DocBusqueda {
	key: string;
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	cover_i?: number;
	language?: string[];
	editions?: {
		docs: {
			key: string;
			title?: string;
			language?: string[];
			isbn?: string[];
			publisher?: string[];
			cover_i?: number;
			publish_date?: string[];
		}[];
	};
}

const CAMPOS = [
	'key',
	'title',
	'author_name',
	'first_publish_year',
	'cover_i',
	'language',
	'editions',
	'editions.key',
	'editions.title',
	'editions.language',
	'editions.isbn',
	'editions.publisher',
	'editions.cover_i',
	'editions.publish_date',
].join(',');

/** Open Library rechaza las consultas de menos de 3 caracteres. */
export const CONSULTA_MINIMA = 3;
export const POR_PAGINA = 20;
/** En una búsqueda muy amplia, Open Library responde con un error al pedir las páginas más lejanas (la 5000 de «C++» falla). */
export const PAGINA_MAXIMA = 500;

/** La página que pide la URL: un entero desde 1, aunque el parámetro falte o no sea un número. */
export function paginaPedida(valor: string | null): number {
	return Math.max(1, Math.floor(Number(valor)) || 1);
}

/** Las páginas que se pueden recorrer de una búsqueda: las que hay, sin pasar del tope. */
export function paginasDe(total: number): number {
	return Math.min(PAGINA_MAXIMA, Math.ceil(total / POR_PAGINA));
}

export interface ResultadoBusqueda {
	libros: Libro[];
	total: number;
}

export async function buscarLibros(consulta: string, pagina = 1): Promise<ResultadoBusqueda> {
	const params = new URLSearchParams({
		// lang=es hace que Open Library elija, de cada obra, una edición en español si existe.
		lang: 'es',
		limit: String(POR_PAGINA),
		page: String(pagina),
		fields: CAMPOS,
	});
	const isbn = consulta.replace(/[-\s]/g, '');
	if (/^(97[89])?\d{9}[\dX]$/i.test(isbn)) params.set('isbn', isbn);
	else params.set('q', consulta);

	const datos = await pedir<{ numFound: number; docs: DocBusqueda[] }>(`/search.json?${params}`);
	const libros = datos.docs.map(libroDesdeBusqueda);

	// Los libros en español primero, sin perder el orden de relevancia.
	const espanol = libros.filter((libro) => libro.idioma === ESPANOL);
	const otros = libros.filter((libro) => libro.idioma !== ESPANOL);
	return { libros: [...espanol, ...otros], total: datos.numFound };
}

function libroDesdeBusqueda(doc: DocBusqueda): Libro {
	const edicion = doc.editions?.docs[0];
	return {
		obraId: idDesdeClave(doc.key),
		edicionId: edicion ? idDesdeClave(edicion.key) : undefined,
		titulo: edicion?.title ?? doc.title,
		autores: doc.author_name?.slice(0, 3) ?? [],
		idioma: idiomaConRespaldo(edicion?.language?.[0], edicion?.isbn ?? []) ?? (doc.language?.length === 1 ? doc.language[0] : null),
		isbn: mejorIsbn(edicion?.isbn ?? []),
		editorial: edicion?.publisher?.[0],
		anio: anioDesde(edicion?.publish_date?.[0]) ?? doc.first_publish_year,
		portadaId: edicion?.cover_i ?? doc.cover_i,
	};
}

// ---------- Detalle ----------

type Texto = string | { value: string };

interface Obra {
	/** `/type/work`, o `/type/redirect` y `/type/delete` cuando la obra se fusionó con otra o se borró. */
	type?: { key: string };
	/** La obra en la que quedó una fusionada, p. ej. /works/OL15400381W. */
	location?: string;
	title: string;
	description?: Texto;
	covers?: number[];
	authors?: { author: { key: string } }[];
	first_publish_date?: string;
}

interface Edicion {
	key: string;
	works?: { key: string }[];
	title: string;
	subtitle?: string;
	publishers?: string[];
	publish_date?: string;
	covers?: number[];
	isbn_13?: string[];
	isbn_10?: string[];
	languages?: { key: string }[];
	number_of_pages?: number;
	description?: Texto;
}

/** Open Library entrega las ediciones de una obra por páginas; solo se pide la primera. */
const LIMITE_EDICIONES = 100;

export const ID_OBRA = /^OL\d+W$/;
export const ID_EDICION = /^OL\d+M$/;

interface OpcionesLibro {
	/** Autores ya conocidos: con ellos no se piden a Open Library. */
	autores?: string[];
	/** Con `false` no se busca la sinopsis en Wikipedia, para quien ya tiene la suya. */
	wikipedia?: boolean;
}

export async function obtenerLibro(
	obraId: string,
	edicionId?: string,
	{ autores: autoresConocidos, wikipedia = true }: OpcionesLibro = {},
): Promise<DetalleLibro | ObraFusionada | null> {
	if (!ID_OBRA.test(obraId)) return null;

	let obra: Obra;
	try {
		obra = await pedir<Obra>(`/works/${obraId}.json`);
	} catch (error) {
		if (error instanceof ErrorHttp && error.estado === 404) return null;
		throw error;
	}
	if (obra.type?.key === '/type/redirect') {
		const destino = idDesdeClave(obra.location ?? '');
		return ID_OBRA.test(destino) && destino !== obraId ? { fusionadaEn: destino } : null;
	}
	if (obra.type?.key === '/type/delete') return null;

	const [{ entries: ediciones, size }, autores] = await Promise.all([
		pedir<{ entries: Edicion[]; size?: number }>(`/works/${obraId}/editions.json?limit=${LIMITE_EDICIONES}`),
		autoresConocidos ?? obtenerAutores(obra),
	]);
	const edicionesIncompletas = (size ?? ediciones.length) > ediciones.length;

	let edicion = edicionId && ID_EDICION.test(edicionId) ? ediciones.find((e) => idDesdeClave(e.key) === edicionId) : undefined;
	if (!edicion && edicionId && ID_EDICION.test(edicionId)) {
		// La obra tiene más de 100 ediciones y la elegida no vino en la primera página.
		edicion = await pedir<Edicion>(`/books/${edicionId}.json`).catch(() => undefined);
		// Un enlace mal armado puede traer la edición de otro libro: se ignora y se elige una de esta obra.
		if (!edicion?.works?.some((o) => idDesdeClave(o.key) === obraId)) edicion = undefined;
	}

	const enEspanol = ediciones.filter((e) => idiomaDeEdicion(e) === ESPANOL);
	if (edicionesIncompletas) {
		// Las ediciones en español pueden haber quedado fuera de las que se recibieron.
		const delBuscador = await edicionEspanolDelBuscador(obraId);
		if (delBuscador && !enEspanol.some((e) => e.key === delBuscador.key)) enEspanol.push(delBuscador);
	}
	enEspanol.sort((a, b) => puntaje(b) - puntaje(a));
	edicion ??= enEspanol[0] ?? ediciones.find((e) => e.isbn_13 || e.isbn_10) ?? ediciones[0];

	const base = libroDesdeEdicion(obraId, obra, edicion, autores);
	const edicionEspanol = base.idioma !== ESPANOL ? enEspanol[0] : undefined;

	// Descripciones del catálogo, de la más específica a la más general.
	const descripciones = [edicion, ...enEspanol, obra]
		.map((fuente) => texto(fuente?.description))
		.filter((d): d is string => Boolean(d))
		.map(limpiarDescripcion)
		.filter((parrafos) => parrafos.length > 0);
	const enCatalogo = descripciones.find((parrafos) => pareceEspanol(parrafos.join(' ')));

	let sinopsis: Sinopsis | undefined = enCatalogo && { parrafos: enCatalogo, fuente: 'catalogo' };
	if (!sinopsis && wikipedia) {
		const titulos = [...new Set([enEspanol[0]?.title, base.titulo, obra.title].filter((t): t is string => Boolean(t)))];
		sinopsis = await sinopsisDeWikipedia(titulos, autores[0]).catch((error) => {
			console.error('Wikipedia no respondió', error);
			return undefined;
		});
	}

	return {
		...base,
		subtitulo: edicion?.subtitle,
		paginas: edicion?.number_of_pages,
		sinopsis,
		sinopsisOriginal: sinopsis ? undefined : descripciones[0],
		edicionEspanol: edicionEspanol && libroDesdeEdicion(obraId, obra, edicionEspanol, autores),
		totalEdicionesEspanol: enEspanol.length,
		edicionesIncompletas,
	};
}

/** La edición en español que elige el buscador de Open Library, que sí revisa todas las ediciones de la obra. */
async function edicionEspanolDelBuscador(obraId: string): Promise<Edicion | undefined> {
	const params = new URLSearchParams({
		q: `key:/works/${obraId}`,
		lang: 'es',
		limit: '1',
		fields: 'key,editions,editions.key,editions.language,editions.isbn',
	});
	try {
		const datos = await pedir<{ docs: DocBusqueda[] }>(`/search.json?${params}`);
		const elegida = datos.docs[0]?.editions?.docs[0];
		if (!elegida || idiomaConRespaldo(elegida.language?.[0], elegida.isbn ?? []) !== ESPANOL) return undefined;
		const id = idDesdeClave(elegida.key);
		if (!ID_EDICION.test(id)) return undefined;
		const edicion = await pedir<Edicion>(`/books/${id}.json`);
		// La ficha de la edición a veces llega sin idioma; el buscador ya confirmó que está en español.
		return idiomaDeEdicion(edicion) === ESPANOL ? edicion : { ...edicion, languages: [{ key: `/languages/${ESPANOL}` }] };
	} catch (error) {
		console.error('No se pudo pedir la edición en español al buscador', error);
		return undefined;
	}
}

async function obtenerAutores(obra: Obra): Promise<string[]> {
	const claves = (obra.authors ?? []).slice(0, 3).map((a) => a.author.key);
	const autores = await Promise.all(
		claves.map((clave) => pedir<{ name?: string }>(`${clave}.json`).catch(() => ({ name: undefined }))),
	);
	return autores.map((a) => a.name).filter((n): n is string => Boolean(n));
}

function libroDesdeEdicion(obraId: string, obra: Obra, edicion: Edicion | undefined, autores: string[]): Libro {
	return {
		obraId,
		edicionId: edicion ? idDesdeClave(edicion.key) : undefined,
		titulo: edicion?.title ?? obra.title,
		autores,
		idioma: edicion ? idiomaDeEdicion(edicion) : null,
		isbn: mejorIsbn([...(edicion?.isbn_13 ?? []), ...(edicion?.isbn_10 ?? [])]),
		editorial: edicion?.publishers?.[0],
		anio: anioDesde(edicion?.publish_date) ?? anioDesde(obra.first_publish_date),
		portadaId: edicion?.covers?.find((id) => id > 0) ?? obra.covers?.find((id) => id > 0),
	};
}

/** Para elegir la edición en español más útil: mexicana, con ISBN, con portada y reciente. */
function puntaje(edicion: Edicion): number {
	const isbns = [...(edicion.isbn_13 ?? []), ...(edicion.isbn_10 ?? [])];
	let puntos = 0;
	if (isbns.some(esIsbnMexicano)) puntos += 8;
	if (isbns.length) puntos += 4;
	if (edicion.covers?.some((id) => id > 0)) puntos += 2;
	puntos += Math.max(0, (anioDesde(edicion.publish_date) ?? 1900) - 1900) / 200;
	return puntos;
}

// ---------- Utilidades ----------

function idiomaDeEdicion(edicion: Edicion): string | null {
	return idiomaConRespaldo(edicion.languages?.[0]?.key.split('/').pop(), [
		...(edicion.isbn_13 ?? []),
		...(edicion.isbn_10 ?? []),
	]);
}

/**
 * El idioma registrado en el catálogo o, si falta, español cuando la edición tiene ISBN de México:
 * muchas ediciones mexicanas llegan a Open Library sin idioma.
 */
function idiomaConRespaldo(idioma: string | undefined, isbns: string[]): string | null {
	if (idioma) return idioma;
	return isbns.some(esIsbnMexicano) ? ESPANOL : null;
}

function idDesdeClave(clave: string): string {
	return clave.split('/').pop()!;
}

function texto(valor: Texto | undefined): string | undefined {
	if (!valor) return undefined;
	return typeof valor === 'string' ? valor : valor.value;
}

function anioDesde(fecha: string | undefined): number | undefined {
	const anio = fecha?.match(/\b(1[5-9]|20)\d{2}\b/)?.[0];
	return anio ? Number(anio) : undefined;
}

/** ISBN de México: 978-607, 978-968 y 978-970 (o sus equivalentes ISBN-10). */
function esIsbnMexicano(isbn: string): boolean {
	return /^(978)?(607|968|970)/.test(isbn.replace(/-/g, ''));
}

function mejorIsbn(isbns: string[]): string | undefined {
	const limpios = isbns.map((i) => i.replace(/-/g, ''));
	return (
		limpios.find((i) => i.length === 13 && esIsbnMexicano(i)) ??
		limpios.find((i) => i.length === 13) ??
		limpios[0]
	);
}

export function urlPortada(id: number | undefined, tamano: 'S' | 'M' | 'L' = 'M'): string | undefined {
	return id ? `https://covers.openlibrary.org/b/id/${id}-${tamano}.jpg` : undefined;
}
