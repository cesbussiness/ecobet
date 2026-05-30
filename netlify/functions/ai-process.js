/**
 * AI Service — Netlify Function
 * Usa Anthropic Claude API para generar informes ecosonográficos
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key;

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
    console.log('🎬 AI-Process iniciado');
    console.log('API Key disponible:', !!ANTHROPIC_API_KEY);

    if (!ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY no configurada');
      console.error('Variables de entorno:', Object.keys(process.env).filter(k => k.toLowerCase().includes('anthropic')));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API key no configurada',
          analisis: '❌ Error: ANTHROPIC_API_KEY no configurada en Netlify'
        })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { paciente, fecha, tipo, hallazgos, observaciones } = body;

    console.log('📊 Datos recibidos:');
    console.log('Paciente:', paciente.nombre);
    console.log('Tipo:', tipo);
    console.log('Hallazgos length:', hallazgos?.length);

    if (!hallazgos || !hallazgos.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Hallazgos vacíos' })
      };
    }

    // Construir prompt
    const prompt = `Eres un experto en ecosonografía médica. 

Analiza EXACTAMENTE lo que el médico escribió en hallazgos y proporciona un informe profesional.

DATOS DEL PACIENTE:
- Nombre: ${paciente.nombre} ${paciente.apellido || ''}
- Cédula: ${paciente.cedula}
- Edad: ${paciente.edad || 'No especificada'}
- Género: ${paciente.genero || 'No especificado'}

INFORME:
- Fecha: ${fecha}
- Tipo: ${tipo}
- Hallazgos:
${hallazgos}

${observaciones ? `- Observaciones:\n${observaciones}` : ''}

GENERA UN INFORME CON:
1. Resumen de hallazgos
2. Interpretación clínica
3. Diagnósticos diferenciales
4. Recomendaciones

Sé preciso, profesional y basa todo en lo que escribió el médico.`;

    console.log('📡 Llamando Claude API...');

    // Llamar a Claude
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    console.log('📊 Claude response status:', claudeResponse.status);

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text();
      console.error('❌ Claude error:', claudeResponse.status);
      console.error('Error body:', errorData);

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: `Claude API error: ${claudeResponse.status}`,
          analisis: `❌ Error de API Claude: ${claudeResponse.status}`
        })
      };
    }

    const claudeData = await claudeResponse.json();
    console.log('✅ Respuesta recibida de Claude');

    if (!claudeData.content || !claudeData.content[0]) {
      console.error('❌ No content in response');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Sin contenido en respuesta',
          analisis: '❌ Error: Respuesta vacía de Claude'
        })
      };
    }

    const analisis = claudeData.content[0].text;
    console.log('✅ Análisis generado, length:', analisis.length);

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
    console.error('❌ Error general:', error.message);
    console.error('Stack:', error.stack);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error procesando informe',
        mensaje: error.message,
        analisis: `❌ Error: ${error.message}`
      })
    };
  }
};
