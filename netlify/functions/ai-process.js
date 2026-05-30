/**
 * AI Service — Netlify Function
 */

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hallazgos: 'Análisis pendiente',
        recomendaciones: 'Revisar con médico',
        advertencias: 'Datos insuficientes'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error', error: error.message })
    };
  }
};
