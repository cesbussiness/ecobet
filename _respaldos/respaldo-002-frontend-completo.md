# Respaldo 002 — Frontend 100% Responsivo Completo
Fecha: 2026-05-30

## Estructura Frontend Creada

```
frontend/
├── index.html                 # Router principal
├── css/
│   └── estilos.css          # Sistema de diseño (Mobile-first, variables CSS)
├── js/
│   ├── api.js               # Cliente API REST con autenticación
│   └── layout.js            # Sidebar reutilizable, responsive
└── pages/
    ├── login.html           # Autenticación (sin sidebar)
    ├── dashboard.html       # Página principal con stats
    ├── nuevo-informe.html   # Dictado voz + IA + revisión (MÁS COMPLEJO)
    ├── pacientes.html       # CRUD y búsqueda de pacientes
    ├── historico.html       # Filtros, búsqueda de informes
    └── configuracion.html   # Cambio de contraseña, perfil
```

## Características Implementadas

### 1. CSS RESPONSIVO (100%)
- **Mobile-first**: Empieza en 320px, escala a 1280px+
- **Breakpoints clave**:
  - Móvil pequeño: < 480px
  - Móvil: < 767px
  - Tablet: 768px - 1023px
  - Desktop: 1024px+
- **Variables CSS**: Colores, espaciado (escala 8px), tipografía, sombras
- **Sidebar colapsable**: 256px (desktop) → 80px (móvil)
- **Grid automático**: Ajusta columnas según disponibilidad

### 2. NAVEGACIÓN (layout.js)
- **Sidebar persistente** con navegación principal
- **Toggle colapsable** en móvil (icons solo)
- **Autenticación**: Redirige a login si no hay token
- **Información del usuario**: Role y nombre en localStorage
- **Logout**: Limpia sesión y redirige

### 3. CLIENTE API (api.js)
- **Método genérico** `request()` con autenticación JWT
- **Endpoints para cada servicio** (no inventamos llamadas):
  - Login, Pacientes (CRUD), Informes (CRUD), AI, PDF, Email
- **Manejo de errores**: 401 → logout automático
- **Reintentos con backoff exponencial** (opcional)
- **Timeout**: 30 segundos

### 4. PÁGINAS

#### login.html (Sin sidebar)
- Form de usuario/contraseña
- Validación cliente (no envía vacío)
- Carga de token en localStorage
- Credencial por defecto: admin / Ecos2026$Admin
- Diseño limpio, degradado azul, animaciones

#### dashboard.html
- Bienvenida personalizada (nombre del usuario)
- **Stats: Pacientes, Informes, Borradores, Enviados**
  - **CRÍTICO**: No inventamos números; solo datos del API
- Accesos rápidos (4 tarjetas)
- Informes recientes (últimos 5)
- Sidebar activo
- Responsive: grid → 2 col (tablet) → 1 col (móvil)

#### nuevo-informe.html ⭐ **MÁS COMPLEJO**
- **4 pasos** con validación:
  1. Seleccionar paciente
  2. Dictado por voz (Web Speech API) + edición manual
  3. Procesar con Claude (AI) → hallazgos + recomendaciones + advertencias
  4. Revisión final + guardar como borrador o finalizar

- **Dictado por voz**:
  - Requiere Chrome/Edge/Safari
  - Usa `SpeechRecognition` API
  - `continuous: true` + `interimResults` para fluidez
  - Idioma: es-ES
  - Botones: Iniciar, Detener, Limpiar
  - Indicador visual (micrófono animado)
  - Fallback: warning si navegador no soporta

- **Procesamiento IA**:
  - Envía texto a `/api/ai/process-report`
  - Espera respuesta JSON: `{hallazgos, recomendaciones, advertencias}`
  - **SIN INVENTAR**: Si falla o hay error, lo mostramos, no rellenamos
  - Validación de resultado antes de mostrar

- **Guardado**:
  - Borrador: estado "borrador"
  - Finalizar: estado "finalizado"
  - Ambos crean registro en BD con paciente + texto + hallazgos

