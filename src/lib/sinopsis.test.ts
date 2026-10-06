import { describe, expect, it } from 'vitest';
import { pareceEspanol, pareceIngles } from './sinopsis';

// La misma sinopsis de Drácula, redactada para estas pruebas en cada idioma.
const ESPANOL =
	'Jonathan Harker viaja a Transilvania para cerrar un negocio con el conde Drácula, y pronto descubre que es prisionero en el castillo.';
const INGLES =
	'Jonathan Harker travels to Transylvania to close a deal with Count Dracula and soon discovers that he is a prisoner in the castle.';

const OTROS_IDIOMAS = [
	// El caso que dio origen a la lista de portugués: /libro/OL85892W mostraba esta sinopsis como si fuera española.
	[
		'portugués',
		'Jonathan Harker viaja para a Transilvânia para fechar um negócio com o conde Drácula e logo descobre que é prisioneiro no castelo. Um romance sobre o medo e o desejo que não se esquece.',
	],
	[
		'francés',
		"Jonathan Harker se rend en Transylvanie pour conclure une affaire avec le comte Dracula, et découvre bientôt qu'il est prisonnier dans le château.",
	],
	[
		'italiano',
		'Jonathan Harker viaggia in Transilvania per concludere un affare con il conte Dracula e scopre presto di essere prigioniero nel castello.',
	],
	['catalán', "La novel·la explica la història d'un jove que viu en un poble i descobreix el secret de la seva família."],
	['gallego', 'A novela conta a historia dun mozo que vive nunha aldea e descobre o segredo da súa familia.'],
	// Textos cortos cargados de palabras que el español comparte con cada vecino («la», «un», «en», «con», «al»).
	['francés corto', 'La jeune femme vit en Provence, dans un village, avec la famille de la voisine. En un jour, la vie change.'],
	['italiano corto', 'La ragazza vive con la nonna in una casa al mare e un giorno lo zio torna con un segreto.'],
	['catalán corto', 'Un nen viu amb els avis en una casa al costat del mar, però un dia tot canvia.'],
	['inglés', INGLES],
];

describe('pareceEspanol', () => {
	it('reconoce una sinopsis en español', () => {
		expect(pareceEspanol(ESPANOL)).toBe(true);
	});

	it.each(OTROS_IDIOMAS)('no toma por española una sinopsis en %s', (_idioma, texto) => {
		expect(pareceEspanol(texto)).toBe(false);
	});

	it.each([
		// Solo traen palabras que el español comparte con el catalán o el francés: el empate es para el español.
		'La historia de una familia en el exilio.',
		'El clásico de terror de Bram Stoker.',
		// «dos», «les», «sur», «o» y «e» también son palabras de otro idioma.
		'La historia de dos hermanos.',
		'Dos hermanos y dos destinos.',
		'La maestra les enseña en un aula.',
		'Un viaje al sur.',
		'Una novela sobre la vida o la muerte.',
		'Padres e hijos en un pueblo del norte.',
	])('reconoce un texto corto en español: %s', (texto) => {
		expect(pareceEspanol(texto)).toBe(true);
	});

	it('no decide nada cuando el texto no trae palabras frecuentes', () => {
		expect(pareceEspanol('Novela gótica.')).toBe(false);
		expect(pareceEspanol('')).toBe(false);
	});
});

describe('pareceIngles', () => {
	it.each([
		INGLES,
		// «I», «as» y «do» también se escriben igual en italiano y en portugués.
		'I went there. I saw him. I left, and I never came back in time.',
		'Life in Paris as a young painter.',
	])('reconoce un texto en inglés: %s', (texto) => {
		expect(pareceIngles(texto)).toBe(true);
	});

	it.each([['español', ESPANOL], ...OTROS_IDIOMAS.filter(([idioma]) => idioma !== 'inglés')])(
		'no toma por inglesa una sinopsis en %s',
		(_idioma, texto) => {
			expect(pareceIngles(texto)).toBe(false);
		},
	);

	it('no decide nada cuando el texto no trae palabras frecuentes', () => {
		expect(pareceIngles('Gothic novel.')).toBe(false);
	});
});
