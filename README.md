# Librero

Buscador de libros que muestra dónde comprarlos en México. Impresos: Amazon México, Librerías Gandhi, Planeta de Libros, Penguin Libros, Sanborns, Sears y Liverpool. En eBook: Amazon Kindle, Planeta de Libros, Rakuten Kobo, Google Play Libros y Apple Books.

- Busca primero ediciones en español y marca con un sello las que están en otro idioma («En inglés»). Si el libro elegido no está en español pero existe una edición en español, lo avisa y la enlaza.
- Las tiendas con sucursales (Gandhi, Sanborns, Sears y Liverpool) enlazan a Google Maps con la ciudad del usuario: CDMX por alcaldía, Estado de México, Morelos y las principales ciudades de cada estado.
- Navegación con View Transitions (`<ClientRouter />`): la portada y el título viajan de la lista al detalle.

## Cómo se decide la ubicación

1. La ciudad que el usuario eligió en la barra superior o con «Usar mi ubicación». Viaja en la URL (`?ciudad=coyoacan`) y los enlaces internos la conservan; no se usan cookies ni se guarda nada en el dispositivo, y las coordenadas no salen del navegador.
2. La región que manda el hosting, si existe (`x-vercel-ip-country-region` en Vercel o `cf-region-code` en Cloudflare).
3. Si no hay nada, Cuauhtémoc, CDMX.

## Datos

Los libros vienen de la [API de Open Library](https://openlibrary.org/developers/api), que no pide llave. Las respuestas se guardan 10 minutos en memoria.

La sinopsis siempre se intenta mostrar en español, en este orden:

1. La descripción de la edición elegida o de cualquier edición en español del catálogo (limpia de HTML y Markdown).
2. La introducción del artículo del libro en [Wikipedia en español](https://es.wikipedia.org), con enlace a la fuente. Solo se aceptan artículos que Wikipedia describe como libro y cuyo título coincide.
3. Si no hay ninguna, se avisa al usuario y se muestra la sinopsis en inglés (u otro idioma) que tenga el catálogo.

Cuando una edición no tiene idioma registrado pero sí ISBN de México (978-607, 978-968 o 978-970), se considera en español.

Los botones de compra usan los colores e íconos de cada tienda (`public/tiendas/`). Los colores se tomaron de sus sitios en octubre de 2026; los íconos son sus favicons, salvo el de Amazon, que viene de [Simple Icons](https://simpleicons.org). Son marcas registradas de cada empresa y solo se usan para identificar la tienda a la que lleva cada enlace.

Los enlaces de las tiendas son búsquedas por título y autor; cada tienda confirma precio, existencias y envío.

## Comandos

| Comando             | Acción                                      |
| :------------------ | :------------------------------------------ |
| `pnpm install`      | Instala dependencias                        |
| `pnpm dev`          | Servidor de desarrollo en `localhost:4321`  |
| `pnpm build`        | Compila para Vercel en `./.vercel/output/`  |
| `pnpm test`         | Corre las pruebas de `src/lib/` con Vitest  |

El sitio usa el adaptador de Vercel, que no tiene vista previa local: la versión compilada se prueba en un despliegue de vista previa.

## Estructura

```text
src/
├── components/   Buscadores, portada, sello de idioma y selector de ciudad
├── layouts/      Layout con ClientRouter y fuentes
├── lib/
│   ├── openlibrary.ts   Búsqueda y detalle, elección de la edición en español
│   ├── sinopsis.ts      Limpieza de descripciones y resumen de Wikipedia
│   ├── http.ts          Peticiones JSON con caché
│   ├── tiendas.ts       Tiendas, URLs de búsqueda y sellos editoriales
│   ├── apple.ts         Enlace a la ficha del eBook en Apple Books
│   ├── ubicacion.ts     Estados, ciudades y ciudad más cercana
│   └── idiomas.ts       Nombres de idiomas y avisos
├── pages/
│   ├── index.astro      Portada con la ficha de búsqueda
│   ├── buscar.astro     Resultados
│   └── libro/[id].astro Detalle y dónde comprarlo
└── styles/global.css
```
