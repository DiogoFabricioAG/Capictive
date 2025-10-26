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
      Usa lenguaje conversacional, 100% libre de tecnicismos, y oraciones que se puedan narrar con naturalidad.

      Contexto:
      ${contexto}`
  }
  else if (style == "video"){
    input = `
      Escribe un guion para un video corto y dinámico (tipo Reel/TikTok). 
      El texto debe tener un "gancho" al inicio, ser súper directo y usar lenguaje que "pinte una imagen" (ej. analogías). 
      ¡Que sea entretenido y se entienda en 15 segundos! Tono de Capictive: ¡claro y al punto!

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
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
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
      if (!bucket || !bucket.put) throw new Error("No hay binding de R2 (MEDIA_R2 / MEDIA_BUCKET / R2_BUCKET / R2)");

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
