/**
 * Layout Manager - Sidebar, Hamburguesa, Autenticación
 */

class Layout {
  constructor() {
    this.sidebar = null;
    this.overlay = null;
    this.mobileHeader = null;
    this.userRole = localStorage.getItem('user-role');
    this.userName = localStorage.getItem('user-name');
    console.log('[Layout] Constructor llamado');
  }

  /**
   * Inicializar layout - LLAMAR MANUALMENTE en DOMContentLoaded de cada página
   */
  init() {
    console.log('[Layout] init() llamado');
    
    // Verificar autenticación
    if (!this.isAuthenticated()) {
      console.log('[Layout] No autenticado, redirigiendo a login');
      window.location.href = '/pages/login.html';
      return;
    }
    
    this.sidebar = document.getElementById('sidebar');
    this.content = document.getElementById('content');
    
    if (!this.sidebar) {
      console.warn('[Layout] No hay sidebar en esta página');
      return;
    }
    
    console.log('[Layout] Sidebar encontrado');
    this.setupMediaQuery();
    this.setupSidebarToggle();
    console.log('[Layout] Init completado');
  }

  /**
   * Setup Media Query para móvil/desktop
   */
  setupMediaQuery() {
    const mediaQuery = window.matchMedia('(max-width: 479px)');
    console.log('[Layout] setupMediaQuery - isMobile:', mediaQuery.matches);
    
    // Verificar tamaño actual
    if (mediaQuery.matches) {
      console.log('[Layout] MÓVIL detectado, creando header móvil');
      this.createMobileHeader();
    } else {
      console.log('[Layout] DESKTOP detectado, sidebar normal');
      this.sidebar.classList.remove('mobile-hidden');
      this.content.classList.remove('sidebar-mobile-hidden');
    }
    
    // Escuchar cambios
    mediaQuery.addListener((e) => {
      console.log('[Layout] Cambio de tamaño - isMobile:', e.matches);
      if (e.matches) {
        this.createMobileHeader();
      } else {
        this.destroyMobileHeader();
      }
    });
  }

  /**
   * Crear header móvil con hamburguesa
   */
  createMobileHeader() {
    console.log('[Layout] createMobileHeader()');
    
    // Si ya existe, no crear de nuevo
    if (document.getElementById('mobile-header')) {
      console.log('[Layout] Mobile header ya existe');
      return;
    }
    
    // Crear header
    const header = document.createElement('div');
    header.id = 'mobile-header';
    header.className = 'mobile-header';
    header.innerHTML = `
      <div class="mobile-header-content">
        <button class="mobile-toggle-btn" id="mobile-toggle-btn">☰</button>
        <div class="mobile-header-title">🏥 Ecosonografía</div>
      </div>
    `;
    
    // Insertar al inicio del body
    document.body.insertBefore(header, document.body.firstChild);
    console.log('[Layout] Mobile header creado');
    
    // Esconder sidebar en móvil
    this.sidebar.classList.add('mobile-hidden');
    this.content.classList.add('sidebar-mobile-hidden');
    this.content.style.paddingTop = '60px';
    
    // Setup botón hamburguesa
    const toggleBtn = document.getElementById('mobile-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        console.log('[Layout] Toggle hamburguesa clicked');
        this.sidebar.classList.toggle('mobile-active');
      });
      console.log('[Layout] Mobile toggle button setup');
    }
    
    // Crear overlay
    this.createOverlay();
  }

  /**
   * Crear overlay para cerrar sidebar
   */
  createOverlay() {
    if (document.getElementById('sidebar-overlay')) {
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', () => {
      console.log('[Layout] Overlay clicked, cerrando sidebar');
      this.sidebar.classList.remove('mobile-active');
    });
    
    document.body.appendChild(overlay);
    console.log('[Layout] Overlay creado');
  }

  /**
   * Destruir header móvil (volver a desktop)
   */
  destroyMobileHeader() {
    console.log('[Layout] destroyMobileHeader()');
    
    const mobileHeader = document.getElementById('mobile-header');
    if (mobileHeader) {
      mobileHeader.remove();
      console.log('[Layout] Mobile header removido');
    }
    
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.remove();
      console.log('[Layout] Overlay removido');
    }
    
    this.sidebar.classList.remove('mobile-hidden');
    this.sidebar.classList.remove('mobile-active');
    this.content.classList.remove('sidebar-mobile-hidden');
    this.content.style.paddingTop = '';
    
    console.log('[Layout] Desktop mode restaurado');
  }

  /**
   * Setup toggle del sidebar (desktop)
   */
  setupSidebarToggle() {
    const toggleBtn = this.sidebar.querySelector('.sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[Layout] Sidebar toggle clicked');
        this.sidebar.classList.toggle('collapsed');
      });
    }
  }

  /**
   * Verificar autenticación
   */
  isAuthenticated() {
    const token = localStorage.getItem('auth-token');
    return !!token;
  }

  /**
   * Obtener token
   */
  getAuthToken() {
    return localStorage.getItem('auth-token');
  }

  /**
   * Guardar info autenticación
   */
  setAuthInfo(token, role, name) {
    localStorage.setItem('auth-token', token);
    localStorage.setItem('user-role', role);
    localStorage.setItem('user-name', name);
    this.userRole = role;
    this.userName = name;
  }
}

// Instancia global
const layout = new Layout();

console.log('[Layout.js] Cargado correctamente');
