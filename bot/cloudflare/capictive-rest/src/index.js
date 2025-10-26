export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    
    // Objeto de Headers para CORS (como lo tenías antes)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-File-Name",
    };

    if (method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }

    // --- FIN DE LA SOLUCIÓN CORS ---


    // --- RUTA GET (Listar archivos) ---
    if (path === "/api/files/gubernamental" && method === "GET") {
      const prefix = "Gubernamental/";
      const files = await env.MY_BUCKET.list({ prefix: prefix });

      const result = files.objects.map(obj => {
        const name = obj.key.replace(prefix, "");
        const publicUrl = `https://pub-49cd1343e949457b9bf25aafe7bcba66.r2.dev/${encodeURIComponent(obj.key)}`;
        return { name, full_path: obj.key, size: obj.size, uploaded: obj.uploaded, etag: obj.etag, url: publicUrl };
      });

      // 3. Añade los headers a tu respuesta JSON
      return Response.json(result, {
        headers: corsHeaders
      });
    }

    // --- RUTA POST (Subir archivos) ---
    if (path === "/api/files/upload" && method === "POST") {
      const fileKey = request.headers.get("X-File-Name");
      if (!fileKey) {
        return new Response("Se requiere el header 'X-File-Name'", {
          status: 400,
          headers: corsHeaders // 3. Añade headers también a los errores
        });
      }

      const httpMetadata = { contentType: request.headers.get("Content-Type") || 'application/octet-stream' };

      try {
        const object = await env.MY_BUCKET.put(fileKey, request.body, { httpMetadata });

        ctx.waitUntil(triggerAISync(env));

        const responseData = {
          message: "Archivo subido con éxito",
          key: object.key,
          etag: object.etag,
          size: object.size,
          url: `https://pub-49cd1343e949457b9bf25aafe7bcba66.r2.dev/${encodeURIComponent(object.key)}`
        };
        
        // 3. Añade los headers a tu respuesta JSON
        return Response.json(responseData, {
          headers: corsHeaders
        });

      } catch (e) {
        return new Response(`Error al subir el archivo: ${e.message}`, {
          status: 500,
          headers: corsHeaders // 3. Añade headers también a los errores
        });
      }
    }

    return new Response("Not found", {
      status: 404,
      headers: corsHeaders 
    });
  }
};


async function triggerAISync(env) {
  
  // ¡Reemplaza esto con tu Account ID!
  const ACCOUNT_ID = "425570893cf14d98277348565ec23eae"; 
  
  // El nombre de tu índice (según tu captura de pantalla)
  const INDEX_NAME = "ai-search-capictive-brain"; 
  
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/vectorize/indexes/${INDEX_NAME}/jobs/process`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        // Usamos el secreto que guardaste en el Paso 2
        'Authorization': `Bearer ${env.CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // El body puede ir vacío
    });

    if (response.ok) {
      console.log("Éxito: Se inició el trabajo de sincronización de AI Search.");
    } else {
      const errorText = await response.text();
      console.error(`Error al iniciar el sync: ${response.status} ${errorText}`);
    }
  } catch (e) {
    console.error(`Excepción al llamar a la API de Sync: ${e.message}`);
  }
}