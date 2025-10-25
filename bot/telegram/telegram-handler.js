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
    if (msg.text && msg.text.startsWith('/start')) return;

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
  const t = (text || '').toLowerCase();

  // Intents simples
  if (t.includes('podcast')) {
    await bot.sendMessage(chatId, '📻 Aquí tienes los últimos podcasts disponibles:\n1) Episodio 01 — Introducción\n2) Episodio 02 — Plan de Gobierno\n(esto es un placeholder; integra el CMS o feed RSS para datos reales).');
    return;
  }

  if (t.includes('video')) {
    await bot.sendMessage(chatId, '🎬 Puedes ver nuestros videos en: https://x.com/capictive (placeholder). ¿Quieres recibir el último clip? Escribe "último video".');
    return;
  }

  if (t.includes('plan') || t.includes('gobierno')) {
    await bot.sendMessage(chatId, '🗂️ Estado del Plan de Gobierno:\n- Meta A: En progreso (45%)\n- Meta B: Completada\nPara más detalles, pide "detalle meta A" o visita la web. (placeholder)');
    return;
  }

  if (t.includes('ayuda') || t.includes('help')) {
    await bot.sendMessage(chatId, 'Comandos útiles:\n- podcast\n- video\n- plan\nTambién puedes preguntar libremente y trataré de responder basándome en las fuentes disponibles.');
    return;
  }

  // Fallback: llamar a LLM/RAG (placeholder)
  const reply = await generateResponse(text, { chatId, msg });
  await bot.sendMessage(chatId, reply);
}

async function handleVoiceMessage(chatId, voice, msg) {
  try {
    // Obtener enlace al archivo de voz
    const fileId = voice.file_id;
    const fileLink = await bot.getFileLink(fileId);

    await bot.sendMessage(chatId, '🎧 He recibido tu nota de voz. La estoy procesando...');

    // En este punto se podría descargar y transcribir usando un servicio externo (ej. Whisper/OpenAI)
    // Placeholder: respondemos con el link y una nota
    await bot.sendMessage(chatId, `Enlace al archivo de voz (temporal): ${fileLink}\n(Para transcribir, integra un servicio de ASR y procesa el archivo).`);

    // Opcional: descargar y enviar a pipeline de transcripción (no implementado aquí)
  } catch (err) {
    console.error('Error en handleVoiceMessage:', err);
    await bot.sendMessage(chatId, 'Ocurrió un error procesando la nota de voz. Intenta de nuevo más tarde.');
  }
}

// Placeholder para la integración con RAG / LLM
async function generateResponse(userText, context) {
  // Aquí se debe llamar al servicio RAG/LLM.
  // Ejemplo pseudo-implementación:
  // 1) buscar en vector DB con embeddings
  // 2) pasar contexto y documentos al LLM
  // 3) devolver respuesta con referencias

  // Por ahora, devolvemos una respuesta simulada
  return `Respuesta automática: he recibido tu mensaje "${userText}". (Este es un placeholder. Integra RAG/LLM para respuestas basadas en documentos.)`;
}

// Manejo de errores globales
bot.on('polling_error', (err) => console.error('Polling error:', err));

module.exports = { bot };
