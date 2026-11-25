import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorHttp, pedirJSON } from './http';

describe('pedirJSON', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('reutiliza la respuesta en caché para la misma URL', async () => {
		let llamadas = 0;
		vi.stubGlobal('fetch', async () => {
			llamadas += 1;
			return Response.json({ ok: true, llamadas });
		});

		const url = 'https://ejemplo.test/cache-hit-1';
		const primero = await pedirJSON<{ ok: boolean; llamadas: number }>(url);
		const segundo = await pedirJSON<{ ok: boolean; llamadas: number }>(url);
		expect(primero).toEqual({ ok: true, llamadas: 1 });
		expect(segundo).toEqual({ ok: true, llamadas: 1 });
		expect(llamadas).toBe(1);
	});

	it('lanza ErrorHttp con el estado HTTP correspondiente', async () => {
		vi.stubGlobal('fetch', async () => new Response('fallo', { status: 503 }));

		const url = 'https://ejemplo.test/cache-error-retry-1';
		const error = await pedirJSON(url).catch((e) => e);
		expect(error).toBeInstanceOf(ErrorHttp);
		expect(error).toMatchObject({ estado: 503 });
	});

	it('permite reintentar después de una falla porque limpia la caché', async () => {
		let intento = 0;
		vi.stubGlobal('fetch', async () => {
			intento += 1;
			if (intento === 1) return new Response('temporal', { status: 502 });
			return Response.json({ ok: true });
		});

		const url = 'https://ejemplo.test/cache-retry-ok-1';
		await expect(pedirJSON(url)).rejects.toBeInstanceOf(ErrorHttp);
		expect(await pedirJSON<{ ok: boolean }>(url)).toEqual({ ok: true });
		expect(intento).toBe(2);
	});
});
