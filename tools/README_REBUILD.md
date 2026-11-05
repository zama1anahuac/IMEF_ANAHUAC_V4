# Regenerar el JSON desde Excel sin cambiar IDs

Este proceso requiere un entorno Python que disponga de `artifact_tool`. No se ejecuta automáticamente en GitHub Pages.

1. Descarga del respaldo **02_MEGABASE_IMEF_V4.xlsx** (archivo de trabajo interno) y colócalo temporalmente junto a este proyecto. **No lo subas al repositorio público**.
2. Ejecuta `python3 tools/rebuild_v4.py --master 02_MEGABASE_IMEF_V4.xlsx --site .`.
3. El programa valida claves y relaciones y reescribe `data/catalogo_v4.json`, `data/manifest_v4.json` y `downloads/02_CATALOGO_PRELIMINAR_V4.csv`.
4. Antes de publicar una versión editada, **regenera también las fichas PDF, agenda y metodología** a partir de ese mismo catálogo y comprueba que los títulos, IDs y preguntas coincidan. La V4 inicial ya los incluye regenerados, pero no los actualiza dinámicamente GitHub Pages.
5. Congela una copia de los archivos antiguos, revisa los conteos y conserva una bitácora con el ID y el motivo de cada cambio. Solicita autorización del profesor antes de subir.

La herramienta no crea investigaciones nuevas automáticamente, no habilita rutas causales ni asigna puntajes V4.
