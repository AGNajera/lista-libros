import { describe, expect, it } from 'vitest';
import { PAGINA_MAXIMA, POR_PAGINA, paginaPedida, paginasDe } from './openlibrary';

describe('paginaPedida', () => {
	it.each([
		[null, 1],
		['', 1],
		['abc', 1],
		['0', 1],
		['-3', 1],
		['2.7', 2],
		['7', 7],
		['99999', 99999],
	])('con %j pide la página %i', (valor, pagina) => {
		expect(paginaPedida(valor)).toBe(pagina);
	});
});

describe('paginasDe', () => {
	it.each([
		[0, 0],
		[1, 1],
		[POR_PAGINA, 1],
		[POR_PAGINA + 1, 2],
		[PAGINA_MAXIMA * POR_PAGINA, PAGINA_MAXIMA],
	])('con %i libros hay %i páginas', (total, paginas) => {
		expect(paginasDe(total)).toBe(paginas);
	});

	it('no pasa del tope en una búsqueda muy amplia', () => {
		// «C++» encuentra más de un millón de libros: serían más de 70 mil páginas.
		expect(paginasDe(1_455_370)).toBe(PAGINA_MAXIMA);
	});

	it('deja fuera de rango una página pedida más allá de la última', () => {
		// /buscar?q=amor&pagina=99999, con unos 48 mil libros, redirige a la última página que se puede recorrer.
		expect(paginaPedida('99999')).toBeGreaterThan(paginasDe(47_959));
	});
});
