/**
 * Email Service — Netlify Function
 * Enviar informes por email
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
    const { informeId, emailDestino } = JSON.parse(event.body || '{}');

    if (!informeId || !emailDestino) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Informe ID y email requeridos' })
      };
    }

    // En producción: usar Nodemailer para enviar email real
    console.log(`[Email] Enviando informe ${informeId} a ${emailDestino}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Email enviado',
        informeId,
        emailDestino
      })
    };
  } catch (error) {
    console.error("Email error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Error enviando email" })
    };
  }
};
