/**
 * Auth Service — Netlify Function
 * POST /api/auth — Login simple
 */

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // POST /api/auth — Login
    if (event.httpMethod === 'POST') {
      const { usuario, password } = body;

      // Validar credenciales
      if (usuario === 'admin' && password === 'Ecos2026$Admin') {
        // Generar token simple (no JWT completo, solo token)
        const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            token: token,
            role: 'admin',
            name: 'Dr. Admin',
            userId: 'user-admin-001'
          })
        };
      }

      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Usuario o contraseña incorrectos' })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Endpoint no encontrado' })
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor', error: error.message })
    };
  }
};
