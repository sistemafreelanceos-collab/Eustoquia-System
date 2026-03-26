import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'Falta la URL' }, { status: 400 });

    // Extraer Video ID
    const videoId = extractVideoId(url);
    if (!videoId) return NextResponse.json({ error: 'URL de YouTube no válida' }, { status: 400 });

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcript.map(t => t.text).join(' ');

    return NextResponse.json({ text: fullText });
  } catch (error: any) {
    console.error('Error en transcripción:', error.message);
    return NextResponse.json({ error: 'No se pudo obtener la transcripción. El video podría tener subtítulos desactivados.' }, { status: 500 });
  }
}

function extractVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
