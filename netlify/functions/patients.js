/**
 * Patient Service — Netlify Function
 * CRUD de pacientes
 */

// Mock datos (en producción usar Supabase)
const patients = {};

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
    const patientId = pathSegments[pathSegments.length - 1];

    // GET /api/patients — Listar
    if (event.httpMethod === 'GET' && !patientId) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: Object.values(patients),
          total: Object.keys(patients).length
        })
      };
    }

    // POST /api/patients — Crear
    if (event.httpMethod === 'POST') {
      const id = 'patient-' + Date.now();
      patients[id] = {
        id,
        ...body,
        created_at: new Date().toISOString()
      };

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(patients[id])
      };
    }

    // GET /api/patients/:id — Obtener
    if (event.httpMethod === 'GET' && patients[patientId]) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(patients[patientId])
      };
    }

    // PUT /api/patients/:id — Actualizar
    if (event.httpMethod === 'PUT' && patients[patientId]) {
      patients[patientId] = {
        ...patients[patientId],
        ...body,
        updated_at: new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(patients[patientId])
      };
    }

    // DELETE /api/patients/:id — Eliminar
    if (event.httpMethod === 'DELETE' && patients[patientId]) {
      delete patients[patientId];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Paciente eliminado' })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'No encontrado' })
    };
  } catch (error) {
    console.error("Patient error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Error interno" })
    };
  }
};
