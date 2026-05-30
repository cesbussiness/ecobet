/**
 * AI Service — Netlify Function
 * Usa Anthropic Claude API para procesar informes ecosonográficos
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY no está configurada');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API key no configurada',
          analisis: 'Error: Variable de entorno ANTHROPIC_API_KEY no configurada en Netlify'
        })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { paciente, fecha, tipo, hallazgos, observaciones } = body;

    if (!hallazgos || !hallazgos.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Hallazgos vacíos' })
      };
    }

    console.log('📡 Llamando Claude API...');
    console.log('Tipo:', tipo);
    console.log('Hallazgos:', hallazgos.substring(0, 100) + '...');

    // Prompt para Claude
    const prompt = `Eres un experto en ecosonografía médica. Analiza los siguientes hallazgos y proporciona un informe profesional.

DATOS DEL PACIENTE:
- Nombre: ${paciente.nombre} ${paciente.apellido || ''}
- Cédula: ${paciente.cedula}
- Edad: ${paciente.edad || 'No especificada'}
- Género: ${paciente.genero || 'No especificado'}

DATOS DEL INFORME:
- Fecha: ${fecha}
- Tipo de Ecosonografía: ${tipo}
- Hallazgos Clínicos:
${hallazgos}

${observaciones ? `- Observaciones Adicionales:\n${observaciones}` : ''}

Por favor proporciona:
1. Resumen de hallazgos
2. Interpretación clínica
3. Posibles diagnósticos diferenciales
4. Recomendaciones y seguimiento

Formato: Respuesta clara, profesional y estructurada.`;

    // Llamar a Claude API
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
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text();
      console.error('❌ Claude API error:', claudeResponse.status, errorData);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    console.log('✅ Respuesta de Claude recibida');

    // Extraer texto de respuesta
    const analisis = claudeData.content[0]?.text || 'Sin respuesta de IA';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analisis: analisis,
        resultado: analisis,
        paciente: paciente.nombre,
        tipo: tipo,
        fecha: fecha
      })
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error procesando informe',
        mensaje: error.message,
        analisis: `Error: ${error.message}`
      })
    };
  }
};
