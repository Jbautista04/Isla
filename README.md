# Damas RD — El tablero se respeta

Juego web de damas para iPhone/Safari, con diseño móvil, tablero interactivo y partidas sin cuenta.

## Funciones
- Tablero 8×8 y fichas con estilo visual inspirado en madera.
- Modo individual contra CPU (tranquila, competitiva y difícil).
- Modo local para dos jugadores en el mismo teléfono.
- Capturas obligatorias, encadenamiento de capturas, coronación, deshacer y girar el tablero.
- Interfaz adaptable a iPhone y opción de añadir a pantalla de inicio.
- Sin dependencias externas ni backend para jugar localmente.

## Publicación gratuita
1. Crea un repositorio público en https://github.com/new
2. Sube `index.html` y `README.md` a la raíz.
3. Abre Settings → Pages.
4. Selecciona Deploy from a branch, rama `main`, carpeta `/ (root)` y guarda.
5. Abre la URL publicada en Safari y pulsa Compartir → Añadir a pantalla de inicio.

## Importante sobre las reglas
Esta versión implementa reglas de damas de tablero 8×8 con movimientos diagonales, captura obligatoria y coronación. Las reglas de torneos dominicanos pueden variar según la variante regional; antes de promoverla como reglamento oficial, validar la variante exacta que se quiere representar.

## Online futuro
El modo por Internet no está implementado. Para competir entre teléfonos hacen falta salas y sincronización real (por ejemplo, Supabase Realtime o WebSocket), validación de jugadas en servidor y manejo de desconexiones. No se simula como función existente.
