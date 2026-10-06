import { fichaEnAppleBooks } from './apple';
import type { Libro } from './openlibrary';
import { ESTADOS, type Ciudad } from './ubicacion';

/** Colores del botón principal de cada tienda, tomados de sus sitios (octubre de 2026). */
export interface Marca {
	fondo: string;
	texto: string;
	hover: string;
	/** Ícono en /public/tiendas. */
	icono: string;
	/** El ícono trae su propio fondo (favicon cuadrado) y se muestra como placa redondeada. */
	placa: boolean;
}

type Buscador = (consulta: string) => string;

/** Venta de eBook de una tienda, que va en su propia sección de la ficha. */
export interface Ebook {
	/** Nombre de la tienda de eBook, si es distinto del de la tienda. */
	nombre?: string;
	/** Colores del botón de eBook, si es distinto del principal. */
	marca?: Pick<Marca, 'fondo' | 'texto' | 'hover'>;
	/** URL de búsqueda de eBook en la tienda en línea. */
	buscar?: Buscador;
	/** Para tiendas sin buscador web: consigue el enlace a la ficha del libro, si lo tienen. */
	resolver?: (consulta: string) => Promise<string | undefined>;
	/** Dónde se lee lo que se compra ahí. */
	lectura: string;
}

export interface Tienda {
	id: string;
	nombre: string;
	/** Nombre corto para los botones: «Ver en Gandhi». */
	nombreCorto: string;
	marca: Marca;
	/** URL de búsqueda de libros impresos en la tienda en línea; sin ella, la tienda solo vende eBook. */
	buscar?: Buscador;
	/** Sin él, la tienda solo vende impresos. */
	ebook?: Ebook;
	/** Su buscador exige todas las palabras en un mismo campo: con título y autor juntos no encuentra nada. */
	soloTitulo?: boolean;
	/** Nombre con el que se buscan sucursales en Google Maps; sin él, la tienda solo vende en línea. */
	sucursales?: string;
	/** Sellos editoriales que pertenecen al grupo, para avisar que el libro es de su catálogo. */
	sellos?: RegExp;
}

export type TiendaImpreso = Tienda & { buscar: Buscador };
export type TiendaEbook = Tienda & { ebook: Ebook };

const e = encodeURIComponent;

