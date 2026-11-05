# Megabase V4 · Explorador IMEF Yucatán × Anáhuac Mayab

Versión V4.0. Catálogo provisional para revisión académica; **NO** es una colaboración autorizada ni una publicación aprobada por el IMEF.

## Estructura de GitHub Pages

- `index.html` — portada, explorador, agenda, método y descargas.
- `style.css` — apariencia adaptable a móvil.
- `script.js` — navegación secuencial, filtros dependientes, búsquedas, paginación y enlaces directos.
- `data/catalogo_v4.json` — proyección pública del catálogo normalizado V4.
- `data/manifest_v4.json` — conteos y versión, generados desde la misma fuente.
- `downloads/` — documentos y fichas reconstruidos desde la base V4.
- `assets/images/` — ilustraciones originales sin logos institucionales.

## Publicación (solo tras autorización)

1. Guarda una copia del repositorio actual y registra el commit de `main`.
2. Descomprime `02_PLATAFORMA_GITHUB_V4.zip`.
3. Sube **su contenido**, manteniendo `index.html`, `style.css`, `script.js`, `data`, `assets` y `downloads` en la raíz. No subas el ZIP como si GitHub fuera a extraerlo.
4. En Settings → Pages: Deploy from a branch → `main` → `/ (root)` → Save. No cambia la URL al actualizar el mismo repositorio.
5. Prueba `data/catalogo_v4.json`, un recorrido DES, uno CAU, una ficha, y un PDF.
6. Si falla, restaura el commit/ZIP anterior.

No se seleccionó un repositorio objetivo ni se efectuó despliegue. La URL que utiliza el profesor permanece sin confirmar.

## Contabilidad

- 249 PROP únicas: 36 institucionales conservadas + 189 recuperadas por reglas + 24 redactadas.
- 249 preguntas DES y 116 CAU candidatas **no habilitadas**.
- 1,157 rutas válidas (807 DES, 350 CAU). Una ruta no equivale a una propuesta adicional.
- 747 enlaces históricos con IY por coincidencia de identificadores originales; NO se asignó vínculo IY a las PROP V1.
- 0 validaciones causales, 0 autorizaciones institucionales, 0 autorizaciones de difusión.

## Fuente única y regeneración

Los archivos se generaron desde `01_MEGA_CATALOGO_PREGUNTAS_V4.xlsx`, con comparación contra `01_RELACIONES_VALIDAS_V4.csv`, preservando IDs. Los scripts de reproducción son `tools/rebuild_v4.py` y `tools/README_REBUILD.md` incluidos en el ZIP. Para cambios posteriores, modifica primero el maestro y vuelve a correr la validación; no edites registros manualmente en JS.

Consulta `POLITICA_DE_PUBLICACION.md`.
