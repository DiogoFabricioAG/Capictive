import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  // No hacemos exit aquí para no romper imports; arrojaremos error cuando se intente usar.
  // console.warn('ELEVENLABS_API_KEY no está definida.');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getLatestLocalMp3(dir) {
  try {
    const files = await fs.readdir(dir);
    const mp3s = [];
    for (const f of files) {
      if (f.toLowerCase().endsWith(".mp3")) {
        const full = path.join(dir, f);
        const st = await fs.stat(full);
        mp3s.push({ file: full, mtime: st.mtimeMs });
      }
    }
    if (mp3s.length === 0) return null;
    mp3s.sort((a, b) => b.mtime - a.mtime);
    return mp3s[0].file;
  } catch {
    return null;
  }
}

async function loadAudioAsBlob(input) {
  // Si es URL http(s), descargar; si es path local, leer.
  if (typeof input === "string" && /^https?:\/\//i.test(input)) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`No se pudo descargar el audio: ${res.status} ${res.statusText}`);
    const ab = await res.arrayBuffer();
    return new Blob([ab], { type: "audio/mpeg" });
  }

  // Resolver por defecto al último MP3 en public/eleven si no se pasa input
  let filePath = input;
  if (!filePath) {
    const defaultDir = path.resolve(__dirname, "..", "public", "eleven");
    filePath = await getLatestLocalMp3(defaultDir);
    if (!filePath) throw new Error("No se encontró ningún MP3 en /public/eleven");
  }

  const buf = await fs.readFile(filePath);
  return new Blob([buf], { type: "audio/mpeg" });
}

export async function generateTranscription(audioInput) {
  if (!API_KEY) throw new Error("ELEVENLABS_API_KEY no está configurada");
  const elevenlabs = new ElevenLabsClient({ apiKey: API_KEY });

  const audioBlob = await loadAudioAsBlob(audioInput);

  const transcription = await elevenlabs.speechToText.convert({
    file: audioBlob,
    modelId: "scribe_v1", 
    tagAudioEvents: true, 
    languageCode: "spa", 
    diarize: true, 
  });

  if (transcription?.text) {
    console.log("\n--- Transcripción ---\n" + transcription.text);
  }
  return transcription;
}

// Permite ejecutar directamente: node content/elevenlabs.js [ruta_o_url]
if (import.meta.main || process.argv[1]?.endsWith("elevenlabs.js")) {
  const arg = process.argv[2];
  generateTranscription(arg).catch((e) => {
    console.error("Error en generateTranscription:", e?.message || e);
    process.exit(1);
  });
}