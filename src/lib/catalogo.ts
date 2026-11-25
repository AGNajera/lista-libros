import type { Sinopsis } from './sinopsis';

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

export interface ResultadoBusqueda {
	libros: Libro[];
	total: number;
}

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
