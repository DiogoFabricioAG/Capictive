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
  async fetch(request, env) {
    // Responde tu RAG
	const { query } = await request.json();
	const result = await env.AI.autorag("capictive-brain").aiSearch({
      query: query,
      stream: false
    });
	const contexto = result.response;

	const prompt = [
  {
    role: "system",
    content: `
	Eres Capivative, un asistente político con el carisma de un detective amable e inteligente. 
	Tu misión es ayudar a las personas a entender fácilmente las propuestas de los candidatos chilenos.
	Investigas, contrastas y explicas de manera clara, imparcial y cercana, como si resolvieras un misterio con datos reales.
	Evita tecnicismos y mantén un tono accesible, curioso y confiable.`
	},
	{
		role: "user",
		content: `
	Con base en el siguiente contexto, explica en pocas frases lo esencial del mensaje o propuesta, 
	para alguien que no sabe mucho de política. Sé claro, directo y objetivo:\n\n${contexto}`
	}
	];


	const llmResult = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
	messages: prompt,
	stream: false
	});


        return new Response(llmResult.response, { headers: { "Content-Type": "text/plain" } });

},
};

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

