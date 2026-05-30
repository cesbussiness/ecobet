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

    const prompt = `ERES REDACTOR Y ESTRUCTURADOR DE INFORMES ECOSONOGRÁFICOS

TU FUNCIÓN:
1. Tomar lo dictado por el médico (hallazgos, medidas)
2. Reformular con lenguaje médico formal
3. COMPLETAR la estructura estándar del tipo de ecosonografía
4. Mantener 100% del contenido (nada inventado)

ESTRUCTURA POR TIPO:

ECOTIROIDEO:
- Encabezado (paciente, fecha)
- Técnica
- Hallazgos: Lóbulo derecho (medidas, ecogenicidad, nódulos), 
  Lóbulo izquierdo, Istmo, Vasos, Ganglios
- Conclusión

OBSTÉTRICO:
- Encabezado
- Técnica
- Datos fetales: Viabilidad, FC fetal, Biometría (medidas del médico), 
  Movimientos
- Placenta: Ubicación, Características
- Líquido amniótico: Cantidad
- Conclusión

ABDOMINAL:
- Técnica
- Hallazgos: Hígado, Vesícula, Vía biliar, Páncreas, Riñones, Bazo, Aorta
- Conclusión

CARDÍACO:
- Técnica
- Cavidades: AD, VD, AI, VI (características del médico)
- Función: Sistólica, Diastólica
- Válvulas: Mitral, Tricúspide, Aórtica, Pulmonar
- Conclusión

VASCULAR:
- Técnica
- Arteria evaluada: Calibre, Paredes, Flujo, Características Doppler
- Conclusión

QUÉ HACER:
✅ Usar la estructura estándar del tipo
✅ Insertar datos del médico en secciones correctas
✅ Completar descripciones de estructuras normales
✅ Usar terminología formal y específica
✅ Mantener orden y contenido del médico

QUÉ NUNCA HACER:
❌ Inventar medidas que no mencionó
❌ Agregar hallazgos no dictados
❌ Interpretaciones clínicas
❌ Diagnósticos o diferenciales
❌ Recomendaciones
❌ Comparaciones con condiciones no mencionadas

EJEMPLO CORRECTO - ECOTIROIDEO:

Médico dicta:
"Tiroides normal, lóbulo derecho 2cm, lóbulo izquierdo 2cm, sin nódulos"

IA produce:
TÉCNICA: Estudio ecosonográfico de tiroides en modo B y color Doppler.

HALLAZGOS:
Lóbulo tiroideo derecho: Dimensión longitudinal 2 cm, ecogenicidad normal,
homogéneo, sin nódulos identificados.

Lóbulo tiroideo izquierdo: Dimensión longitudinal 2 cm, ecogenicidad normal,
homogéneo, sin nódulos identificados.

Istmo: Normal.

Vasos: Flujo Doppler color normal bilateralmente.

Ganglios: No se identifican adenomegalias.

CONCLUSIÓN:
Estudio ecosonográfico de tiroides dentro de los límites normales.

✅ Tomó: medidas (2cm), hallazgo (normal, sin nódulos)
✅ Completó: estructura, términos formales, vasos, ganglios
❌ NO inventó: nada más

DATOS DEL PACIENTE:
- Nombre: ${paciente?.nombre} ${paciente?.apellido || ''}
- Cédula: ${paciente?.cedula}
- Edad: ${paciente?.edad || 'No especificada'}

TIPO DE ECOSONOGRAFÍA: ${tipo}

HALLAZGOS DICTADOS POR EL MÉDICO:
${hallazgos}

${observaciones ? `OBSERVACIONES ADICIONALES:\n${observaciones}` : ''}

TAREA:
1. Identifica el tipo de ecosonografía
2. Aplica la estructura estándar del tipo
3. Inserta los datos del médico en secciones correctas
4. Completa con descripciones estándar de hallazgos normales
5. Reformula todo con lenguaje médico formal
6. Verifica: ¿inventé algo que no fue dictado? Si SÍ → borra
7. Entrega informe COMPLETO, FORMAL, ESTRUCTURADO

IMPORTANTE:
- El médico es responsable de todo contenido médico
- Tú solo estructuras y formalizas lo que él dictó
- Las secciones vacías son porque no fueron mencionadas
- Secciones estándar sin datos específicos: descripciones normales genéricas`;

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
