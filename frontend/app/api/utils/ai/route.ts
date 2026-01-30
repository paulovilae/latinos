
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, locale } = await req.json();

    // Determine prompts based on locale
    const isSpanish = locale === 'es';
    const systemInstruction = isSpanish 
        ? "Genera solo código de trading para una Señal de Inversión. Usa comentarios en español."
        : "Generate only trading code for an Investment Signal. Use comments in English.";
        
    const userPrompt = isSpanish
        ? `Genera código de trading (Python o Fórmula) para esta Señal de Inversión: ${prompt}. Retorna SOLO el código.`
        : `Generate trading code (Python or Formula) for this Investment Signal: ${prompt}. Return ONLY the code.`;

    const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    
    if (process.env.NODE_ENV === 'development') {
       try {
           const res = await fetch(`${ollamaHost}/api/generate`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   model: "llama3", 
                   prompt: `${systemInstruction}\n\n${userPrompt}`,
                   stream: false
               })
           });
           if (res.ok) {
               const data = await res.json();
               return NextResponse.json({ code: data.response });
           }
       } catch (e) {
           console.warn("Ollama unreachable, falling back to mock.");
       }
    }

    // Mock Response
    const mockComment = isSpanish 
        ? "# IA Generada (Mock)\n# Señal de Inversión:" 
        : "# AI Generated (Mock)\n# Investment Signal:";
        
    return NextResponse.json({ 
        code: `${mockComment} ${prompt}\n\ndef signal(data):\n    # TODO: Implementar/Implement logic\n    return "hold"` 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
  }
}
