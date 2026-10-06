/** Códigos ISO 3166-2:MX (sin el prefijo "MX-"), que también usan Vercel y Cloudflare. */
export const ESTADOS = {
	AGU: 'Aguascalientes',
	BCN: 'Baja California',
	BCS: 'Baja California Sur',
	CAM: 'Campeche',
	CHP: 'Chiapas',
	CHH: 'Chihuahua',
	CMX: 'Ciudad de México',
	COA: 'Coahuila',
	COL: 'Colima',
	DUR: 'Durango',
	GUA: 'Guanajuato',
	GRO: 'Guerrero',
	HID: 'Hidalgo',
	JAL: 'Jalisco',
	MEX: 'Estado de México',
	MIC: 'Michoacán',
	MOR: 'Morelos',
	NAY: 'Nayarit',
	NLE: 'Nuevo León',
	OAX: 'Oaxaca',
	PUE: 'Puebla',
	QUE: 'Querétaro',
	ROO: 'Quintana Roo',
	SLP: 'San Luis Potosí',
	SIN: 'Sinaloa',
	SON: 'Sonora',
	TAB: 'Tabasco',
	TAM: 'Tamaulipas',
	TLA: 'Tlaxcala',
	VER: 'Veracruz',
	YUC: 'Yucatán',
	ZAC: 'Zacatecas',
} as const;

export type CodigoEstado = keyof typeof ESTADOS;

export interface Ciudad {
	id: string;
	nombre: string;
	estado: CodigoEstado;
	lat: number;
	lon: number;
}

const c = (id: string, nombre: string, estado: CodigoEstado, lat: number, lon: number): Ciudad => ({
	id,
	nombre,
	estado,
	lat,
	lon,
});

/**
 * Ciudades y alcaldías/municipios con más población de cada estado.
 * La primera de cada estado es la que se usa cuando solo se conoce el estado.
 * Las coordenadas son aproximadas: solo sirven para elegir la ciudad más cercana.
 */
