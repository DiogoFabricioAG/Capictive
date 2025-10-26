/**
 * Telegram handler para Capictive
 * - Usa node-telegram-bot-api en modo polling (fácil de probar)
 * - Lee el token desde process.env.TELEGRAM_BOT_TOKEN (ver .env.example)
 * - Implementa respuestas básicas: podcasts, videos, plan de gobierno, ayuda
 * - Manejo básico de audio/voice: descarga enlace del archivo y responde
 * - Placeholder `generateResponse` para integrar RAG/LLM
 *
 * NOTA DE SEGURIDAD: No comites tokens al repo. Usa variables de entorno.
 */

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const fetch = require('node-fetch');
const { formatBrainResponse, formatBrainResponseMarkdownV2 } = require('../utils/formatResponse');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8285082617:AAGZX6-8sVz6UyLXo2V8aWwjQXGkBYkBoIw';

if (!TOKEN) {
  console.error('Falta TELEGRAM_BOT_TOKEN en las variables de entorno.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('Telegram handler iniciado. Escuchando mensajes...');

// Mensaje de bienvenida / comandos básicos
bot.onText(/\/start|hola|hi/i, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from && (msg.from.first_name || msg.from.username) ? (msg.from.first_name || msg.from.username) : 'amigo';
  const welcome = `Hola ${name}! 👋 Soy el bot de Capictive. Puedo:
- Responder preguntas generales
- Enviar links a podcasts y videos
- Informar sobre el seguimiento del Plan de Gobierno
Escribe "podcast", "video" o "plan" para probar.`;
  bot.sendMessage(chatId, welcome);
});

// Manejo general de mensajes
bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;

    // Ignorar mensajes que son solo el comando /start (ya manejado)
    if (msg.text?.startsWith('/start')) return;

    if (msg.text) {
      await handleTextMessage(chatId, msg.text, msg);
      return;
    }

    // Voice notes
    if (msg.voice) {
      await handleVoiceMessage(chatId, msg.voice, msg);
      return;
    }

    // Audio file (mp3, ogg, etc.)
    if (msg.audio || msg.document) {
      await bot.sendMessage(chatId, 'He recibido tu archivo. Gracias — lo pondré en la cola de procesamiento.');
      return;
    }

    // Otros tipos
    await bot.sendMessage(chatId, 'Tipo de mensaje no soportado aún. Envía texto o una nota de voz.');
  } catch (err) {
    console.error('Error manejando mensaje:', err);
  }
});

async function handleTextMessage(chatId, text, msg) {
  // Enviamos continuamente la acción de escritura mientras esperamos la respuesta del brain.
  let typingInterval = null;
  try {
    // un primer intento inmediato
    try {
      await bot.sendChatAction(chatId, 'typing');
    } catch (err) {
      console.debug('sendChatAction no soportado o falló en primer intento:', err?.message);
    }

    // Mantener el 'typing' cada 4 segundos para que el usuario vea que está respondiendo
    typingInterval = setInterval(() => {
      bot.sendChatAction(chatId, 'typing').catch((err) => {
        // no hacemos mucho aquí, solo logueamos
        console.debug('sendChatAction interval failed:', err?.message);
      });
    }, 4000);

    // Si el usuario pidió audio o podcast, solicitamos estilo correspondiente al brain y retornamos
    const wantsAudio = /\baudio\b/i.test(text || '');
    const wantsPodcast = /\bpodcast\b/i.test(text || '');
    if (wantsAudio || wantsPodcast) {
      const style = wantsPodcast ? 'podcast' : 'audio';
      const rawAudioReply = await generateResponse(text, { chatId, msg, style });
      const parsedAudio = safeParseJson(rawAudioReply);
      const replyAudioText = formatBrainResponse(parsedAudio || rawAudioReply);

      // Limpiar indicador de typing antes de subir audio
      if (typingInterval) clearInterval(typingInterval);

      // Si hay URL pública, enviamos el audio
      const audioUrl = parsedAudio?.audio?.url || parsedAudio?.audio?.publicUrl || parsedAudio?.audioUrl;
      if (audioUrl) {
        try {
          await bot.sendChatAction(chatId, 'upload_audio');
        } catch {}
        await bot.sendAudio(chatId, audioUrl, { caption: replyAudioText });
        return;
      }

      // Fallback a texto si no llegó URL
      await bot.sendMessage(chatId, replyAudioText);
      return;
    }

    // Caso texto normal
    const rawReply = await generateResponse(text, { chatId, msg });
    const reply = formatBrainResponse(rawReply);

    // Limpiar indicador de typing
    if (typingInterval) clearInterval(typingInterval);

    // Enviar la respuesta formateada en texto plano (sin parse_mode)
    await bot.sendMessage(chatId, reply);
    return;
  } catch (err) {
    if (typingInterval) clearInterval(typingInterval);
    console.error('Error en handleTextMessage:', err);
    await bot.sendMessage(chatId, '❌ Ocurrió un error procesando tu mensaje. Intenta de nuevo más tarde.');
    return;
  }
}

