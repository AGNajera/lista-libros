import { pedirJSON } from './http';

interface RespuestaApple {
	results: { trackViewUrl?: string }[];
}

const TRES_SEGUNDOS = 3000;

/**
 * Apple Books no tiene buscador en la web, así que se pide el primer resultado a la API de búsqueda de iTunes
 * y se enlaza su ficha. Sin resultado o sin respuesta a tiempo no hay enlace, para no frenar la página.
 */
export async function fichaEnAppleBooks(consulta: string): Promise<string | undefined> {
	const url = `https://itunes.apple.com/search?${new URLSearchParams({ term: consulta, country: 'mx', media: 'ebook', limit: '1' })}`;
	const limite = new Promise<undefined>((resolver) => setTimeout(resolver, TRES_SEGUNDOS));
	const ficha = pedirJSON<RespuestaApple>(url)
		.then((respuesta) => respuesta.results[0]?.trackViewUrl)
		.catch(() => undefined);
	return Promise.race([ficha, limite]);
}
