# DAMAS RD — by Juan Tejeda

Juego web autocontenido de damas para Safari/iPhone. No usa CDN ni librerías externas, así que evita el error de carga por dependencias externas.

## Incluye
- Tablero táctil 8×8 con diseño inspirado en madera.
- CPU en tres niveles y modo local de dos jugadores.
- Captura obligatoria, capturas múltiples, coronación, deshacer y girar tablero.
- Marca “by Juan Tejeda”.
- Interfaz adaptable a móvil y opción de añadir a pantalla de inicio.

## Publicación gratuita
1. Crea un repositorio público en https://github.com/new
2. Sube `index.html` y `README.md` a la raíz del repositorio.
3. Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
4. Espera la publicación y abre el enlace en Safari.
5. Compartir → Añadir a pantalla de inicio.

## Nota sobre las reglas
Se implementa una variante de tablero 8×8 con captura obligatoria, hombres que capturan en ambas direcciones, dama de un paso y capturas encadenadas. Las reglas locales pueden variar entre grupos; valida esta variante con jugadores dominicanos antes de anunciarla como reglamento oficial.

## Multijugador online
No está implementado aún. Requiere salas reales, sincronización de movimientos, control de turnos en servidor y reconexión. El modo local permite jugar en el mismo dispositivo.