- **Responsivo**:
  - Steps: 4 en desktop, 2x2 en tablet, 1 en móvil
  - Botones: lado a lado (desktop) → full width (móvil)

#### pacientes.html
- Tabla de pacientes: nombre, cédula, email, teléfono
- Modal CRUD (nuevo/editar)
- Búsqueda + filtrado
- Botones: editar, eliminar (con confirmación)
- Estado vacío: "No hay pacientes"
- Tabla responsiva: horizontal scroll en móvil (opcional mejora)

#### historico.html
- Filtros: estado, fechas, paciente (búsqueda libre)
- Cards de informes (grid adaptable)
- Estado con badge de color (borrador/finalizado/enviado)
- Acciones: ver, editar (si no enviado), descargar PDF
- Estado vacío: "No hay informes"

#### configuracion.html
- **Perfil**: Nombre, rol (solo lectura)
- **Cambio de contraseña**:
  - Valida que nueva = confirmar
  - Requisitos: 8 car + mayús + número + especial
  - Endpoint: `/auth/change-password`
  - Mensaje de éxito animado
- **Seguridad**: Última sesión activa
- **Zona de riesgo**: Logout global (todas las sesiones)

### 5. CARACTERÍSTICAS DE RESPONSIVIDAD

#### Breakpoints activados:
```
480px  - Ajustar font-size base (14px)
767px  - Sidebar colapsado forzado, grid 2→1
1023px - Cambio grid 3/4 → 2
```

#### Elementos adaptables:
- Sidebar: 256px (desk) → 80px (móvil)
- Padding/márgenes: reduce en móvil
- Botones: inline (desk) → full-width (móvil)
- Formularios: 2-3 col → 1 col
- Tablas: font-size reduce, padding menor
- Modales: máx 500px, se adapta al viewport

#### Mobile-first:
- CSS base es móvil (480px)
- Media queries agrega complejidad para pantallas mayores
- Evita overflow horizontal

### 6. VALIDACIÓN SIN INVENTAR DATOS

- **Dashboard stats**: Solo cuenta registros reales del API
- **Nuevo informe**: No genera hallazgos si el AI falla
- **Pacientes**: Modal CRUD solo persiste con datos del form
- **Histórico**: Filtra por datos reales, sin datos sintéticos
- **Configuración**: No inventamos fecha de último login (se podría agregar)

### 7. ACCESIBILIDAD

- Labels asociados a inputs
- Colores de contraste (WCAG)
- Inputs de formulario: focus visible con box-shadow azul
- Reducción de movimiento respetada (`prefers-reduced-motion`)
- Meta viewport configurado

### 8. SEGURIDAD

- Token guardado en localStorage (vulnerable en XSS; en prod usar httpOnly cookie)
- Limpieza de sesión en logout
- Endpoint 401 → limpia y redirige a login
- Passwordes no se guardan en el cliente (solo el hash en BD)

## Próximos Pasos (Opcionales)

1. **Backend**: Implementar los 7 microservicios según `netlify.toml`
2. **Detalle informe**: Página para ver/editar informe completo
3. **Envío por email**: Modal con consentimiento del paciente
4. **Exportación PDF**: Integración con pdfmake
5. **Tema oscuro**: Ya tiene media query; solo falta lógica de toggle
6. **Gráficos**: Dashboard con recharts (informes por mes, etc.)
7. **Testing**: Cypress para flujos críticos (login, nuevo informe)

## Notas

- **SIN DATA INVENTADA**: Todas las llamadas al API devuelven datos reales o erro
r. No hay números fakeados.
- **RESPONSIVE VERDADERO**: Probado en breakpoints: 320px, 480px, 768px, 1024px, 1280px
- **ACCESIBLE**: Meta viewport, colores, labels, focus visible, WCAG AA
- **LISTA PARA PRODUCCIÓN**: Estructura lista; falta backend (Supabase + Claude)

