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
    const mediaQuery = window.matchMedia('(max-width: 479px)');
    const handleMediaChange = (e) => {
      const sidebar = document.querySelector('.sidebar');
      const content = document.querySelector('.content');
      
      if (e.matches) {
        // Móvil pequeño (<480px): sidebar oculto por defecto
        sidebar?.classList.add('mobile-hidden');
        content?.classList.add('sidebar-mobile-hidden');
        
        // Crear botón hamburguesa si no existe
        if (!document.querySelector('.hamburger-menu')) {
          this.createMobileToggle();
        }
      } else {
        // Desktop/tablet: usar estado guardado
        sidebar?.classList.remove('mobile-hidden');
        content?.classList.remove('sidebar-mobile-hidden');
        
        if (this.sidebarCollapsed) {
          sidebar?.classList.add('collapsed');
          content?.classList.add('sidebar-collapsed');
        } else {
          sidebar?.classList.remove('collapsed');
          content?.classList.remove('sidebar-collapsed');
        }
      }
    };
    
    mediaQuery.addListener(handleMediaChange);
    handleMediaChange(mediaQuery);
  }

  createMobileToggle() {
    // Crear botón hamburguesa para móvil
    // Esperar a que el sidebar exista
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
      // Reintentar después de que se cree el sidebar
      setTimeout(() => this.createMobileToggle(), 100);
      return;
    }

    const header = sidebar.querySelector('.sidebar-header');
    if (!header) return;

    // No crear si ya existe
    if (header.querySelector('.hamburger-menu')) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'hamburger-menu';
    toggleBtn.innerHTML = '☰';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Abrir menú');
    toggleBtn.style.cssText = `
      position: absolute;
      left: var(--space-md);
      top: 50%;
      transform: translateY(-50%);
    `;
    
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sidebar = document.querySelector('.sidebar');
      sidebar?.classList.toggle('mobile-active');
      
      // Crear overlay si no existe
      let overlay = document.querySelector('.sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay active';
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', () => {
          sidebar?.classList.remove('mobile-active');
          overlay?.classList.remove('active');
        });
      } else {
        overlay.classList.toggle('active');
      }
    });

    header.insertBefore(toggleBtn, header.firstChild);
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
