import Anthropic from '@anthropic-ai/sdk';

// Opt-out of caching for this route
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('--- API CHAT INVOKED ---');
  console.log('Key defined:', !!apiKey);
  if (apiKey) console.log('Key starts with:', apiKey.substring(0, 10));

  const anthropic = new Anthropic({
    apiKey: apiKey || '',
  });

  try {
    const { messages, context } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'Falta ANTHROPIC_API_KEY en .env.local' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Construir el prompt del sistema con el contexto del canvas
    const systemPrompt = `Eres Eustoquia, una IA asistente experta en producción de contenido para "@vendecomopro".
Tu objetivo es ayudar a Omar y Gaby a transformar ideas y grabaciones en contenido de alto impacto.

CONTEXTO DEL CANVAS ACTUAL:
${context || 'No hay contexto adicional conectado.'}

Instrucciones:
- Sé conciso y directo.
- Usa un tono profesional pero cercano (estilo @vendecomopro).
- Si hay clips o transcripciones en el contexto, úsalos para generar captions, hooks o ideas.
`;

    // Usar el SDK de Anthropic para streaming
    const stream = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content || m.text, // Manejar ambos formatos
      })),
      stream: true,
    });

    // Crear un ReadableStream para el cliente
    const responseStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(chunk.delta.text);
          }
        }
        controller.close();
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('--- CLAUDE API FATAL ERROR ---');
    console.error('Message:', error.message);
    console.error('Status:', error.status);
    console.error('Details:', error.error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.error?.message || 'Error desconocido'
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
