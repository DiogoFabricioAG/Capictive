# Capictive — Distribución de Trabajo por Conceptos (Workstreams)

Este documento define la división de responsabilidades del proyecto Capictive en 5 grandes conceptos de trabajo (workstreams). Cada equipo se enfocará en un área, pero mantendrá una estrecha comunicación, especialmente en las APIs que los conectan.

---

## 1. Web (Landing + App + Dashboard)

**Concepto:** `Web`

**Descripción:** Es el *hub* central y la cara pública del proyecto. Responsable de toda la experiencia de usuario basada en el navegador, desde la captación hasta la entrega de información y el seguimiento.

**Componentes Clave:**

* **Frontend y UI/UX:**
    * Diseño e implementación de la `Landing Page` (inspiración Wisprflow.ai).
    * Secciones de `Sponsors` y `Login/Registro` (si aplica).
    * Formulario de suscripción al `Newsletter`.
* **Contenido Estático y Multimedia:**
    * `Apartado Videos`: Galería, reproductor, metadatos y transcripciones.
    * `Apartado Podcasts`: Lista de episodios, reproductor, notas y transcripciones.
* **Aplicación Principal (Dashboard):**
    * Implementación del tablero de `Seguimiento del Plan de Gobierno`.
    * Visualización de metas, estado, evidencias y enlaces a fuentes.
    * `Base de Información disponible`: Interfaz para explorar el repositorio documental.
* **Interacción:**
    * Implementación del `Agente embebido (Chat)` en la web.
* **Stack Sugerido:** React, Next.js (SSG/SSR).

---

## 2. Server (Backend)

**Concepto:** `Server`

**Descripción:** Es el "cerebro" centralizado del proyecto. Provee la API principal que da servicio al `Web` y al `Bot`, gestiona la lógica de negocio, el RAG y la persistencia de datos.

**Componentes Clave:**

* **API Principal:**
    * Desarrollo de la API REST/GraphQL (Node.js/Python FastAPI).
    * Definición del `Contrato Técnico` (Inputs, Outputs, Errores).
    * Autenticación y gestión de sesiones.
* **Núcleo de IA (RAG):**
    * Orquestación del *pipeline* RAG: `consulta -> embeddings -> vector search -> LLM prompt -> respuesta`.
    * Integración con proveedores de `LLM` (OpenAI, Anthropic).
    * Manejo de `Casos Límite` (ej. "no encontrado", rate-limit).
* **Gestión de Base de Datos:**
    * Diseño y mantenimiento de la `Base de Datos SQL` (Postgres) para metadatos, usuarios, logs de auditoría y relaciones.
    * Diseño y gestión del `Vector DB` (Pinecone, Milvus, etc.) para los embeddings.
* **Stack Sugerido:** FastAPI (Python) o Node.js, Postgres, Vector DB.

---

## 3. Data (Alimentador)

**Concepto:** `Data`

**Descripción:** Es el "alimentador" del sistema. Su única responsabilidad es encontrar, verificar e "ingerir" información de alta calidad en el `Server` (SQL + Vector DB) para que el RAG pueda usarla.

**Componentes Clave:**

* **Política de Fuentes:**
    * Definición y mantenimiento de la política de fuentes verificadas (qué es una fuente oficial).
* **Pipeline de Ingestión (ETL):**
    * Desarrollo de *scrapers* controlados y uso de herramientas (ej. Perplexity API) para `Recopilar información`.
    * Proceso de `embeddings`: Convertir documentos (PDF, TXT) en vectores.
    * Carga de datos en el `Vector DB` y metadatos en `SQL`.
* **Verificación y Almacenamiento:**
    * Proceso de `Revisión Humana` de las fuentes antes de la ingesta.
    * Manejo de "fuentes contradictorias" (etiquetado y versionado).
    * Almacenamiento de documentos originales (PDFs, enlaces) en `Storage` (S3, R2).
* **Stack Sugerido:** Python (para scraping/embeddings), S3/R2, herramientas de orquestación (ej. Airflow, o scripts simples).

---

## 4. Content (Social Media)

**Concepto:** `Content`

**Descripción:** Es el "portavoz" multimedia del proyecto. Se enfoca en la creación de contenido *outbound* (hacia afuera) y la gestión de la difusión en redes sociales y correo.

**Componentes Clave:**

* **Generación Multimedia:**
    * Workflow de `Avatar Virtual`: Scripting -> Integración con `HeyGen API` (u otra) -> Generación de audio y video.
    * Creación y edición de `Podcasts`.
* **Difusión y Publicación:**
    * Publicación en `Redes Sociales (X)` de videos, clips y resúmenes.
    * Gestión del `Newsletter`: Creación de plantillas, gestión de listas y envíos.
* **Revisión:**
    * Proceso de `Revisión Humana` de todo el contenido generado (videos, tuits) antes de su publicación para control ético y de calidad.
* **Stack Sugerido:** HeyGen API, APIs de Redes Sociales (X), plataforma de Newsletter (Mailchimp, SendGrid).

---

## 5. Bot (Whatsapp + Telegram)

**Concepto:** `Bot`

**Descripción:** Gestiona todos los puntos de contacto conversacionales en plataformas de terceros (mensajería). Es un *consumidor* directo de la API del `Server`.

**Componentes Clave:**

* **Integración WhatsApp:**
    * Conexión con la API de WhatsApp Business.
    * Desarrollo de flujos simples y respuestas automatizadas.
    * Gestión de límites de la plataforma.
* **Integración Telegram:**
    * Desarrollo del bot de Telegram.
    * Implementación de capacidades avanzadas (teclados, envío de audios/archivos).
    * Uso como canal de soporte y difusión.
* **Lógica de Flujo:**
    * Manejo de `intents` simples (saludos, info, consulta de plan de gobierno).
    * Llamadas a la API del `Server` para obtener respuestas del RAG.
    * Implementación de `Disclaimers` (indicando que es un IA).
* **Stack Sugerido:** SDKs de WhatsApp/Telegram, o plataformas intermedias (ej. Twilio).