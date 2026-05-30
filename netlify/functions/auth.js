/**
 * Auth Service — Netlify Function
 * POST /api/auth — Login con JWT
 * POST /api/auth/change-password — Cambio de contraseña
 */

const crypto = require('crypto');

// ⚠️ IMPORTANTE: JWT_SECRET debe definirse ANTES de usarlo
const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-en-produccion-secret-key-123';

/**
 * Hash bcrypt simulado (en producción usar bcrypt real)
 */
function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + JWT_SECRET)
    .digest('hex');
}

// Simulación de base de datos (en producción usar Supabase)
const users = {
  admin: {
    id: 'user-admin-001',
    usuario: 'admin',
    passwordHash: hashPassword('Ecos2026$Admin'),
    role: 'admin',
    nombre: 'Dr. Admin'
  }
};

/**
 * Generar JWT
 */
function generateToken(userId, role) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 días
    })
  ).toString('base64');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64');

  return `${header}.${payload}.${signature}`;
}

/**
 * Verificar JWT
 */
function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64');

    if (signature !== expectedSignature) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expirado
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Handler principal
 */
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Parse body
    const body = JSON.parse(event.body || '{}');

    // POST /api/auth — Login
    if (event.httpMethod === 'POST' && (event.path === '/.netlify/functions/auth' || event.path.endsWith('/auth'))) {
      const { usuario, password } = body;

      if (!usuario || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Usuario y contraseña requeridos' })
        };
      }

      const user = users[usuario];
      if (!user || user.passwordHash !== hashPassword(password)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Usuario o contraseña incorrectos' })
        };
      }

      // Generar token
      const token = generateToken(user.id, user.role);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token,
          role: user.role,
          name: user.nombre,
          userId: user.id
        })
      };
    }

    // POST /api/auth/change-password — Cambiar contraseña
    if (event.httpMethod === 'POST' && (event.path === '/.netlify/functions/auth-change' || event.path.endsWith('/change-password'))) {
      const token = event.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Token requerido' })
        };
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Token inválido' })
        };
      }

      const { passwordActual, passwordNueva } = body;
      if (!passwordActual || !passwordNueva) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Contraseñas requeridas' })
        };
      }

      // En producción, buscar usuario en Supabase y validar
      // Por ahora, solo devolver OK
      console.log(`[Auth] Cambio de contraseña para ${decoded.userId}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Contraseña actualizada' })
      };
    }

    // Endpoint no encontrado
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
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};
