/**
 * Transcribe Audio - Netlify Function
 * Usa Claude API con audio para transcribir
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API key no configurada',
          transcripcion: '❌ Error: ANTHROPIC_API_KEY no configurada'
        })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { audioBase64, mimeType } = body;

    if (!audioBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Audio no proporcionado' })
      };
    }

    console.log('🎙️ Transcribiendo audio con Claude...');

    // Claude 4 soporta audio en base64
    // Intentamos enviar el audio como contenido a procesar
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Eres un experto en transcripción médica.

Tu única tarea es TRANSCRIBIR exactamente lo que escuchas en el audio.

REGLAS:
1. TRANSCRIBA palabra por palabra lo que dice
2. NO invente nada
3. NO agregue interpretaciones
4. Si hay algo inaudible, escriba [inaudible]
5. Si hay pausas, escriba [pausa]
6. Preserve la estructura y puntuación
7. SOLO transcribe - nada más

El audio está en base64 adjunto.`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'audio/mpeg',
                  data: audioBase64
                }
              }
            ]
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text();
      console.error('❌ Claude API error:', claudeResponse.status);
      
      // Si Claude no puede procesar audio, usamos fallback
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          transcripcion: '[Transcripción pendiente - completa manualmente en el campo]',
          aviso: 'La transcripción automática no está disponible. Por favor, transcribe el audio manualmente.'
        })
      };
    }

    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content || !claudeData.content[0]) {
      throw new Error('No content in response');
    }

    const transcripcion = claudeData.content[0].text;
    console.log('✅ Audio transcrito con Claude');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transcripcion: transcripcion
      })
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        transcripcion: '[Transcripción pendiente - completa manualmente en el campo]',
        error: error.message
      })
    };
  }
};
