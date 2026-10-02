/** Códigos MARC que usa Open Library, con el nombre en español. */
const IDIOMAS: Record<string, string> = {
	spa: 'español',
	eng: 'inglés',
	fre: 'francés',
	por: 'portugués',
	ger: 'alemán',
	ita: 'italiano',
	cat: 'catalán',
	jpn: 'japonés',
	chi: 'chino',
	kor: 'coreano',
	rus: 'ruso',
	ara: 'árabe',
	dut: 'neerlandés',
	pol: 'polaco',
	swe: 'sueco',
	gre: 'griego',
	lat: 'latín',
	heb: 'hebreo',
	tur: 'turco',
	glg: 'gallego',
	baq: 'euskera',
};

export const ESPANOL = 'spa';

export function nombreIdioma(codigo: string | null): string | null {
	if (!codigo) return null;
	return IDIOMAS[codigo] ?? null;
}

/** Texto para avisar que un libro no está en español. */
export function avisoIdioma(codigo: string | null): string {
	if (codigo === ESPANOL) return '';
	const nombre = nombreIdioma(codigo);
	if (!nombre) return 'No pudimos confirmar el idioma de esta edición.';
	return `Este libro está en ${nombre}.`;
}
