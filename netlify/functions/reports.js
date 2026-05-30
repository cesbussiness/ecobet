/**
 * Report Service — Netlify Function
 * CRUD de informes
 */

const reports = {};

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
    const pathSegments = event.path.split('/');
    const reportId = pathSegments[pathSegments.length - 1];

    // GET /api/reports — Listar
    if (event.httpMethod === 'GET' && !reportId) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: Object.values(reports),
          total: Object.keys(reports).length
        })
      };
    }

    // POST /api/reports — Crear
    if (event.httpMethod === 'POST') {
      const id = 'report-' + Date.now();
      reports[id] = {
        id,
        ...body,
        estado: body.estado || 'borrador',
        created_at: new Date().toISOString()
      };

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(reports[id])
      };
    }

    // GET /api/reports/:id — Obtener
    if (event.httpMethod === 'GET' && reports[reportId]) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(reports[reportId])
      };
    }

    // PUT /api/reports/:id — Actualizar
    if (event.httpMethod === 'PUT' && reports[reportId]) {
      reports[reportId] = {
        ...reports[reportId],
        ...body,
        updated_at: new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(reports[reportId])
      };
    }

    // DELETE /api/reports/:id — Eliminar
    if (event.httpMethod === 'DELETE' && reports[reportId]) {
      delete reports[reportId];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Informe eliminado' })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'No encontrado' })
    };
  } catch (error) {
    console.error("Report error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Error interno" })
    };
  }
};
