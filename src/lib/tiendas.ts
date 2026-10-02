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

export interface Tienda {
	id: string;
	nombre: string;
	/** Nombre corto para los botones: «Ver en Gandhi». */
	nombreCorto: string;
	marca: Marca;
	/** Colores del botón de eBook, si es distinto del principal. */
	marcaEbook?: Pick<Marca, 'fondo' | 'texto' | 'hover'>;
	/** Qué formatos vende la tienda en línea. */
	vende: 'impreso' | 'impreso y eBook';
	/** URL de búsqueda en la tienda en línea. */
	buscar: (consulta: string) => string;
	/** Búsqueda de eBook cuando la tienda la separa de los impresos. */
	buscarEbook?: (consulta: string) => string;
	/** Su buscador exige todas las palabras en un mismo campo: con título y autor juntos no encuentra nada. */
	soloTitulo?: boolean;
	/** Nombre con el que se buscan sucursales en Google Maps; sin él, la tienda solo vende en línea. */
	sucursales?: string;
	/** Sellos editoriales que pertenecen al grupo, para avisar que el libro es de su catálogo. */
	sellos?: RegExp;
}

const e = encodeURIComponent;

// Formatos de búsqueda verificados en octubre de 2026.
export const TIENDAS: Tienda[] = [
	{
		id: 'amazon',
		nombre: 'Amazon México',
		nombreCorto: 'Amazon',
		marca: { fondo: '#ffd814', texto: '#0f1111', hover: '#f7ca00', icono: '/tiendas/amazon.svg', placa: false },
		marcaEbook: { fondo: '#ffa41c', texto: '#0f1111', hover: '#fa8900' },
		vende: 'impreso y eBook',
		buscar: (q) => `https://www.amazon.com.mx/s?k=${e(q)}&i=stripbooks`,
		buscarEbook: (q) => `https://www.amazon.com.mx/s?k=${e(q)}&i=digital-text`,
	},
	{
		id: 'gandhi',
		nombre: 'Librerías Gandhi',
		nombreCorto: 'Gandhi',
		marca: { fondo: '#6c2684', texto: '#ffffff', hover: '#561e6a', icono: '/tiendas/gandhi.png', placa: true },
		vende: 'impreso',
		buscar: (q) => `https://www.gandhi.com.mx/${e(q)}?_q=${e(q)}&map=ft`,
		sucursales: 'Librería Gandhi',
	},
	{
		id: 'planeta',
		nombre: 'Planeta de Libros',
		nombreCorto: 'Planeta',
		marca: { fondo: '#0f81e4', texto: '#ffffff', hover: '#0b6cc0', icono: '/tiendas/planeta.svg', placa: false },
		vende: 'impreso y eBook',
		buscar: (q) => `https://www.planetadelibros.com.mx/?textoBuscador=${e(q)}`,
		soloTitulo: true,
		sellos:
			/planeta|booket|destino|seix barral|paid[oó]s|diana|cr[ií]tica|espasa|ariel|tusquets|minotauro|temas de hoy|deusto|emec[eé]|joaqu[ií]n mortiz|crossbooks|alienta|zenith/i,
	},
	{
		id: 'penguin',
		nombre: 'Penguin Libros',
		nombreCorto: 'Penguin',
		marca: { fondo: '#ff5a00', texto: '#ffffff', hover: '#e04f00', icono: '/tiendas/penguin.png', placa: true },
		vende: 'impreso',
		buscar: (q) => `https://www.penguinlibros.com/mx/busqueda?controller=search&s=${e(q)}`,
		sellos:
			/penguin|random house|alfaguara|debolsillo|lumen|grijalbo|plaza (&|y) jan[eé]s|aguilar|taurus|reservoir|montena|beascoa|sudamericana|debate|suma de letras|b de blok|nube de tinta|caballo de troya/i,
	},
	{
		id: 'sanborns',
		nombre: 'Sanborns',
		nombreCorto: 'Sanborns',
		marca: { fondo: '#e2231a', texto: '#ffffff', hover: '#c01d16', icono: '/tiendas/sanborns.png', placa: true },
		vende: 'impreso',
		buscar: (q) => `https://www.sanborns.com.mx/resultados?query=${e(q)}`,
		sucursales: 'Sanborns',
	},
	{
		id: 'sears',
		nombre: 'Sears',
		nombreCorto: 'Sears',
		marca: { fondo: '#e4002b', texto: '#ffffff', hover: '#c10025', icono: '/tiendas/sears.png', placa: true },
		vende: 'impreso',
		buscar: (q) => `https://www.sears.com.mx/resultados?query=${e(q)}`,
		sucursales: 'Sears',
	},
	{
		id: 'liverpool',
		nombre: 'Liverpool',
		nombreCorto: 'Liverpool',
		marca: { fondo: '#e10098', texto: '#ffffff', hover: '#cd008a', icono: '/tiendas/liverpool.png', placa: true },
		vende: 'impreso',
		buscar: (q) => `https://www.liverpool.com.mx/tienda?s=${e(q)}`,
		sucursales: 'Liverpool',
	},
];

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

export function esDeSuCatalogo(tienda: Tienda, editorial: string | undefined): boolean {
	return Boolean(editorial && tienda.sellos?.test(editorial));
}
