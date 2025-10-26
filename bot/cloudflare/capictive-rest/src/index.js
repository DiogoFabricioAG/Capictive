/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // GET /api/files/gubernamental
    if (url.pathname === "/api/files/gubernamental" && method === "GET") {
      // Listar files con el prefijo "Gubernamental/"
      const files = await env.MY_BUCKET.list({ prefix: "Gubernamental/" });
      const result = files.objects.map(obj => ({
        name: obj.key.replace("Gubernamental/", ""), // nombre del archivo sin el prefijo
        full_path: obj.key,                          // ruta completa (útil para construir links)
        size: obj.size,
        uploaded: obj.uploaded,
        etag: obj.etag,
        url: `https://pub-49cd1343e949457b9bf25aafe7bcba66.r2.dev/Gubernamental/${obj.key}`
      }));
      return Response.json(result);
    }

    // 404 por default
    return new Response("Not found", { status: 404 });
  }
};