/** Los sellos se buscan como palabras completas: «diana» no debe encontrarse dentro de «Indiana University Press». */
const sellos = (nombres: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${nombres})(?![\\p{L}\\p{N}])`, 'iu');

// Formatos de búsqueda verificados en octubre de 2026.
export const TIENDAS: Tienda[] = [
	{
		id: 'amazon',
		nombre: 'Amazon México',
		nombreCorto: 'Amazon',
		marca: { fondo: '#ffd814', texto: '#0f1111', hover: '#f7ca00', icono: '/tiendas/amazon.svg', placa: false },
		buscar: (q) => `https://www.amazon.com.mx/s?k=${e(q)}&i=stripbooks`,
		ebook: {
			nombre: 'Amazon Kindle',
			marca: { fondo: '#ffa41c', texto: '#0f1111', hover: '#fa8900' },
			buscar: (q) => `https://www.amazon.com.mx/s?k=${e(q)}&i=digital-text`,
			lectura: 'Se lee en un Kindle o en su app',
		},
	},
	{
		id: 'gandhi',
		nombre: 'Librerías Gandhi',
		nombreCorto: 'Gandhi',
		marca: { fondo: '#6c2684', texto: '#ffffff', hover: '#561e6a', icono: '/tiendas/gandhi.webp', placa: true },
		buscar: (q) => `https://www.gandhi.com.mx/${e(q)}?_q=${e(q)}&map=ft`,
		sucursales: 'Librería Gandhi',
	},
	{
		id: 'planeta',
		nombre: 'Planeta de Libros',
		nombreCorto: 'Planeta',
		marca: { fondo: '#0f81e4', texto: '#ffffff', hover: '#0b6cc0', icono: '/tiendas/planeta.svg', placa: false },
		buscar: (q) => `https://www.planetadelibros.com.mx/?textoBuscador=${e(q)}`,
		// No separa los eBook: el formato se elige en la ficha de cada libro.
		ebook: {
			buscar: (q) => `https://www.planetadelibros.com.mx/?textoBuscador=${e(q)}`,
			lectura: 'El formato eBook se elige en la ficha del libro',
		},
		soloTitulo: true,
		sellos: sellos(
			'planeta|booket|destino|seix barral|paid[oó]s|diana|cr[ií]tica|espasa|ariel|tusquets|minotauro|temas de hoy|deusto|emec[eé]|joaqu[ií]n mortiz|crossbooks|alienta|zenith',
		),
	},
	{
		id: 'penguin',
		nombre: 'Penguin Libros',
		nombreCorto: 'Penguin',
		marca: { fondo: '#ff5a00', texto: '#ffffff', hover: '#e04f00', icono: '/tiendas/penguin.webp', placa: true },
		// Su buscador es una capa de Motive que se abre sobre la portada; la ruta anterior, /mx/busqueda, ya responde 403.
		buscar: (q) => `https://www.penguinlibros.com/mx/?mot_q=${e(q)}`,
		sellos: sellos(
			'penguin|random house|alfaguara|debolsillo|lumen|grijalbo|plaza (&|y) jan[eé]s|aguilar|taurus|reservoir|montena|beascoa|sudamericana|debate|suma de letras|b de blok|nube de tinta|caballo de troya',
		),
	},
	{
		id: 'sanborns',
		nombre: 'Sanborns',
		nombreCorto: 'Sanborns',
		marca: { fondo: '#e2231a', texto: '#ffffff', hover: '#c01d16', icono: '/tiendas/sanborns.svg', placa: true },
		buscar: (q) => `https://www.sanborns.com.mx/resultados?query=${e(q)}`,
		sucursales: 'Sanborns',
	},
	{
		id: 'sears',
		nombre: 'Sears',
		nombreCorto: 'Sears',
		marca: { fondo: '#e4002b', texto: '#ffffff', hover: '#c10025', icono: '/tiendas/sears.svg', placa: true },
		buscar: (q) => `https://www.sears.com.mx/resultados?query=${e(q)}`,
		sucursales: 'Sears',
	},
	{
		id: 'liverpool',
		nombre: 'Liverpool',
		nombreCorto: 'Liverpool',
		marca: { fondo: '#e10098', texto: '#ffffff', hover: '#cd008a', icono: '/tiendas/liverpool.svg', placa: true },
		buscar: (q) => `https://www.liverpool.com.mx/tienda?s=${e(q)}`,
		sucursales: 'Liverpool',
	},
	{
		id: 'kobo',
		nombre: 'Rakuten Kobo',
		nombreCorto: 'Kobo',
		marca: { fondo: '#bf0000', texto: '#ffffff', hover: '#a00000', icono: '/tiendas/kobo.svg', placa: true },
		ebook: {
			buscar: (q) => `https://www.kobo.com/mx/es/search?query=${e(q)}`,
			lectura: 'Se lee en un Kobo o en su app',
		},
	},
	{
		id: 'googleplay',
		nombre: 'Google Play Libros',
		nombreCorto: 'Google Play',
		marca: { fondo: '#01875f', texto: '#ffffff', hover: '#056449', icono: '/tiendas/googleplay.svg', placa: true },
		ebook: {
			buscar: (q) => `https://play.google.com/store/search?q=${e(q)}&c=books&gl=MX&hl=es`,
			lectura: 'Se lee en la app Google Play Libros o en el navegador',
		},
	},
	{
		id: 'apple',
		nombre: 'Apple Books',
		nombreCorto: 'Apple Books',
		marca: { fondo: '#1d1d1f', texto: '#ffffff', hover: '#3a3a3c', icono: '/tiendas/applebooks.svg', placa: true },
		ebook: {
			resolver: fichaEnAppleBooks,
			lectura: 'Se lee en la app Libros de iPhone, iPad o Mac',
		},
	},
];

export const TIENDAS_IMPRESO = TIENDAS.filter((tienda): tienda is TiendaImpreso => Boolean(tienda.buscar));
export const TIENDAS_EBOOK = TIENDAS.filter((tienda): tienda is TiendaEbook => Boolean(tienda.ebook));

/** Título sin subtítulo, porque las tiendas suelen registrar otro o ninguno. */
export function tituloParaTiendas(libro: Libro): string {
	return libro.titulo.split(/[:(]/)[0].trim();
}

/** Título y primer autor, que sirve aunque la tienda no indexe ISBN; solo el título si su buscador no los mezcla. */
export function consultaParaTiendas(libro: Libro, tienda?: Tienda): string {
	const titulo = tituloParaTiendas(libro);
	if (tienda?.soloTitulo) return titulo;
	return [titulo, libro.autores[0]].filter(Boolean).join(' ');
}

export function urlSucursales(tienda: Tienda, ciudad: Ciudad): string | undefined {
	if (!tienda.sucursales) return undefined;
	const lugar = `${ciudad.nombre.replace(/\s*\(.*\)/, '')}, ${ESTADOS[ciudad.estado]}`;
	return `https://www.google.com/maps/search/?api=1&query=${e(`${tienda.sucursales} ${lugar}`)}`;
}

/** La tienda cuyo grupo editorial publica esta edición va primero. */
export function primeroSuCatalogo<T extends Tienda>(tiendas: T[], editorial: string | undefined): T[] {
	return [...tiendas].sort((a, b) => Number(esDeSuCatalogo(b, editorial)) - Number(esDeSuCatalogo(a, editorial)));
}

/** Enlace al eBook en la tienda; `undefined` si no tiene buscador web y no encontró el libro. */
export async function urlEbook(tienda: TiendaEbook, consulta: string): Promise<string | undefined> {
	return tienda.ebook.buscar?.(consulta) ?? tienda.ebook.resolver?.(consulta);
}

export function esDeSuCatalogo(tienda: Tienda, editorial: string | undefined): boolean {
	return Boolean(editorial && tienda.sellos?.test(editorial));
}
