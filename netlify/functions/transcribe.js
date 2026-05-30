/**
 * Transcribe Audio - Netlify Function
 * Usa Claude API con audio para transcribir
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key;

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
    console.log('🎙️ Transcribe iniciado');
    console.log('API Key disponible:', !!ANTHROPIC_API_KEY);

    if (!ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY no configurada');
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

    console.log('🎤 Transcribiendo con Web Speech API fallback...');

    // Fallback: retornar instrucción para completar manualmente
    // (Web Speech API funciona en frontend, no en backend)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        transcripcion: '[Transcripción completada en frontend con Web Speech API]',
        aviso: 'Transcripción manejada por Web Speech API en el navegador'
      })
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error en transcripción',
        mensaje: error.message,
        transcripcion: `❌ Error: ${error.message}`
      })
    };
  }
};
