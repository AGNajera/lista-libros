import { afterEach, describe, expect, it, vi } from 'vitest';
import { PAGINA_MAXIMA, POR_PAGINA, buscarLibros, obtenerLibro, paginaPedida, paginasDe } from './openlibrary';

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

/** Responde cada ruta de Open Library con el JSON indicado; lo demás (autores, Wikipedia) llega vacío y lo que falte, con 404. */
function simularCatalogo(rutas: Record<string, unknown>) {
	vi.stubGlobal('fetch', async (url: string) => {
		const ruta = url.replace('https://openlibrary.org', '');
		if (ruta in rutas) return Response.json(rutas[ruta]);
		return url.includes('wikipedia.org') ? Response.json({}) : new Response('', { status: 404 });
	});
}

describe('obtenerLibro', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('avisa en qué obra quedó una fusionada', async () => {
		simularCatalogo({ '/works/OL901W.json': { type: { key: '/type/redirect' }, location: '/works/OL902W' } });
		expect(await obtenerLibro('OL901W')).toEqual({ fusionadaEn: 'OL902W' });
	});

	it('no encuentra una obra borrada ni una fusión sin destino válido', async () => {
		simularCatalogo({
			'/works/OL903W.json': { type: { key: '/type/delete' } },
			'/works/OL904W.json': { type: { key: '/type/redirect' }, location: '/authors/OL1A' },
		});
		expect(await obtenerLibro('OL903W')).toBeNull();
		expect(await obtenerLibro('OL904W')).toBeNull();
	});

	const obra = { type: { key: '/type/work' }, title: 'Hábitos atómicos' };
	const propia = { key: '/books/OL11M', works: [{ key: '/works/OL905W' }], title: 'Hábitos atómicos', languages: [{ key: '/languages/spa' }] };

	it('ignora la edición de otra obra', async () => {
		simularCatalogo({
			'/works/OL905W.json': obra,
			'/works/OL905W/editions.json?limit=100': { size: 1, entries: [propia] },
			'/books/OL99M.json': { key: '/books/OL99M', works: [{ key: '/works/OL85892W' }], title: 'Dracula' },
		});
		expect(await obtenerLibro('OL905W', 'OL99M')).toMatchObject({ titulo: 'Hábitos atómicos', edicionId: 'OL11M' });
	});

	it('acepta una edición de la obra que no vino entre las primeras', async () => {
		simularCatalogo({
			'/works/OL906W.json': obra,
			'/works/OL906W/editions.json?limit=100': { size: 1, entries: [{ ...propia, works: [{ key: '/works/OL906W' }] }] },
			'/books/OL12M.json': { key: '/books/OL12M', works: [{ key: '/works/OL906W' }], title: 'Atomic Habits', languages: [{ key: '/languages/eng' }] },
		});
		expect(await obtenerLibro('OL906W', 'OL12M')).toMatchObject({ titulo: 'Atomic Habits', edicionId: 'OL12M', idioma: 'eng' });
	});

	it('no pide los autores que ya se saben ni la sinopsis de Wikipedia si no se quiere', async () => {
		simularCatalogo({
			'/works/OL907W.json': { ...obra, authors: [{ author: { key: '/authors/OL1A' } }] },
			'/works/OL907W/editions.json?limit=100': { size: 1, entries: [{ ...propia, works: [{ key: '/works/OL907W' }] }] },
		});
		const pedidas: string[] = [];
		const simulado = fetch;
		vi.stubGlobal('fetch', (url: string) => (pedidas.push(url), simulado(url)));

		const libro = await obtenerLibro('OL907W', undefined, { autores: ['James Clear'], wikipedia: false });
		expect(libro).toMatchObject({ autores: ['James Clear'], sinopsis: undefined });
		expect(pedidas.some((url) => url.includes('/authors/') || url.includes('wikipedia.org'))).toBe(false);
	});

	it('prefiere la edición en español con ISBN mexicano frente a otras en español', async () => {
		simularCatalogo({
			'/works/OL908W.json': obra,
			'/works/OL908W/editions.json?limit=100': {
				size: 2,
				entries: [
					{
						key: '/books/OL20M',
						works: [{ key: '/works/OL908W' }],
						title: 'Hábitos atómicos (España)',
						languages: [{ key: '/languages/spa' }],
						isbn_13: ['9788408210000'],
						publish_date: '2024',
						covers: [100],
					},
					{
						key: '/books/OL21M',
						works: [{ key: '/works/OL908W' }],
						title: 'Hábitos atómicos (México)',
						isbn_13: ['9786077476719'],
						publish_date: '2019',
					},
				],
			},
		});
		const libro = await obtenerLibro('OL908W');
		expect(libro).toMatchObject({ edicionId: 'OL21M', titulo: 'Hábitos atómicos (México)', idioma: 'spa' });
	});

	it('consulta el buscador cuando una obra tiene más ediciones que el límite inicial', async () => {
		simularCatalogo({
			'/works/OL909W.json': obra,
			'/works/OL909W/editions.json?limit=100': {
				size: 150,
				entries: [{ key: '/books/OL30M', works: [{ key: '/works/OL909W' }], title: 'Atomic Habits', languages: [{ key: '/languages/eng' }] }],
			},
			'/search.json?q=key%3A%2Fworks%2FOL909W&lang=es&limit=1&fields=key%2Ceditions%2Ceditions.key%2Ceditions.language%2Ceditions.isbn': {
				docs: [
					{
						key: '/works/OL909W',
						editions: { docs: [{ key: '/books/OL31M', language: ['spa'], isbn: ['9786077476719'] }] },
					},
				],
			},
			'/books/OL31M.json': { key: '/books/OL31M', works: [{ key: '/works/OL909W' }], title: 'Hábitos atómicos' },
		});
		const libro = await obtenerLibro('OL909W');
		expect(libro).toMatchObject({
			edicionId: 'OL31M',
			idioma: 'spa',
			edicionesIncompletas: true,
			totalEdicionesEspanol: 1,
		});
	});
});

describe('buscarLibros', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('pone los libros en español primero conservando el orden de relevancia', async () => {
		const pedidas: string[] = [];
		vi.stubGlobal('fetch', async (url: string) => {
			pedidas.push(url);
			return Response.json({
				numFound: 3,
				docs: [
					{
						key: '/works/OL1W',
						title: 'Book One',
						editions: { docs: [{ key: '/books/OL1M', title: 'Book One', language: ['eng'] }] },
					},
					{
						key: '/works/OL2W',
						title: 'Libro Dos',
						editions: { docs: [{ key: '/books/OL2M', title: 'Libro Dos', isbn: ['9786070750403'] }] },
					},
					{
						key: '/works/OL3W',
						title: 'Libro Tres',
						editions: { docs: [{ key: '/books/OL3M', title: 'Libro Tres', language: ['spa'] }] },
					},
				],
			});
		});

		const resultado = await buscarLibros('prueba relevancia');
		expect(new URL(pedidas[0]).searchParams.get('q')).toBe('prueba relevancia');
		expect(resultado.total).toBe(3);
		expect(resultado.libros.map((l) => [l.obraId, l.idioma])).toEqual([
			['OL2W', 'spa'],
			['OL3W', 'spa'],
			['OL1W', 'eng'],
		]);
	});
});
