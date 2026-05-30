/**
 * layout.js
 * Componentes reutilizables: Sidebar, Header, Navigation
 * Responsive: Collapsible en móvil, expandible en desktop
 */

class Layout {
  constructor() {
    this.sidebarCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    this.userRole = null;
    this.userName = null;
    this.init();
  }

  init() {
    this.ensureSidebarExists();
    this.setupToggle();
    this.setupLogout();
    this.applyCollapsedState();
    this.setupMediaQuery();
    this.loadUserInfo();
  }

  ensureSidebarExists() {
    if (!document.querySelector('.sidebar')) {
      const body = document.body;
      body.classList.add('with-sidebar');
      
      const sidebar = document.createElement('aside');
      sidebar.className = 'sidebar';
      sidebar.innerHTML = `
        <div class="sidebar-header">
          <span>🏥</span>
          <span>Ecosonografía</span>
        </div>
        
        <nav class="sidebar-nav" id="main-nav"></nav>
        
        <div class="sidebar-footer">
          <a href="#" id="logout-btn" style="
            display: flex;
            align-items: center;
            gap: var(--space-md);
            padding: var(--space-md);
            border-radius: var(--radius-md);
            color: var(--color-white);
            text-decoration: none;
          ">
            <span>🚪</span>
            <span>Salir</span>
          </a>
        </div>
      `;
      
      body.insertBefore(sidebar, body.firstChild);
    }
  }

  setupToggle() {
    // Botón toggle en el header (si existe)
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleSidebar());
    }
  }

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebar-collapsed', this.sidebarCollapsed);
    
    if (this.sidebarCollapsed) {
      sidebar.classList.add('collapsed');
      content.classList.add('sidebar-collapsed');
    } else {
      sidebar.classList.remove('collapsed');
      content.classList.remove('sidebar-collapsed');
    }
  }

  applyCollapsedState() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    
    if (this.sidebarCollapsed) {
      sidebar.classList.add('collapsed');
      content?.classList.add('sidebar-collapsed');
    }
  }

  setupMediaQuery() {
    // En móvil, ocultar sidebar completamente con toggle button
    // En desktop, respetar preferencia de colapso
    const self = this;  // Guardar this correctamente
    const mediaQuery = window.matchMedia('(max-width: 479px)');
    
    const handleMediaChange = (e) => {
      console.log('📱 Media query change:', e.matches ? 'MOBILE' : 'DESKTOP');
      
      const sidebar = document.querySelector('.sidebar');
      const content = document.querySelector('.content');
      
      if (e.matches) {
        // Móvil pequeño (<480px): sidebar oculto por defecto
        console.log('📱 Aplicando mobile-hidden...');
        sidebar?.classList.add('mobile-hidden');
        content?.classList.add('sidebar-mobile-hidden');
        
        // Crear botón hamburguesa si no existe
        if (!document.querySelector('.hamburger-menu')) {
          console.log('📱 Creando botón hamburguesa...');
          self.createMobileToggle();
        }
      } else {
        // Desktop/tablet: usar estado guardado
        console.log('🖥️ Modo desktop, removiendo mobile-hidden...');
        sidebar?.classList.remove('mobile-hidden');
        content?.classList.remove('sidebar-mobile-hidden');
        
        if (self.sidebarCollapsed) {
          sidebar?.classList.add('collapsed');
          content?.classList.add('sidebar-collapsed');
        } else {
          sidebar?.classList.remove('collapsed');
          content?.classList.remove('sidebar-collapsed');
        }
      }
    };
    
    mediaQuery.addListener(handleMediaChange);
    handleMediaChange(mediaQuery);  // Ejecutar inmediatamente
    console.log('✅ setupMediaQuery configurado');
  }

  createMobileToggle() {
    // Crear un header FIJO en móvil con el botón hamburguesa
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
      // Reintentar después de que se cree el sidebar
      setTimeout(() => this.createMobileToggle(), 100);
      return;
    }

    // No crear si ya existe
    if (document.querySelector('.mobile-header')) return;

    // Crear header fijo para móvil
    const mobileHeader = document.createElement('div');
    mobileHeader.className = 'mobile-header';
    mobileHeader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: var(--color-bg-primary);
      border-bottom: 1px solid var(--color-border);
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-md);
      z-index: 500;
    `;

    // Botón hamburguesa
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'hamburger-menu';
    toggleBtn.innerHTML = '☰';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Abrir menú');
    toggleBtn.style.cssText = `
      position: static;
      transform: none;
      left: auto;
      top: auto;
      display: flex;
    `;
    
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sidebar = document.querySelector('.sidebar');
      const isActive = sidebar?.classList.toggle('mobile-active');
      
      // Crear overlay si no existe
      let overlay = document.querySelector('.sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', () => {
          sidebar?.classList.remove('mobile-active');
          overlay?.classList.remove('active');
        });
      }
      
      if (isActive) {
        overlay?.classList.add('active');
      } else {
        overlay?.classList.remove('active');
      }
    });

    // Título en el header móvil
    const title = document.createElement('span');
    title.textContent = '🏥 Ecosonografía';
    title.style.cssText = 'font-weight: 700; font-size: 1rem;';

    // Armar el header
    mobileHeader.appendChild(toggleBtn);
    mobileHeader.appendChild(title);
    
    // Insertar al inicio del body
    document.body.insertBefore(mobileHeader, document.body.firstChild);
    
    // Ajustar body y content para dejar espacio para el header móvil
    const content = document.querySelector('.content');
    if (content) {
      content.style.paddingTop = '60px';
    }
    
    console.log('✅ Mobile header creado');
  }

  setNav(items) {
    /**
     * items: array de objetos {label, icon, href, active?, role?}
     * Ejemplo:
     * [{label: 'Dashboard', icon: '📊', href: '/pages/dashboard.html', active: true}]
     */
    const navEl = document.getElementById('main-nav');
    if (!navEl) return;
    
    navEl.innerHTML = '';
    items.forEach(item => {
      // Permitir acceso basado en rol (si está definido)
      if (item.role && this.userRole && !item.role.includes(this.userRole)) {
        return;
      }
      
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = item.href;
      link.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`;
      
      if (item.active) {
        link.classList.add('active');
      }
      
      li.appendChild(link);
      navEl.appendChild(li);
    });
  }

  setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  logout() {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-role');
    localStorage.removeItem('user-name');
    window.location.href = 'login.html';
  }

  loadUserInfo() {
    this.userRole = localStorage.getItem('user-role');
    this.userName = localStorage.getItem('user-name');
  }

  isAuthenticated() {
    return !!localStorage.getItem('auth-token');
  }

  getAuthToken() {
    return localStorage.getItem('auth-token');
  }

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

// Auto-redirigir a login si no autenticado (excepto en login.html)
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPage !== 'login.html' && !layout.isAuthenticated()) {
    window.location.href = 'login.html';
  }
});
