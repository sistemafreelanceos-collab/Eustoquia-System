import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'Falta la URL' }, { status: 400 });

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (!response.ok) throw new Error(`No se pudo acceder a la web (${response.status})`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Eliminar elementos no deseados
    $('script, style, nav, footer, iframe, img, svg, noscript, header').remove();
    
    // Extraer título y texto limpio
    const title = $('title').text().trim() || url;
    const extractedText = $('body').text().replace(/\s+/g, ' ').trim();

    return NextResponse.json({ 
      text: extractedText,
      title,
      length: extractedText.length,
      preview: extractedText.substring(0, 500)
    });

  } catch (error: any) {
    console.error('Error en scraping:', error.message);
    return NextResponse.json({ error: 'Falla al extraer la web: ' + error.message }, { status: 500 });
  }
}
