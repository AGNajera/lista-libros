import { describe, expect, it } from 'vitest';
import {
	ESTADOS,
	ciudadMasCercana,
	ciudadesPorEstado,
	conCiudad,
	nombreCompleto,
	nombreCorto,
	obtenerUbicacion,
} from './ubicacion';

function peticionConCf(cf?: { country?: string; regionCode?: string }): Request {
	const req = new Request('https://librero.test/');
	if (cf) Object.assign(req, { cf });
	return req;
}

describe('obtenerUbicacion', () => {
	it('prioriza la ciudad elegida en el parámetro ?ciudad=', () => {
		const url = new URL('https://librero.test/?ciudad=coyoacan');
		const ubicacion = obtenerUbicacion(url, peticionConCf({ country: 'MX', regionCode: 'JAL' }));
		expect(ubicacion).toMatchObject({ origen: 'elegida', ciudad: { id: 'coyoacan', estado: 'CMX' } });
	});

	it('usa la región de Cloudflare cuando la petición viene de México', () => {
		const url = new URL('https://librero.test/');
		const ubicacion = obtenerUbicacion(url, peticionConCf({ country: 'MX', regionCode: 'jal' }));
		expect(ubicacion).toMatchObject({ origen: 'red', ciudad: { id: 'guadalajara', estado: 'JAL' } });
	});

	it('cae a Cuauhtémoc CDMX si el país no es México o no hay datos de red', () => {
		const url = new URL('https://librero.test/?ciudad=invalida');
		expect(obtenerUbicacion(url, peticionConCf({ country: 'US', regionCode: 'CA' }))).toMatchObject({
			origen: 'predeterminada',
			ciudad: { id: 'cuauhtemoc-cdmx' },
		});
		expect(obtenerUbicacion(new URL('https://librero.test/'), peticionConCf())).toMatchObject({
			origen: 'predeterminada',
			ciudad: { id: 'cuauhtemoc-cdmx' },
		});
	});
});

describe('ciudadMasCercana', () => {
	it('encuentra la ciudad más cercana a unas coordenadas dadas', () => {
		expect(ciudadMasCercana(25.67, -100.31).id).toBe('monterrey');
		expect(ciudadMasCercana(20.97, -89.62).id).toBe('merida');
	});
});

describe('conCiudad y formatos de nombre', () => {
	it('conserva la ciudad elegida en enlaces internos y no toca enlaces sin ciudad', () => {
		expect(conCiudad('/buscar?q=rulfo#resultados', new URL('https://librero.test/?ciudad=puebla'))).toBe(
			'/buscar?q=rulfo&ciudad=puebla#resultados',
		);
		expect(conCiudad('/buscar?q=rulfo', new URL('https://librero.test/'))).toBe('/buscar?q=rulfo');
	});

	it('formatea nombres cortos y completos', () => {
		const { ciudad } = obtenerUbicacion(new URL('https://librero.test/?ciudad=cuauhtemoc-cdmx'), peticionConCf());
		expect(nombreCorto(ciudad)).toBe('Cuauhtémoc');
		expect(nombreCompleto(ciudad)).toBe('Cuauhtémoc (Centro), CDMX');
	});

	it('agrupa todas las ciudades cubriendo los 32 estados', () => {
		const grupos = ciudadesPorEstado();
		expect(grupos).toHaveLength(Object.keys(ESTADOS).length);
		expect(grupos.every(([, lista]) => lista.length > 0)).toBe(true);
	});
});