async function handleVoiceMessage(chatId, voice, msg) {
  try {
    // Obtener enlace al archivo de voz
    const fileId = voice.file_id;
    const fileLink = await bot.getFileLink(fileId);

    await bot.sendMessage(chatId, '🎧 He recibido tu nota de voz. La estoy procesando...');

    // Placeholder: respondemos con el link y una nota
    await bot.sendMessage(chatId, `Enlace al archivo de voz (temporal): ${fileLink}\n(Para transcribir, integra un servicio de ASR y procesa el archivo).`);

    // Opcional: descargar y enviar a pipeline de transcripción (no implementado aquí)
  } catch (err) {
    console.error('Error en handleVoiceMessage:', err);
    await bot.sendMessage(chatId, 'Ocurrió un error procesando la nota de voz. Intenta de nuevo más tarde.');
  }
}

function safeParseJson(maybeJson) {
  if (typeof maybeJson !== 'string') return maybeJson;
  const s = maybeJson.trim();
  if (!s) return s;
  if (s.startsWith('{') || s.startsWith('[')) {
    try { return JSON.parse(s); } catch { return maybeJson; }
  }
  return maybeJson;
}

async function generateResponse(userText, context) {
  const endpoint = process.env.CAPITIVE_BRAIN_URL || 'https://capictive-brain.diogofabricio17.workers.dev';
  // Nota: removido timeout para permitir operaciones largas (p. ej., generación de audio)

  const payload = { query: userText };
  if (context?.style) payload.style = context.style;

  try {
    const fetchPromise = fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Sin timeout: dejamos que el brain responda cuando esté listo (útil para generación de audio)
    const res = await fetchPromise;

    if (!res?.ok) {
      let bodyText = '';
      try {
        bodyText = await (res?.text?.() ?? '');
      } catch (err) {
        console.debug('Error leyendo cuerpo de respuesta errónea:', err?.message);
      }
      const statusPart = res ? `${res.status} ${res.statusText}` : 'sin respuesta';
      return `⚠️ Error consultando Capictive Brain: ${statusPart}. ${bodyText}`;
    }

    // Intentar parsear como JSON; si no, devolver texto
    const contentType = res.headers?.get?.('content-type') || '';
    if (contentType.includes('application/json')) {
      try { return await res.json(); } catch {}
    }
    const text = await res.text();
    return text && text.length > 0 ? text : 'Capictive Brain devolvió una respuesta vacía.';
  } catch (err) {
    console.error('generateResponse error:', err);
    return '❌ Error interno al consultar Capictive Brain. Intenta de nuevo más tarde.';
  }
}

// Manejo de errores globales
bot.on('polling_error', (err) => console.error('Polling error:', err));

module.exports = { bot };
