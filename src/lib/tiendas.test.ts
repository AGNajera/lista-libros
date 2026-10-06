import { describe, expect, it } from 'vitest';
import { TIENDAS, esDeSuCatalogo } from './tiendas';

const grupoDe = (editorial: string) => TIENDAS.filter((tienda) => esDeSuCatalogo(tienda, editorial)).map((tienda) => tienda.id);

describe('esDeSuCatalogo', () => {
	it.each([
		['Editorial Diana', 'planeta'],
		['Emecé Editores', 'planeta'],
		['Ediciones Paidós', 'planeta'],
		['Booket', 'planeta'],
		['Plaza & Janés', 'penguin'],
		['Penguin Random House Grupo Editorial', 'penguin'],
		['DEBOLSILLO', 'penguin'],
	])('reconoce el sello %s', (editorial, tienda) => {
		expect(grupoDe(editorial)).toEqual([tienda]);
	});

	// El nombre de un sello aparecía dentro de otra palabra: «diana» en «Indiana», «crítica» en «Critical».
	it.each(['Indiana University Press', 'Critical Publishing', 'Arielle Editions', 'Fondo de Cultura Económica'])(
		'no atribuye %s a ningún grupo',
		(editorial) => {
			expect(grupoDe(editorial)).toEqual([]);
		},
	);

	it('no atribuye nada cuando la edición no trae editorial', () => {
		expect(grupoDe('')).toEqual([]);
		expect(TIENDAS.some((tienda) => esDeSuCatalogo(tienda, undefined))).toBe(false);
	});
});
