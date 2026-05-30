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

    const prompt = `ERES UN REDACTOR DE LENGUAJE MÉDICO - NO UN EXPERTO CLÍNICO

Tu ÚNICA función:
1. Tomar EXACTAMENTE las palabras del médico (lo dictado)
2. Reformular con lenguaje médico formal y adecuado
3. Mantener 100% del contenido (nada inventado)
4. Usar terminología específica para el tipo de ecosonografía

QUÉ HACER:
✅ Reformular con términos médicos formales
✅ Organizar en párrafos coherentes
✅ Usar lenguaje técnico adecuado al tipo de informe
✅ Mantener el orden de hallazgos del médico
✅ Estructurar profesionalmente

QUÉ NUNCA HACER:
❌ NO inventar hallazgos (nada que no haya dictado)
❌ NO agregar diagnósticos
❌ NO hacer interpretaciones clínicas
❌ NO sugerir recomendaciones
❌ NO inferir qué causa algo
❌ NO añadir información médica extra

EJEMPLO CORRECTO:
Médico dicta: "El hígado está grande, como 16 centímetros"
Tú redactas: "Se visualiza hígado aumentado de tamaño con dimensión longitudinal de 16 cm"
- ✅ Tomaste: hígado, grande, 16 cm
- ✅ Reformulaste con lenguaje formal
- ✅ NO inventaste nada

EJEMPLO INCORRECTO:
Médico dicta: "El hígado está grande"
Tú redactas: "Hepatomegalia compatible con cirrosis hepática"
- ❌ Inventaste "compatible con cirrosis" (no lo dijo)
- ❌ Hiciste interpretación clínica

DATOS DEL PACIENTE:
- Nombre: ${paciente?.nombre} ${paciente?.apellido || ''}
- Cédula: ${paciente?.cedula}
- Edad: ${paciente?.edad || 'No especificada'}

TIPO DE ECOSONOGRAFÍA: ${tipo}
(Usa terminología específica para este tipo)

HALLAZGOS DICTADOS POR EL MÉDICO:
${hallazgos}

${observaciones ? `OBSERVACIONES ADICIONALES DICTADAS:\n${observaciones}` : ''}

TAREA:
1. Lee los hallazgos dictados
2. Reformula EXACTAMENTE eso con lenguaje médico formal
3. Organiza en párrafos profesionales
4. Verifica: ¿inventé algo que no fue dictado? Si SÍ, borra
5. Entrega informe reformulado (solo redacción, sin diagnósticos)

IMPORTANTE: El médico es responsable del contenido médico.
Tú solo reformulas lo que él dictó con lenguaje formal.`;

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
