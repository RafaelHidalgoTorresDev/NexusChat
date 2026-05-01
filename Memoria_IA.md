# Memoria de Desarrollo y Uso de IAs - Proyecto NexusChat

## 1. Metodología y Herramientas Utilizadas

El desarrollo de este proyecto se ha basado en un modelo de **Pair Programming asistido por IA**, utilizando principalmente el agente **Gemini (Antigravity)**. El objetivo principal ha sido elevar la calidad técnica y visual del proyecto final, superando las limitaciones de las interfaces tradicionales.

### Fuentes de consulta:
- **Documentación oficial de Spring Boot**: Configuración de `WebSocketMessageBrokerConfigurer`.
- **MDN Web Docs**: Implementación de la API de `WebRTC` (RTCPeerConnection).
- **StackOverflow & Documentación de React**: Gestión de estados complejos y persistencia en `localStorage`.

---

## 2. Histórico del Proyecto y Evolución

El proyecto no nació como una aplicación web. Su evolución ha pasado por varias fases críticas:

1.  **Fase Inicial (Descartada)**: Se comenzó prototipando una aplicación en **Java Swing**. Rápidamente se identificó que la gestión de hilos (`Threads`) para evitar el bloqueo de la interfaz al recibir mensajes por Sockets TCP puros era extremadamente propensa a errores. Además, la estética resultaba anticuada para las ambiciones del equipo.
2.  **Pivote a Arquitectura Web**: Se decidió migrar a un stack **MERN-like** (Spring Boot + React). Esto permitió centrarse en la lógica de negocio y en la experiencia de usuario.
3.  **Implementación de WebSockets**: Se configuró el broker STOMP para permitir la mensajería instantánea. Esta fase fue la más fluida gracias a la integración nativa de Spring con el estándar.
4.  **Añadido de Multimedia**: Se integró la carga de imágenes, GIFs y finalmente videollamadas mediante WebRTC.

---

## 3. Dificultades Encontradas y Soluciones

Durante el desarrollo surgieron varios obstáculos técnicos que requirieron investigación profunda:

-   **Políticas de CORS**: La conexión entre el puerto del frontend (5173) y el del backend (8080) era bloqueada inicialmente por el navegador. Se solucionó configurando un filtro CORS específico en la configuración de WebSockets del servidor.
-   **Señalización WebRTC "Ruidosa"**: Un problema común fue que los mensajes técnicos de la videollamada (ofertas SDP y candidatos ICE) aparecían como texto JSON en las burbujas de chat. Se resolvió implementando un filtro de tipos de mensaje en el cliente para procesar la señalización en segundo plano sin mostrarla en la UI.
-   **Layout Shifts con Modales**: Al abrir imágenes ampliadas o el panel de ajustes, el diseño de la aplicación se desplazaba o se "rompía". Esto se debió a una falta de estilos para los elementos fuera del flujo (`fixed positioning`). Se corrigió creando un sistema global de capas (`modal-overlay`) con desenfoque de fondo.
-   **Persistencia de Cuentas**: Para mejorar la UX, se implementó un sistema de selección de cuentas previas guardadas en el navegador, evitando tener que escribir el nombre de usuario en cada sesión de pruebas.

---

## 4. Reflexión sobre el uso de IAs

El uso de la IA ha sido fundamental para acelerar la creación del "boilerplate" inicial y para la resolución de bugs visuales específicos. No obstante, el criterio humano ha sido clave para:
1.  **Filtrar el ruido**: Decidir qué mensajes deben ir al chat y cuáles son técnicos.
2.  **Ajuste estético**: El diseño final de *Glassmorphism* y las paletas de colores fueron ajustados manualmente para lograr el acabado deseado.
3.  **Arquitectura**: La decisión de usar WebRTC para las llamadas en lugar de saturar el servidor con flujos de datos binarios fue una decisión de diseño arquitectónico tomada para garantizar la eficiencia.