export const CIUDADES: Ciudad[] = [
	c('aguascalientes', 'Aguascalientes', 'AGU', 21.88, -102.29),
	c('tijuana', 'Tijuana', 'BCN', 32.51, -117.04),
	c('mexicali', 'Mexicali', 'BCN', 32.62, -115.45),
	c('ensenada', 'Ensenada', 'BCN', 31.87, -116.6),
	c('la-paz', 'La Paz', 'BCS', 24.14, -110.31),
	c('los-cabos', 'Los Cabos', 'BCS', 23.06, -109.7),
	c('campeche', 'Campeche', 'CAM', 19.85, -90.53),
	c('ciudad-del-carmen', 'Ciudad del Carmen', 'CAM', 18.65, -91.82),
	c('tuxtla', 'Tuxtla Gutiérrez', 'CHP', 16.75, -93.12),
	c('san-cristobal', 'San Cristóbal de las Casas', 'CHP', 16.74, -92.64),
	c('tapachula', 'Tapachula', 'CHP', 14.9, -92.26),
	c('chihuahua', 'Chihuahua', 'CHH', 28.63, -106.07),
	c('ciudad-juarez', 'Ciudad Juárez', 'CHH', 31.69, -106.42),
	c('cuauhtemoc-cdmx', 'Cuauhtémoc (Centro)', 'CMX', 19.43, -99.14),
	c('coyoacan', 'Coyoacán', 'CMX', 19.35, -99.16),
	c('miguel-hidalgo', 'Miguel Hidalgo (Polanco)', 'CMX', 19.43, -99.2),
	c('benito-juarez', 'Benito Juárez (Del Valle)', 'CMX', 19.38, -99.16),
	c('alvaro-obregon', 'Álvaro Obregón (Santa Fe)', 'CMX', 19.36, -99.24),
	c('tlalpan', 'Tlalpan', 'CMX', 19.29, -99.17),
	c('iztapalapa', 'Iztapalapa', 'CMX', 19.36, -99.06),
	c('gustavo-a-madero', 'Gustavo A. Madero', 'CMX', 19.48, -99.11),
	c('xochimilco', 'Xochimilco', 'CMX', 19.26, -99.1),
	c('saltillo', 'Saltillo', 'COA', 25.42, -101.0),
	c('torreon', 'Torreón', 'COA', 25.54, -103.41),
	c('colima', 'Colima', 'COL', 19.24, -103.72),
	c('manzanillo', 'Manzanillo', 'COL', 19.05, -104.32),
	c('durango', 'Durango', 'DUR', 24.02, -104.66),
	c('leon', 'León', 'GUA', 21.12, -101.68),
	c('guanajuato', 'Guanajuato', 'GUA', 21.02, -101.26),
	c('irapuato', 'Irapuato', 'GUA', 20.67, -101.35),
	c('celaya', 'Celaya', 'GUA', 20.52, -100.81),
	c('chilpancingo', 'Chilpancingo', 'GRO', 17.55, -99.5),
	c('acapulco', 'Acapulco', 'GRO', 16.85, -99.82),
	c('pachuca', 'Pachuca', 'HID', 20.1, -98.76),
	c('guadalajara', 'Guadalajara', 'JAL', 20.67, -103.35),
	c('zapopan', 'Zapopan', 'JAL', 20.72, -103.39),
	c('puerto-vallarta', 'Puerto Vallarta', 'JAL', 20.65, -105.23),
	c('toluca', 'Toluca', 'MEX', 19.29, -99.66),
	c('metepec', 'Metepec', 'MEX', 19.25, -99.6),
	c('naucalpan', 'Naucalpan', 'MEX', 19.48, -99.24),
	c('tlalnepantla', 'Tlalnepantla', 'MEX', 19.54, -99.19),
	c('huixquilucan', 'Huixquilucan (Interlomas)', 'MEX', 19.36, -99.35),
	c('cuautitlan-izcalli', 'Cuautitlán Izcalli', 'MEX', 19.65, -99.21),
	c('ecatepec', 'Ecatepec', 'MEX', 19.6, -99.05),
	c('nezahualcoyotl', 'Nezahualcóyotl', 'MEX', 19.4, -99.01),
	c('texcoco', 'Texcoco', 'MEX', 19.51, -98.88),
	c('chalco', 'Chalco', 'MEX', 19.26, -98.9),
	c('morelia', 'Morelia', 'MIC', 19.7, -101.19),
	c('uruapan', 'Uruapan', 'MIC', 19.42, -102.06),
	c('cuernavaca', 'Cuernavaca', 'MOR', 18.92, -99.23),
	c('jiutepec', 'Jiutepec', 'MOR', 18.88, -99.18),
	c('cuautla', 'Cuautla', 'MOR', 18.81, -98.95),
	c('tepic', 'Tepic', 'NAY', 21.5, -104.89),
	c('monterrey', 'Monterrey', 'NLE', 25.67, -100.31),
	c('san-pedro-garza-garcia', 'San Pedro Garza García', 'NLE', 25.65, -100.4),
	c('oaxaca', 'Oaxaca de Juárez', 'OAX', 17.07, -96.72),
	c('puebla', 'Puebla', 'PUE', 19.04, -98.21),
	c('san-andres-cholula', 'San Andrés Cholula', 'PUE', 19.05, -98.3),
	c('tehuacan', 'Tehuacán', 'PUE', 18.46, -97.39),
	c('queretaro', 'Querétaro', 'QUE', 20.59, -100.39),
	c('cancun', 'Cancún', 'ROO', 21.16, -86.85),
	c('playa-del-carmen', 'Playa del Carmen', 'ROO', 20.63, -87.07),
	c('chetumal', 'Chetumal', 'ROO', 18.5, -88.3),
	c('san-luis-potosi', 'San Luis Potosí', 'SLP', 22.15, -100.98),
	c('culiacan', 'Culiacán', 'SIN', 24.81, -107.39),
	c('mazatlan', 'Mazatlán', 'SIN', 23.25, -106.41),
	c('hermosillo', 'Hermosillo', 'SON', 29.07, -110.96),
	c('ciudad-obregon', 'Ciudad Obregón', 'SON', 27.49, -109.94),
	c('villahermosa', 'Villahermosa', 'TAB', 17.99, -92.93),
	c('ciudad-victoria', 'Ciudad Victoria', 'TAM', 23.74, -99.15),
	c('tampico', 'Tampico', 'TAM', 22.23, -97.86),
	c('reynosa', 'Reynosa', 'TAM', 26.09, -98.28),
	c('tlaxcala', 'Tlaxcala', 'TLA', 19.32, -98.24),
	c('apizaco', 'Apizaco', 'TLA', 19.41, -98.14),
	c('xalapa', 'Xalapa', 'VER', 19.54, -96.91),
	c('veracruz', 'Veracruz', 'VER', 19.17, -96.13),
	c('coatzacoalcos', 'Coatzacoalcos', 'VER', 18.14, -94.46),
	c('merida', 'Mérida', 'YUC', 20.97, -89.62),
	c('zacatecas', 'Zacatecas', 'ZAC', 22.77, -102.58),
];

