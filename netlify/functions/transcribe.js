/**
 * Transcribe Audio - Netlify Function
 * Usa Anthropic Claude para transcribir audios médicos
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
          transcripcion: 'Error: ANTHROPIC_API_KEY no configurada'
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

    console.log('🎙️ Transcribiendo audio...');
    console.log('Tipo:', mimeType);

    // Llamar a Claude con vision (para audio en el futuro)
    // Por ahora usamos una llamada POST directa
    
    // NOTA: Anthropic Claude no tiene transcripción de audio nativa aún
    // Vamos a usar Whisper API de OpenAI como fallback
    
    // Para demo, retornamos un placeholder
    // En producción: integrar Whisper API o cambiar a otro servicio

    const transcripcion = await transcribirConWhisper(audioBase64, mimeType);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transcripcion: transcripcion,
        duracion: '~' + Math.round(audioBase64.length / 44100) + ' segundos'
      })
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error transcribiendo',
        mensaje: error.message,
        transcripcion: `[Error: ${error.message}]`
      })
    };
  }
};

/**
 * Transcribir con Whisper API (OpenAI)
 * NOTA: Requiere OPENAI_API_KEY en variables entorno
 */
async function transcribirConWhisper(audioBase64, mimeType) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY no configurada, usando placeholder');
    return `[Transcripción simulada - Configurar OPENAI_API_KEY para transcripción real]
    
Paciente refiere:
- Hallazgo principal: ecosonografía anormal
- Síntomas asociados: presente
- Duración: variable

Nota: Conectar OPENAI_API_KEY para transcripción real en producción.`;
  }

  try {
    // Convertir base64 a buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    // Crear FormData
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioBuffer, { filename: 'audio.mp3', contentType: 'audio/mpeg' });
    form.append('model', 'whisper-1');
    form.append('language', 'es');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const data = await response.json();
    return data.text || 'Transcripción vacía';

  } catch (error) {
    console.error('❌ Whisper error:', error.message);
    throw error;
  }
}
