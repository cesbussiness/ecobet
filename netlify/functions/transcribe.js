/**
 * Transcribe Audio - Netlify Function
 * Usa Claude API para transcribir audios médicos
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
          transcripcion: '❌ Error: ANTHROPIC_API_KEY no configurada en Netlify'
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
    console.log('Tipo:', mimeType);

    // Llamar a Claude con audio (vision con base64)
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Eres un especialista médico en ecografía. 

Tu tarea ES TRANSCRIBIR el audio médico que te proporciona el doctor.

REGLAS CRÍTICAS:
1. TRANSCRIBO EXACTAMENTE lo que dice el doctor
2. NO inventas hallazgos
3. NO agrego interpretaciones
4. Preservo la estructura y orden
5. Si hay pausas o dudas, lo indico con [pausa] o [inaudible]
6. Formato CLARO y LEGIBLE para que el doctor pueda editarlo

Solo transcribe el audio. Nada más.`
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
      console.error('❌ Claude API error:', claudeResponse.status, errorData);
      
      // Fallback: retornar placeholder
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          transcripcion: '[Transcripción pendiente - Por favor, completa manualmente]',
          aviso: 'Claude API no disponible en este momento. Completa manualmente el texto.'
        })
      };
    }

    const claudeData = await claudeResponse.json();
    console.log('✅ Respuesta de Claude recibida');

    // Extraer texto de respuesta
    const transcripcion = claudeData.content[0]?.text || '[Sin respuesta de IA]';

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
    
    // Fallback amigable
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        transcripcion: '[Transcripción pendiente - Por favor, completa manualmente]',
        aviso: error.message
      })
    };
  }
};
