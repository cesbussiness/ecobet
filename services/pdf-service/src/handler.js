/**
 * PDF Service — Netlify Function
 * Generar PDF de informes
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
    const { informeId } = JSON.parse(event.body || '{}');

    if (!informeId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Informe ID requerido' })
      };
    }

    // En producción: usar pdfmake para generar PDF real
    // Por ahora, devolver URL simulada
    const pdfUrl = `/pdfs/informe-${informeId}.pdf`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        pdfUrl,
        message: 'PDF generado',
        informeId
      })
    };
  } catch (error) {
    console.error("PDF error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Error generando PDF" })
    };
  }
};
