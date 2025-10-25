# Capictive — Agente Político de IA

Bienvenido a Capictive: un proyecto para construir un agente de inteligencia artificial orientado a apoyar procesos electorales (presidenciales y gubernamentales) y al mismo tiempo ofrecer seguimiento continuo del gobierno en funciones. Este README describe la visión, funcionalidades, arquitectura sugerida, consideraciones éticas y los próximos pasos recomendados.

## Tabla de contenidos

- Resumen
- Características principales
- Página web (secciones)
- Integraciones (WhatsApp, Telegram, X)
- Avatar virtual y creación de videos
- Base de datos y arquitectura RAG
- Diagramas (componentes y secuencia)
- Contrato técnico (inputs/outputs/errores)
- Casos límite
- Ética, transparencia y cumplimiento
- Stack tecnológico recomendado
- Cómo contribuir y próximos pasos

## Resumen

Capictive es un agente de IA pensado para: 1) apoyar a equipos de campaña en elecciones presidenciales y gubernamentales con información, contenido y automatización, y 2) ofrecer seguimiento público y transparente de las acciones y el cumplimiento del gobierno en periodo vigente. El proyecto combina una web pública con integraciones conversacionales, una base documental verificable y capacidades multimedia (videos y podcast).

## Características principales

- Interfaz web central (landing, contenidos y agente conversacional embebido).
- Secciones multimedia: videos y podcasts para difusión.
- Seguimiento del Plan de Gobierno con métricas y cambios en tiempo real.
- Newsletter para suscriptores.
- Base de información documental (fuentes originales verificables).
- Integraciones conversacionales para WhatsApp y Telegram (atención y consultas).
- Publicación automática en redes (X) de videos/resúmenes.
- Avatar virtual para generación de videos (API HeyGen o similar).
- Arquitectura RAG (Retrieval-Augmented Generation) para respuestas basadas en documentos.

## Página Web (detallado)

La web es el hub principal de Capictive. Se sugiere dividirla en estas secciones:

- Landing Page: resumen, qué es Capictive, sponsors, login/registro y llamada a la acción (IDEA de diseño: https://wisprflow.ai/ como inspiración).
- Apartado Videos: galería y reproductor, opción de compartir y metadatos (fecha, fuente, transcripción).
- Apartado Podcasts: episodios, notas, transcripciones y enlaces externos.
- Seguimiento del Plan de Gobierno: tablero con metas, estado, evidencias y links a documentos fuente.
- Newsletter Capictive: formulario de suscripción, gestión de listas y plantillas.
- Base de Información disponible: repositorio documental con pruebas y referencias (no publicar afirmaciones sin respaldo).
- Agente embebido (Chat): interfaz conversacional desde la web —puedes hablar con el agente aquí mismo— que usa el sistema RAG para garantizar respuestas basadas en fuentes.
- Recopilar información por web: pipeline de ingestión que use herramientas como Perplexity o scrapers controlados para obtener contextos, priorizando siempre fuentes oficiales y verificadas.

## Integración — WhatsApp

- Respuestas básicas automatizadas: conversación, peticiones de podcasts, consultas frecuentes.
- Flujos: intents simples (info campaña, episodios podcast, estado de una meta del plan de gobierno).
- Limites y seguridad: ratelimit, verificación de usuarios voluntarios y disclaimers sobre la naturaleza del agente.

## Integración — Telegram

- Todo lo de WhatsApp, más capacidades avanzadas: enviar audios, archivos, notificaciones puntuales y bots con teclados ricos.
- Uso recomendado: canal de soporte y difusión, además del bot conversacional.

## Redes Sociales — X

- Canal principal de difusión: publicar videos, clips y resúmenes.
- Automatización con revisión humana previa para evitar contenido sensible o potencialmente engañoso.

## Avatar Virtual (publicación de videos)

- Objetivo: generar clips y presentaciones con un avatar virtual que comunique mensajes y resúmenes.
- Integración sugerida: HeyGen API (https://docs.heygen.com/docs/create-video) u otras alternativas (Synthesia, D-ID) si es necesario.
- Workflow: script -> generación de audio -> render video avatar -> revisión humana -> publicación.

## Base de Datos (RAG / Documental)

- Recomendación: combinar una base relacional (SQL) para datos estructurados y metadatos + un store vectorial para embeddings (para RAG).
- Opciones vector DB: Pinecone, Milvus, Weaviate o el motor de Cloudflare R2/Workers + soluciones de vector store según presupuesto.
- Nota: usar SQL clásico (Postgres) para registros transaccionales y relaciones; almacenar documentos originales (PDF, enlaces) y metadatos que permitan auditar las fuentes.

## Diagramas

Incluye dos diagramas principales (placeholder):

- Componentes: frontend (web), backend (API), RAG service (ingest, embeddings, vector DB), LLM provider, DB SQL, worker de ingest, integraciones (WhatsApp, Telegram, X), storage multimedia, servicio de generación de video.
- Secuencia: 1) Usuario hace consulta en web/WhatsApp/Telegram -> 2) Backend valida y registra -> 3) RAG recupera documentos + embeddings -> 4) LLM genera respuesta -> 5) Respuesta devuelta y registrada; si aplica, se crea contenido multimedia y se envía a publicación.

