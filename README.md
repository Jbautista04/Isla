# Infraestructura propuesta para multijugador real

## Estado
El juego actual es **solo para un jugador**. Este directorio documenta una arquitectura concreta para una futura versión online. No hay salas, usuarios ni sincronización online implementados todavía; no se deben presentar como disponibles.

## Arquitectura recomendada
- **Cliente:** el juego Three.js alojado en GitHub Pages.
- **Backend:** Supabase (plan gratuito sujeto a límites y condiciones vigentes).
- **Realtime:** canales privados por sala para enviar posiciones y eventos de juego.
- **Base de datos:** tablas `profiles`, `rooms` y `room_members` definidas en `schema.sql`.
- **Autenticación:** Supabase Auth, idealmente inicio anónimo inicialmente y vinculación de cuenta opcional después.
- **Autoridad y seguridad:** el cliente no debe poder escribir directamente cualquier puntuación o premio. Para partidas competitivas, validar resultados en Edge Functions o servidor confiable. No exponer `service_role` en JavaScript del navegador.

## Pasos para habilitarlo cuando se decida
1. Crear un proyecto Supabase.
2. Ejecutar `schema.sql` en el SQL Editor.
3. Activar RLS y revisar las políticas antes de permitir usuarios públicos.
4. Crear un canal privado por partida, por ejemplo `room:<room_id>`.
5. Autenticar cada jugador y autorizar la membresía de la sala.
6. Publicar eventos de movimiento a 10–15 actualizaciones/segundo, interpolando el movimiento remoto en el cliente.
7. Validar entradas, límites del mapa, recogidas y puntuación en un backend confiable.
8. Probar desconexiones, reconexiones, spam de eventos y dos dispositivos reales.

## Mensajes de red sugeridos
`player_state`: posición x/z, rotación, estado de salto y timestamp.
`crystal_collected`: ID de prisma; validar en servidor que no haya sido reclamado previamente.
`room_state`: fase de partida, miembros y objetivo.

No enviar objetos Three.js completos por red. Serializar únicamente datos pequeños. No confiar en posiciones o puntuaciones informadas por el cliente sin validación.
