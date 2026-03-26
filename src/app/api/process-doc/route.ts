import { NextResponse } from 'next/server';
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'Falta la URL del documento' }, { status: 400 });

    // Descargar el archivo
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo descargar el archivo desde Supabase');
    
    const buffer = Buffer.from(await response.arrayBuffer());
    let extractedText = '';

    // Determinar extensión desde la URL
    const extension = url.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (extension === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      // Intentar leer como texto simple si falla la extensión
      extractedText = buffer.toString('utf-8');
    }

    return NextResponse.json({ 
      text: extractedText,
      length: extractedText.length,
      preview: extractedText.substring(0, 1000) 
    });

  } catch (error: any) {
    console.error('Error procesando documento:', error.message);
    return NextResponse.json({ error: 'Falla al procesar el documento: ' + error.message }, { status: 500 });
  }
}
