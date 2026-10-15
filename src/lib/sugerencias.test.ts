import { describe, expect, it } from 'vitest';
import { SUGERENCIAS, pieDeImprenta } from './sugerencias';

describe('pieDeImprenta', () => {
	it('junta editorial, año y páginas como en una ficha', () => {
		expect(pieDeImprenta({ editorial: 'Planeta', anio: 2019, paginas: 320 })).toBe('Planeta, 2019. 320 páginas.');
	});

	it.each([
		['Editorial Planeta, S. A.', 'Editorial Planeta, 2023.'],
		['Penguin Random House Grupo Editorial S.A. de C.V.', 'Penguin Random House Grupo Editorial, 2023.'],
	])('quita la razón social de %s', (editorial, esperado) => {
		expect(pieDeImprenta({ editorial, anio: 2023 })).toBe(esperado);
	});

	it('omite lo que falta', () => {
		expect(pieDeImprenta({ paginas: 168 })).toBe('168 páginas.');
		expect(pieDeImprenta({})).toBe('');
	});
});

describe('SUGERENCIAS', () => {
	it('usa ids de obra de Open Library, sin repetir', () => {
		const ids = SUGERENCIAS.map((sugerencia) => sugerencia.obraId);
		expect(ids.every((id) => /^OL\d+W$/.test(id))).toBe(true);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
