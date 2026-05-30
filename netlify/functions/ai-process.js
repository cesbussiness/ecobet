/**
 * AI Service — Netlify Function
 * Usa Anthropic Claude API para generar informes ecosonográficos
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🎬 AI-Process iniciado');
    console.log('API Key existe:', !!ANTHROPIC_API_KEY);
    console.log('API Key primeros 10 chars:', ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'NO EXISTE');

    if (!ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY no encontrada en variables de entorno');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API key no configurada',
          analisis: '❌ Error: ANTHROPIC_API_KEY no está en Netlify'
        })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { paciente, fecha, tipo, hallazgos, observaciones } = body;

    console.log('📊 Datos recibidos:');
    console.log('  Paciente:', paciente?.nombre);
    console.log('  Tipo:', tipo);
    console.log('  Hallazgos length:', hallazgos?.length);

    if (!hallazgos || !hallazgos.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Hallazgos vacíos' })
      };
    }

    const prompt = `RESTRICCIÓN CRÍTICA: Eres un asistente de redacción médica ÚNICAMENTE.

Tu única función es:
- Estructurar y mejorar la redacción de lo que el médico dictó
- Corregir errores de ortografía y gramática
- Organizar el texto de manera profesional
- Mantener EXACTAMENTE lo que el médico escribió

PROHIBIDO ABSOLUTAMENTE:
❌ NO añadas diagnósticos
❌ NO hagas interpretaciones clínicas
❌ NO sugerías recomendaciones
❌ NO inventes datos
❌ NO modifiques el contenido médico original

DATOS DEL PACIENTE:
- Nombre: ${paciente?.nombre} ${paciente?.apellido || ''}
- Cédula: ${paciente?.cedula}
- Edad: ${paciente?.edad || 'No especificada'}

INFORME A REDACTAR:
- Fecha: ${fecha}
- Tipo: ${tipo}
- Hallazgos del médico:
${hallazgos}

${observaciones ? `Observaciones adicionales del médico:\n${observaciones}` : ''}

TAREA:
1. Estructura el informe de forma profesional
2. Mejora la redacción manteniendo el contenido exacto
3. Corrige errores gramaticales y ortográficos
4. Organiza en párrafos coherentes

RECUERDA: Solo redacción. Nada más. Sin invención de datos médicos.`;

    console.log('📡 Llamando Claude API...');

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
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
      const errorText = await claudeResponse.text();
      console.error('❌ Claude error response:', claudeResponse.status, errorText);

      return {
        statusCode: claudeResponse.status,
        headers,
        body: JSON.stringify({
          error: `Claude API error: ${claudeResponse.status}`,
          analisis: `❌ Error API Claude: ${claudeResponse.status}`,
          details: errorText
        })
      };
    }

    const claudeData = await claudeResponse.json();
    console.log('✅ Response JSON recibida');
    console.log('   Content type:', typeof claudeData.content);
    console.log('   Content length:', claudeData.content?.length);

    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('❌ Contenido vacío en respuesta');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Sin contenido',
          analisis: '❌ Respuesta de Claude sin contenido'
        })
      };
    }

    const textContent = claudeData.content.find(c => c.type === 'text');
    if (!textContent) {
      console.error('❌ No hay content de tipo text');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Tipo de contenido inválido',
          analisis: '❌ Respuesta sin texto'
        })
      };
    }

    const analisis = textContent.text;
    console.log('✅ Análisis generado:', analisis.length, 'caracteres');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analisis: analisis,
        resultado: analisis,
        paciente: paciente?.nombre,
        tipo: tipo,
        fecha: fecha
      })
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error en servidor',
        analisis: `❌ ${error.message}`
      })
    };
  }
};
