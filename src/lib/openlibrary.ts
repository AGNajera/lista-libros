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

export const POR_PAGINA = 20;

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
	title: string;
	description?: Texto;
	covers?: number[];
	authors?: { author: { key: string } }[];
	first_publish_date?: string;
}

interface Edicion {
	key: string;
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

export const ID_OBRA = /^OL\d+W$/;
export const ID_EDICION = /^OL\d+M$/;

export async function obtenerLibro(obraId: string, edicionId?: string): Promise<DetalleLibro | null> {
	if (!ID_OBRA.test(obraId)) return null;

	let obra: Obra;
	try {
		obra = await pedir<Obra>(`/works/${obraId}.json`);
	} catch (error) {
		if (error instanceof ErrorHttp && error.estado === 404) return null;
		throw error;
	}

	const [{ entries: ediciones }, autores] = await Promise.all([
		pedir<{ entries: Edicion[] }>(`/works/${obraId}/editions.json?limit=100`),
		obtenerAutores(obra),
	]);

	let edicion = edicionId && ID_EDICION.test(edicionId) ? ediciones.find((e) => idDesdeClave(e.key) === edicionId) : undefined;
	if (!edicion && edicionId && ID_EDICION.test(edicionId)) {
		// La obra tiene más de 100 ediciones y la elegida no vino en la primera página.
		edicion = await pedir<Edicion>(`/books/${edicionId}.json`).catch(() => undefined);
	}

	const enEspanol = ediciones.filter((e) => idiomaDeEdicion(e) === ESPANOL).sort((a, b) => puntaje(b) - puntaje(a));
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
	if (!sinopsis) {
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
	};
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
