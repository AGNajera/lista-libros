/** Open Library y Wikipedia piden un User-Agent que identifique la app. */
const USER_AGENT = 'Librero/0.1 (buscador de libros en México)';
const DIEZ_MINUTOS = 10 * 60 * 1000;

const cache = new Map<string, { expira: number; valor: Promise<unknown> }>();

export class ErrorHttp extends Error {
	constructor(public estado: number, url: string) {
		super(`${url} respondió ${estado}`);
	}
}

/** GET de JSON con caché en memoria de 10 minutos. */
export async function pedirJSON<T>(url: string): Promise<T> {
	const ahora = Date.now();
	const guardado = cache.get(url);
	if (guardado && guardado.expira > ahora) return guardado.valor as Promise<T>;

	const valor = fetch(url, {
		headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
		signal: AbortSignal.timeout(12_000),
	}).then((res) => {
		if (!res.ok) throw new ErrorHttp(res.status, url);
		return res.json() as Promise<T>;
	});

	// Si falla no se guarda, para reintentar en la siguiente visita.
	valor.catch(() => cache.delete(url));
	if (cache.size > 500) cache.delete(cache.keys().next().value!);
	cache.set(url, { expira: ahora + DIEZ_MINUTOS, valor });
	return valor;
}
