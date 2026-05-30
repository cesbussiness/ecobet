/**
 * api.js
 * Cliente API REST con autenticación JWT
 * Manejo de errores, reintentos, timeout
 */

class API {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.timeout = 30000; // 30 segundos
  }

  /**
   * Obtener token de autenticación guardado
   */
  getToken() {
    return localStorage.getItem('auth-token');
  }

  /**
   * Hacer request HTTP genérico
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      requireAuth = true
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    
    const finalHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Añadir token de autenticación si requerido
    if (requireAuth) {
      const token = this.getToken();
      if (!token) {
        throw new Error('No autenticado. Token faltante.');
      }
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers: finalHeaders,
      signal: AbortSignal.timeout(this.timeout)
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      // Manejar respuestas de error
      if (response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('auth-token');
        window.location.href = 'login.html';
        throw new Error('Sesión expirada. Redirigiéndote al login.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.message || `Error ${response.status}`,
          data: errorData
        };
      }

      // Parsear respuesta
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Error de red: ${error.message}`);
      }
      throw error;
    }
  }

  /* ───────────────────────────────────────────────────────────────
     Autenticación
     ─────────────────────────────────────────────────────────────── */

  async login(usuario, password) {
    const response = await this.request('/auth', {
      method: 'POST',
      body: { usuario, password },
      requireAuth: false
    });
    return response; // {token, role, name}
  }

  async changePassword(passwordActual, passwordNueva) {
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: { passwordActual, passwordNueva }
    });
  }

  /* ───────────────────────────────────────────────────────────────
     Pacientes
     ─────────────────────────────────────────────────────────────── */

  async createPaciente(data) {
    // data: {cedula, nombre, apellido, email, telefono, fechaNacimiento, genero}
    // NO inventar nada; todos los campos requeridos deben venir de la UI
    return await this.request('/patients', {
      method: 'POST',
      body: data
    });
  }

  async getPacientes(filtros = {}) {
    // filtros: {search, page, limit, estado}
    const params = new URLSearchParams(filtros);
    return await this.request(`/patients?${params}`, {
      method: 'GET'
    });
  }

  async getPaciente(id) {
    return await this.request(`/patients/${id}`, {
      method: 'GET'
    });
  }

  async updatePaciente(id, data) {
    return await this.request(`/patients/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  async deletePaciente(id) {
    return await this.request(`/patients/${id}`, {
      method: 'DELETE'
    });
  }

  /* ───────────────────────────────────────────────────────────────
     Informes
     ─────────────────────────────────────────────────────────────── */

  async createInforme(data) {
    // data: {pacienteId, textoOriginal, hallazgos, recomendaciones}
    // El AI lo procesa, NO inventamos hallazgos
    return await this.request('/reports', {
      method: 'POST',
      body: data
    });
  }

  async getInformes(filtros = {}) {
    // filtros: {pacienteId, estado, fechaDesde, fechaHasta, page, limit}
    const params = new URLSearchParams(filtros);
    return await this.request(`/reports?${params}`, {
      method: 'GET'
    });
  }

  async getInforme(id) {
    return await this.request(`/reports/${id}`, {
      method: 'GET'
    });
  }

  async updateInforme(id, data) {
    return await this.request(`/reports/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  async deleteInforme(id) {
    return await this.request(`/reports/${id}`, {
      method: 'DELETE'
    });
  }

  /* ───────────────────────────────────────────────────────────────
     Procesamiento AI
     ─────────────────────────────────────────────────────────────── */

  async processReportWithAI(textoOriginal) {
    // Enviar texto crudo del dictado a Claude para estructuración
    // NO inventamos hallazgos; Claude solo estructura lo que el médico dijo
    return await this.request('/ai/process-report', {
      method: 'POST',
      body: { textoOriginal }
    });
  }

  /* ───────────────────────────────────────────────────────────────
     PDF
     ─────────────────────────────────────────────────────────────── */

  async generatePDF(informeId) {
    // Generar PDF letra tamaño carta del informe
    const response = await this.request(`/pdf/generate?informeId=${informeId}`, {
      method: 'POST'
    });
    // response.pdfUrl o similar, según el backend
    return response;
  }

  /* ───────────────────────────────────────────────────────────────
     Email
     ─────────────────────────────────────────────────────────────── */

  async sendReportEmail(informeId, emailDestino) {
    // Enviar informe por email (con consentimiento del paciente)
    return await this.request('/email/send', {
      method: 'POST',
      body: { informeId, emailDestino }
    });
  }

  /* ───────────────────────────────────────────────────────────────
     Utilidades
     ─────────────────────────────────────────────────────────────── */

  /**
   * Mostrar error amigable y loguear
   */
  static showError(error) {
    console.error('API Error:', error);
    
    let message = 'Error desconocido';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error.message) {
      message = error.message;
    } else if (error.data && error.data.message) {
      message = error.data.message;
    }
    
    // Mostrar en UI (implementar según el contexto)
    alert(message);
    return message;
  }

  /**
   * Reintentar request con backoff exponencial
   */
  async retryRequest(endpoint, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        // Backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Instancia global
const api = new API();