Sugerencia de herramientas para diagramas: Mermaid (integrable en docs), draw.io, Lucidchart.

## Contrato técnico (breve)

- Inputs: texto libre del usuario; identificador de usuario; contexto de sesión; opcional: audio (Telegram/WhatsApp) o solicitud de generación de video.
- Outputs: respuesta textual; referencias (links a documentos); actas de decisión (si se publica algo); logs de auditoría.
- Error modes: no/insuficiente información (fallback con "no encontrado" y petición para aclarar), rate-limit, errores de proveedor LLM.
- Criterios de éxito: respuestas con referencias verificables > 90% en queries factuales; latencia aceptable (<1.5s para búsquedas, <4s para respuesta compuesta); trazabilidad completa de la fuente.

## Casos límite y riesgos

- Fuentes contradictorias: el sistema debe mostrar ambas fuentes y su fecha, no «inventar» respuestas.
- Contenido sensible o ilegal: bloqueo y escalado a revisión humana.
- Dependencia de proveedores LLM: plan de contingencia para cambiar de proveedor.
- Escalabilidad: diseñar el pipeline de ingest para evitar sobrecargar el vector DB.

## Ética, transparencia y cumplimiento

- Transparencia: mostrar siempre las fuentes usadas para una respuesta. No publicar afirmaciones sin respaldo documental.
- No-targeted persuasion: no usar microtargeting para influir a grupos demográficos específicos. Si el sistema es usado por campañas, mantener controles y registro de mensajes publicados.
- Disclaimers: indicar que el agente es asistente automatizado y mostrar límites de responsabilidad.
- Auditoría: mantener logs de decisiones y versiones del modelo para revisiones.

## Stack tecnológico recomendado (sugerencia)

- Frontend: React + Next.js (SSG para landing + SSR para páginas dinámicas).
- Backend: Node.js (Express / Fastify) o Python (FastAPI).
- LLM: OpenAI / Anthropic / otro proveedor con control de temperatura y traces.
- Embeddings: modelos de embeddings del proveedor o OpenAI embeddings.
- Vector DB: Pinecone / Milvus / Weaviate.
- SQL: Postgres.
- Storage multimedia: S3-compatible (Cloudflare R2, AWS S3).
- CI/CD: GitHub Actions.
- Observability: Sentry + Prometheus/Grafana para métricas.

## Cómo contribuir

1. Fork del repositorio.
2. Crear branch con la funcionalidad (feature/mi-feature).
3. Abrir PR con descripción y pruebas mínimas.
4. Etiquetar PR para revisión ética si el cambio afecta mensajes públicos.

## Próximos pasos (recomendado)

- Completar diagramas (Mermaid/draw.io) y añadir al repo en `/docs/`.
- Implementar un prototipo mínimo: chat web + RAG con 1-2 documentos y llamadas a LLM.
- Conectar integración básica con Telegram como prueba de concepto.
- Definir política de fuentes y un proceso de verificación.

## Contacto

Si quieres colaborar o necesitas ayuda implementando partes de Capictive, abre un issue o contacta al equipo mantenedor en el repositorio.

---

_Este README fue generado para capturar la visión y alcance del proyecto tal como se describió. Puedes pedirme que lo adapte, lo traduzca, o que genere plantillas para los diagramas o el prototipo de arquitectura._

