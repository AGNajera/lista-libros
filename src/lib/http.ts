/** Open Library y Wikipedia piden un User-Agent que identifique la app. Va sin acentos: un encabezado solo admite ASCII. */
const USER_AGENT = 'Librero/0.1 (buscador de libros en Mexico)';
const DIEZ_MINUTOS = 10 * 60 * 1000;
const UN_DIA = 24 * 60 * 60;

const cache = new Map<string, { expira: number; valor: Promise<unknown> }>();

export class ErrorHttp extends Error {
	constructor(public estado: number, url: string) {
		super(`${url} respondió ${estado}`);
	}
}

/**
 * Opciones de fetch que solo entiende Cloudflare: guardan la respuesta un día en la caché del centro de datos.
 * La caché en memoria se pierde con cada isolate nuevo; esta la comparten todos los del mismo centro de datos.
 * Los errores no se guardan, para reintentar en la siguiente visita. Fuera de Cloudflare, fetch las ignora.
 */
const cacheCloudflare = {
	cacheEverything: true,
	cacheTtlByStatus: { '200-299': UN_DIA, '404': 60 * 60, '500-599': 0 },
};

/** GET de JSON con caché en memoria de 10 minutos y, en Cloudflare, de un día en el centro de datos. */
export async function pedirJSON<T>(url: string): Promise<T> {
	const ahora = Date.now();
	const guardado = cache.get(url);
	if (guardado && guardado.expira > ahora) return guardado.valor as Promise<T>;

	const opciones: RequestInit & { cf?: typeof cacheCloudflare } = {
		headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
		signal: AbortSignal.timeout(12_000),
		cf: cacheCloudflare,
	};
	const valor = fetch(url, opciones).then((res) => {
		if (!res.ok) throw new ErrorHttp(res.status, url);
		return res.json() as Promise<T>;
	});

	// Si falla no se guarda, para reintentar en la siguiente visita.
	valor.catch(() => cache.delete(url));
	if (cache.size > 500) cache.delete(cache.keys().next().value!);
	cache.set(url, { expira: ahora + DIEZ_MINUTOS, valor });
	return valor;
}
