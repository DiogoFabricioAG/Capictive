/**
 * formatResponse
 * Toma la respuesta del Capictive Brain (string o JSON) y la convierte a texto plano "bonito"
 * - Convierte instancias de "\\n" en saltos de línea reales
 * - Reemplaza <br> y <br/> por saltos de línea
 * - Convierte tablas en formato | col | val | a líneas "col: val"
 * - Convierte patrones como (1) en "1." para listas
 * - Convierte **bold** a *bold* (simple) y elimina etiquetas HTML restantes
 */

function stripHtmlTags(s) {
  return s.replace(/<[^>]*>/g, '');
}

function parseTableLines(text) {
  // Convierte líneas tipo | a | en "Header: Value"
  const lines = text.split('\n');
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.includes('|')) {
      // separar por | y coger columnas no vacías
      const cols = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 2) {
        // si parecen encabezados de tabla con --- ignorar
        if (cols[0].startsWith('-') || cols.join('').startsWith('---')) continue;
        out.push(`${cols[0]}: ${cols.slice(1).join(' | ')}`);
        continue;
      }
    }
    out.push(line);
  }
  return out.join('\n');
}

function formatBrainResponse(raw) {
  let text = '';

  if (!raw && raw !== '') return '';

  // Si raw es un objeto, intentar extraer campo response
  if (typeof raw === 'object') {
    if (raw.response) text = String(raw.response);
    else text = JSON.stringify(raw, null, 2);
  } else if (typeof raw === 'string') {
    // Si es string y parece JSON, intentar parsear
    const s = raw.trim();
    if ((s.startsWith('{') || s.startsWith('[')) && s.includes('response')) {
      try {
        const parsed = JSON.parse(s);
        if (parsed && parsed.response) text = String(parsed.response);
        else text = s;
      } catch (err) {
        text = s;
      }
    } else {
      text = s;
    }
  } else {
    text = String(raw);
  }

  // Reemplazar <br> por salto de linea y secuencias \n por newline
  text = text.replace(/<br\s*\/?>/gi, '\n');
  // Convertir etiquetas <b> o <strong> a **bold** para que sean detectadas
  text = text.replace(/<\s*(b|strong)\s*>([\s\S]*?)<\s*\/\s*\1\s*>/gi, '**$2**');
  // Convertir <i> o <em> a *italic*
  text = text.replace(/<\s*(i|em)\s*>([\s\S]*?)<\s*\/\s*\1\s*>/gi, '*$2*');
  text = text.replace(/\\n/g, '\n');

  // Convertir tablas con | a formato "Header: Value"
  text = parseTableLines(text);

  // Convertir (1) a "1." y similares
  text = text.replace(/\(\s*(\d+)\s*\)/g, '$1.');

  // Mantener **bold** y *italic* como marcadores para procesarlo más tarde si queremos
  // (no los transformamos todavía para evitar problemas de escape en MarkdownV2)

  // Eliminar cualquier tag HTML restante
  text = stripHtmlTags(text);

  // Normalizar saltos de linea múltiples
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim
  text = text.trim();

  // Eliminar tokens residuales como <<<BOLD_TOKEN_0>>> o similares
  text = text.replaceAll(/<{3}BOLD_TOKEN_[0-9A-Za-z]+>{3}/g, '');
  text = text.replaceAll(/<{3}.*?_TOKEN_[0-9A-Za-z]+>{3}/g, '');

  // Eliminar asteriscos sobrantes usados para énfasis: *texto* o **texto** -> texto
  text = text.replaceAll(/\*\*(.*?)\*\*/g, '$1');
  text = text.replaceAll(/\*(.*?)\*/g, '$1');

  return text;
}

// Escapa texto para MarkdownV2 de Telegram, preservando marcadores **bold**.
function escapeForTelegramMarkdownV2(s) {
  if (!s) return '';
  // Reemplazamos temporalmente **...** y *...* por tokens para no escapar los asteriscos usados como marcado
  const tokenPrefix = 'BOLDTOKEN';
  let tokenIdx = 0;
  const tokens = [];
  // detectar **bold** y *italic* (no-greedy, incluye saltos de linea)
  const withTokens = s.replaceAll(/(\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*)/g, (match, _grp, g2, g3) => {
    const inner = g2 || g3 || '';
    const token = `${tokenPrefix}${tokenIdx}XYZ`;
    tokens.push(inner);
    tokenIdx += 1;
    return token;
  });

  // Caracteres que deben ser escapados en MarkdownV2 (no incluimos '*' porque lo usamos para marcado)
  const toEscape = ['_', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  let escaped = withTokens;
  for (const ch of toEscape) {
    const esc = `\\${ch}`;
    escaped = escaped.split(ch).join(esc);
  }

  // Restaurar tokens como *🔹text* (agregamos emoji para resaltar)
  let restored = escaped;
  // caracteres a escapar dentro del contenido que irá entre asteriscos
  const innerEscapeChars = ['_', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!', '*'];
  for (let i = 0; i < tokens.length; i++) {
    const token = `${tokenPrefix}${i}XYZ`;
    let inner = tokens[i] || '';
    // escapar caracteres en el contenido interior para MarkdownV2
    for (const ch of innerEscapeChars) {
      const esc = `\\${ch}`;
      inner = inner.split(ch).join(esc);
    }
    // insertamos con asteriscos para MarkdownV2 y un emoji prefijo
    restored = restored.replace(token, `*🔹${inner}*`);
  }

  return restored;
}

function formatBrainResponseMarkdownV2(raw) {
  const plain = formatBrainResponse(raw);
  return escapeForTelegramMarkdownV2(plain);
}

module.exports = { formatBrainResponse, formatBrainResponseMarkdownV2 };