export const CIUDAD_PREDETERMINADA = CIUDADES.find((ciudad) => ciudad.id === 'cuauhtemoc-cdmx')!;
/** La ciudad elegida viaja en la URL (?ciudad=) en lugar de una cookie, para no guardar nada en el dispositivo. */
export const PARAM_CIUDAD = 'ciudad';

export function ciudadPorId(id: string | undefined): Ciudad | undefined {
	return CIUDADES.find((ciudad) => ciudad.id === id);
}

export function ciudadesPorEstado(): [CodigoEstado, Ciudad[]][] {
	return (Object.keys(ESTADOS) as CodigoEstado[]).map((estado) => [
		estado,
		CIUDADES.filter((ciudad) => ciudad.estado === estado),
	]);
}

/** Distancia aproximada en km (haversine). */
function distancia(lat1: number, lon1: number, lat2: number, lon2: number) {
	const rad = Math.PI / 180;
	const dLat = (lat2 - lat1) * rad;
	const dLon = (lon2 - lon1) * rad;
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
	return 12742 * Math.asin(Math.sqrt(a));
}

export function ciudadMasCercana(lat: number, lon: number): Ciudad {
	let mejor = CIUDADES[0];
	let menor = Infinity;
	for (const ciudad of CIUDADES) {
		const d = distancia(lat, lon, ciudad.lat, ciudad.lon);
		if (d < menor) {
			menor = d;
			mejor = ciudad;
		}
	}
	return mejor;
}

export type OrigenUbicacion = 'elegida' | 'red' | 'predeterminada';

/**
 * Decide la ciudad del usuario: primero la que eligió (en la URL), luego la región
 * que manda el hosting (Vercel o Cloudflare) y si no hay nada, CDMX.
 */
export function obtenerUbicacion(url: URL, headers: Headers): { ciudad: Ciudad; origen: OrigenUbicacion } {
	const elegida = ciudadElegida(url);
	if (elegida) return { ciudad: elegida, origen: 'elegida' };

	const pais = headers.get('x-vercel-ip-country') ?? headers.get('cf-ipcountry');
	const region = (headers.get('x-vercel-ip-country-region') ?? headers.get('cf-region-code'))?.toUpperCase();
	if (pais === 'MX' && region && region in ESTADOS) {
		const ciudad = CIUDADES.find((c) => c.estado === region);
		if (ciudad) return { ciudad, origen: 'red' };
	}

	return { ciudad: CIUDAD_PREDETERMINADA, origen: 'predeterminada' };
}

export function ciudadElegida(url: URL): Ciudad | undefined {
	return ciudadPorId(url.searchParams.get(PARAM_CIUDAD) ?? undefined);
}

/** Agrega a un enlace interno la ciudad elegida en la página actual, para no perderla al navegar. */
export function conCiudad(ruta: string, url: URL): string {
	const elegida = ciudadElegida(url);
	if (!elegida) return ruta;
	const destino = new URL(ruta, url);
	destino.searchParams.set(PARAM_CIUDAD, elegida.id);
	return destino.pathname + destino.search + destino.hash;
}

/** El nombre sin la aclaración entre paréntesis: «Cuauhtémoc (Centro)» queda en «Cuauhtémoc». */
export function nombreCorto(ciudad: Ciudad): string {
	return ciudad.nombre.replace(/\s*\(.*\)/, '');
}

export function nombreCompleto(ciudad: Ciudad): string {
	const estado = ESTADOS[ciudad.estado];
	return ciudad.estado === 'CMX' ? `${ciudad.nombre}, CDMX` : `${ciudad.nombre}, ${estado}`;
}
