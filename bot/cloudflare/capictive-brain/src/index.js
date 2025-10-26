export default {
  async fetch(request, env) {
    // Responde tu RAG
    // Lee el body UNA sola vez y reutiliza (evita 'ReadableStream is locked')
    const body = await request.json();
    const { query, style } = body || {};
	const result = await env.AI.autorag("capictive-brain").aiSearch({
      query: query,
      stream: false
    });
	const contexto = result.response;

	const instructions = `Eres Capictive, un asistente político con el carisma de un detective amable e inteligente. 
	Tu misión es ayudar a las personas a entender fácilmente las propuestas de los candidatos chilenos.
	Investigas, contrastas y explicas de manera clara, imparcial y cercana, como si resolvieras un misterio con datos reales.
	Evita tecnicismos y mantén un tono accesible, curioso y confiable.`
  
  let input;

  if (style == "audio") {
    input = `
      Redacta un guion de audio corto (2-3 frases) explicando el siguiente contexto. 
      El texto debe ser muy fácil de narrar en voz alta: usa frases cortas, claras y directas. 
      Mantén tu tono de detective amable. Dirígete a alguien sin conocimientos políticos.

      Contexto:
      ${contexto}`
  }
  else if (style == "detailed") {
    input = `
      Explica el siguiente contexto de forma detallada pero muy simple. 
      Desglosa los puntos clave, como un detective presentando su caso. 
      El objetivo es que alguien sin conocimientos políticos entienda el panorama completo. 
      Mantén un tono didáctico, objetivo y accesible.

      Contexto:
      ${contexto}`
  }
  else if (style == "podcast"){
    input = `
      Escribe un guion para un podcast de 1 a 2 minutos explicando el contexto. 
      Estructura: introducción breve con un gancho, desarrollo claro con 3 a 5 ideas clave y cierre con invitación a reflexionar. 
      El tono debe ser cercano y amigable, como si le contaras a un amigo el "misterio" detrás de esta propuesta. 
      Usa lenguaje conversacional, 100% libre de tecnicismos, y oraciones que se puedan narrar con naturalidad. Pero solo escribe el guion, en texto plano, nada de anotaciones sobre qué
      cosa va dentro, (como inicio (1s - 3s)).
      Contexto:
      ${contexto}`
  }
  else if (style == "video"){
    input = `
      Genera un PROMPT listo para pegar en un modelo de generación de video (p. ej., Veo 3), en español, que cree un video horizontal tipo landscape usando imágenes estilo stock (B‑roll genérico). Debe basarse en el "contexto" y cumplir las siguientes reglas y formato de salida.

      Objetivo:
      - Comunicar de forma clara y atractiva 2–3 ideas clave del contexto político chileno.
      - Estilo: informativo, ágil y visual. Tono Capictive: claro, directo, cercano.

      Reglas duras (obligatorias):
      - Aspect ratio: 16:9 (1920x1080). Orientación: SOLO landscape.
      - Duración objetivo: 18–25 segundos.
      - Imágenes: vibe de stock/B‑roll genérico (calles, edificios gubernamentales, documentos, manos escribiendo, planos de ciudad, personas anónimas, paisajes de Chile), sin logos ni marcas.
      - Evita rostros de personas reales o la semejanza directa de políticos; usa planos genéricos/abstractos.
      - Nada de marcas de agua, logos de partidos, ni material con copyright.

      Entregables (formato de salida):
      1) CorePrompt: un párrafo corto y potente (2–4 líneas) que describa la escena global, estilo visual, atmósfera y tema.
      2) Settings: lista con parámetros clave: aspect_ratio=16:9, duration_seconds=20, fps=24, style="documental moderno", color="natural cálido", lighting="luz diurna suave", motion="cámara en mano suave y paneos lentos".
      3) ShotList: 6–8 tomas numeradas con tiempo aprox. por toma (2–4s c/u), indicando sujeto/acción, tipo de plano (ej. dron, paneo, macro, close‑up, tilt), entorno, y overlays de texto.
      4) Overlays: 2–3 textos en pantalla (en español), concisos y legibles (máx. 6–8 palabras), con ubicación sugerida (superior/centro/inferior) y estilo (semi‑bold, fondo sutil, sin logos).
      5) NegativePrompt: lista de exclusiones (logos, marcas de agua, caras reconocibles, símbolos partidarios, violencia, gore, texto ilegible).

      Guías creativas:
      - Usa transiciones simples (fade/paneos). Ritmo dinámico pero sobrio.
      - Introduce un "gancho" visual en el primer plano (ej. titular sobre fondo urbano) y cierra con una toma de síntesis (ej. documentos y manos subrayando puntos clave).
      - Si corresponde, sugiere texturas (papel, vidrio, metal) y elementos de apoyo (gráficos abstractos, mapas, banderas estilizadas sin escudos/escudos simplificados).

      Contexto base para el contenido:
      ${contexto}

      Salida esperada (ejemplo de estructura):
      CorePrompt: [párrafo]
      Settings:
        - aspect_ratio: 16:9
        - duration_seconds: 20
        - fps: 24
        - style: documental moderno
        - color: natural cálido
        - lighting: luz diurna suave
        - motion: cámara en mano suave, paneos lentos
      ShotList:
        1) [2.5s] Plano general de ciudad (amanecer); paneo lento; overlay: "[texto 1]".
        2) [3s] Close‑up de documentos oficiales siendo subrayados; luz lateral; overlay: "[texto 2]".
        3) [3s] Manos tecleando en laptop (estadísticas); tilt suave; …
        4) [3s] …
        5) [3s] …
        6) [3s] …
      Overlays:
        - "[texto 1]" (superior, semi‑bold, fondo sutil)
        - "[texto 2]" (centro, semi‑bold, fondo sutil)
        - "[texto 3]" (inferior, semi‑bold, fondo sutil)
      NegativePrompt:
        - logos, marcas de agua, caras reconocibles, símbolos partidarios, violencia, gore, texto borroso o ilegible
      `
  }
  else if (style == "social-audio" || style == "social_audio" || style == "socialaudio"){
    input = `
      Genera contenido para redes sociales en español (Chile) con la siguiente estructura estricta y en texto plano (sin markdown ni emojis):
      1) Cuatro campos de una sola línea cada uno:
         TituloCorto: [máx. 60 caracteres con gancho]
         MensajeClave: [2–3 frases, claro y conciso, una sola línea]
         CTA: [llamado a la acción neutro]
         Notas: [fuentes o aclaraciones breves, opcional]
      2) PodcastScript: un guion de 1–2 minutos, con introducción (gancho), desarrollo (3–5 ideas clave) y cierre reflexivo, sin tecnicismos, escrito para narración en voz alta.

      Prohibido: logos, consignas partidarias, sesgos, ataques personales.

      Contexto:
      ${contexto}

      Salida esperada (etiquetas exactas, cada bloque en su propia línea, sin comillas):
      TituloCorto: …
      MensajeClave: …
      CTA: …
      Notas: …
      PodcastScript: …
      `
  }
  else if (style == "social" || style == "social_post" || style == "pitch" || style == "publicacion"){
    input = `
      Genera un pitch de publicación para redes sociales, en español (Chile), que acompañe un contenido multimedia basado en el "Contexto". Mantén el tono Capictive: claro, directo, imparcial y cercano. Evita tecnicismos y cualquier sesgo partidista.

      Objetivo:
      - Presentarte como Capictive, un detective amable que ayuda a entender propuestas políticas. Arranca con un "Abriendo Expediente" o similar.
      - Explicar 1–3 ideas clave del contexto de forma accesible y atractiva.
      - Motivar a informarse sin polarizar ni atacar personas o grupos.

      Reglas duras:
      - Lenguaje simple y amable; sin afirmaciones no verificadas.
      - Evitar emojis excesivos (usa solo si aportan claridad).
      - No incluir logos, lemas ni consignas partidarias.
      - Salida en texto plano, sin markdown ni emojis en los cuatro campos principales.
      - Cada campo principal debe ir en UNA sola línea (sin saltos internos) y sin comillas.

      Entrega la salida exactamente con esta estructura (una línea por campo):
      TituloCorto: [máx. 60 caracteres con gancho]
      MensajeClave: [2–3 frases, claro y conciso, en una sola línea]
      CTA: [llamado a la acción neutro, ej. "Infórmate con fuentes confiables" o "Lee el detalle en Capictive"]
      Notas: [si aplica, menciona brevemente fuentes o aclaraciones]

      Contexto:
    ${contexto}`
  }
  else { 
    input = `
      Resume en 2-3 frases lo esencial del siguiente contexto para un ciudadano sin conocimientos políticos. 
      Sé claro, objetivo y mantén tu tono de detective amable.

      Contexto:
      ${contexto}`
  }


  const llmResult = await env.AI.run("@cf/openai/gpt-oss-20b", {
        input: input,
        instructions: instructions
    });

    
    const assistantMessage = llmResult.output.find(item =>
        item.type === 'message' && item.role === 'assistant'
    );

    const outputText = assistantMessage.content.find(c =>
        c.type === 'output_text'
    );
    
    const finalResponse = outputText.text;

    // Helper: pequeña utilidad para generar una clave segura en R2
    const slug = (s) => (s || "").toString()
      .toLowerCase()
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036f]/g, "")
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/(^-|-$)/g, "")
      .slice(0, 48);

    async function generateAudioAndUpload(text) {
      const apiKey = env.ELEVENLABS_API_KEY;
      if (!apiKey) throw new Error("Falta ELEVENLABS_API_KEY en variables del Worker");

      // Elige la voz: param -> env -> fallback
      const voiceId =  env.ELEVENLABS_VOICE_ID || "YKUjKbMlejgvkOZlnnvt"; // default ejemplo

      const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
      const ttsRes = await fetch(ttsUrl, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId: "YKUjKbMlejgvkOZlnnvt"
        }),
      });
      if (!ttsRes.ok) {
        const txt = await ttsRes.text().catch(() => "");
        throw new Error(`ElevenLabs TTS fallo: ${ttsRes.status} ${ttsRes.statusText} ${txt}`);
      }
      const audioBuf = await ttsRes.arrayBuffer();

    // Subir a R2
    const bucket = env.MEDIA_R2;
    if (!bucket?.put) { throw new Error("No hay binding de R2 (MEDIA_R2 / MEDIA_BUCKET / R2_BUCKET / R2)"); }

      const basePrefix = env.R2_PREFIX || "Audios";
      const fileName = `${Date.now()}-${slug(text)}.mp3`;
      const objectKey = `${basePrefix}/${fileName}`;

      await bucket.put(objectKey, audioBuf, {
        httpMetadata: { contentType: "audio/mpeg" },
        customMetadata: { source: "capictive-brain", style: style || "default" },
      });


      const publicBase = env.R2_PUBLIC_BASE_URL; 
      const publicUrl = publicBase ? `${publicBase}/${objectKey}` : null;
      return { key: objectKey, url: publicUrl };
    }

    // Caso especial: social-audio devuelve SOLO el audio de podcast
    if (style === "social-audio" || style === "social_audio" || style === "socialaudio") {
      try {
        const podcastMatch = finalResponse.match(/\bPodcastScript:\s*([\s\S]*?)(?=\n[A-Z][A-Za-z]+:|$)/);
        let podcastScript = podcastMatch?.[1]?.trim() || '';

        if (!podcastScript) {
          const msgMatch = finalResponse.match(/\bMensajeClave:\s*(.*?)(?=\n|$)/);
          podcastScript = msgMatch?.[1]?.trim() || finalResponse.slice(0, 800).trim();
        }

        const audio = await generateAudioAndUpload(podcastScript);

        return Response.json({
          response: finalResponse,
          audio,
          type: "audio",
        });
      } catch (err) {
        return Response.json({
          response: finalResponse,
          audio: null,
          error: "tts_failed",
          message: err?.message || String(err),
        });
      }
    }

    if (style === "audio" || style === "podcast") {
      try {
        const audio = await generateAudioAndUpload(finalResponse);
        return Response.json({
          response: finalResponse,
          audio,
          type: "audio",
        });
      } catch (err) {
        return Response.json({
          response: finalResponse,
          audio: null,
          error: "tts_failed",
          message: err?.message || String(err),
        });
      }
    }

    return Response.json({ response: finalResponse });
  },
};
