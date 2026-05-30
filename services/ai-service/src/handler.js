/**
 * AI Service — Netlify Function
 * POST /api/ai/process-report — Procesar informe con Claude
 */

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { textoOriginal } = body;

    if (!textoOriginal || !textoOriginal.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Texto vacío' })
      };
    }

    // Llamar a Claude
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `Eres un asistente médico especializado en ecosonografía.
Recibe texto dictado por un médico y lo estructuras en JSON VÁLIDO.

INSTRUCCIONES CRÍTICAS:
1. NO inventar hallazgos. Solo estructurar lo que el médico dijo.
2. Si el texto es muy vago o incompleto, especificarlo en "advertencias".
3. Responder SOLO con JSON válido, sin markdown ni explicaciones.
4. Nunca asumir diagnósticos no mencionados.

Formato de respuesta:
{
  "hallazgos": "Lo que se encontró en el examen (solo lo dictado)",
  "recomendaciones": "Acciones sugeridas (solo si el médico las mencionó)",
  "advertencias": "Campos incompletos, ambigüedades, o datos faltantes"
}`,
      messages: [
        {
          role: "user",
          content: `Estructura este dictado de ecosonografía:\n\n${textoOriginal}`
        }
      ]
    });

    // Extraer respuesta
    const responseText = message.content[0].text;

    // Parsear JSON
    let result;
    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
      const cleanJson = jsonMatch ? jsonMatch[1] : responseText;
      result = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Error parseando JSON:", parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Claude no devolvió JSON válido",
          raw: responseText
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error("AI error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error procesando con Claude",
        error: error.message
      })
    };
  }
};
