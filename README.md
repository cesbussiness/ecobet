# Sistema Inteligente de Informes de Ecosonografía

Arquitectura de **microservicios** sobre Supabase + Netlify Functions + Claude API, con frontend de páginas individuales.

---

## Estructura del proyecto

```
ecos-system/
├── database/
│   ├── migrations/
│   │   ├── 001_schema.sql      # Tablas: usuarios, medicos, pacientes, informes
│   │   └── 002_rls.sql         # Row Level Security (OBLIGATORIO)
│   └── seeds/
│       └── 001_seed.sql        # Usuario admin por defecto
├── services/                   # Microservicios (Netlify Functions)
│   ├── auth-service/           # Login + JWT (bcrypt)
│   ├── ai-service/             # Estructuración con Claude (prompt mejorado)
│   ├── patient-service/        # CRUD y búsqueda de pacientes
│   ├── report-service/         # Crear / actualizar / leer informes
│   ├── pdf-service/            # Generación de PDF tamaño carta (pdfmake)
│   └── email-service/          # Envío SMTP Google (Nodemailer)
├── frontend/
│   ├── index.html              # Entrada (redirige según sesión)
│   ├── css/estilos.css         # Sistema de diseño compartido
│   ├── js/
│   │   ├── api.js              # Cliente API (token, llamadas)
│   │   └── layout.js           # Sidebar reutilizable
│   └── pages/                  # Una página por función
│       ├── login.html
│       ├── dashboard.html
│       ├── nuevo-informe.html  # Dictado por voz + IA + PDF
│       ├── pacientes.html
│       ├── historico.html      # Filtro por fechas
│       ├── configuracion.html
│       └── enviar.html
├── netlify.toml                # Rutas /api/* → funciones
├── scripts-build-functions.sh  # Copia handlers a netlify/functions/
└── .env.example                # Plantilla de variables de entorno
```

## Credenciales por defecto

| Usuario | Contraseña       | Rol   |
|---------|------------------|-------|
| `admin` | `Ecos2026$Admin` | admin |

La contraseña se guarda como **hash bcrypt (cost 12)**, nunca en texto plano. El sistema obliga a cambiarla en el primer ingreso.

## Mejoras aplicadas frente a la especificación original

1. **Esquema de BD**: `id uuid` como PK en `pacientes`; la cédula pasa a `unique not null` (evita acoplar las claves foráneas a un dato editable).
2. **Seguridad**: RLS activado en las cuatro tablas con políticas por médico autenticado.
3. **Modelo de IA**: `claude-3-5-sonnet-20241022` (retirado en enero 2026) reemplazado por `claude-sonnet-4-6`. Verificar el identificador vigente en docs.claude.com antes de desplegar.
4. **Prompt**: fuerza JSON estricto, prohíbe inventar hallazgos, maneja incertidumbre, separa rol de datos (mitiga inyección de prompt) y añade un campo `advertencias`.
5. **Backend AI**: valida y parsea el JSON antes de devolverlo al cliente (tolera fences de markdown).
6. **Credenciales SMTP**: solo en variables de entorno (App Password), nunca en la base de datos.
7. **Informes**: campo `estado` (borrador/finalizado/enviado) y `updated_at` automático.
8. **Dictado**: el texto crudo es editable antes de procesar, y el reconocimiento se reanuda automáticamente.

## Despliegue

1. **Base de datos**: ejecutar en Supabase, en orden: `001_schema.sql`, `002_rls.sql`, `001_seed.sql`.
2. **Variables de entorno**: copiar `.env.example` y configurar en Netlify (Site settings → Environment variables).
3. **Funciones**: ejecutar `bash scripts-build-functions.sh` para copiar los handlers a `netlify/functions/`, luego `netlify deploy`.
4. **Frontend**: Netlify publica la carpeta `frontend/`.

## Notas de seguridad clínica

- Los datos manejados son información médica identificable. El envío por correo debe consentirse con el paciente.
- Las políticas RLS asumen Supabase Auth; si se usa el `auth-service` propio con `service_role`, ese rol bypasea RLS y la protección recae en la validación del JWT en cada microservicio.
- El reconocimiento de voz depende del navegador (Chrome) y tiene error en terminología médica; por eso el paso de corrección por IA y la edición manual del dictado crudo son obligatorios antes de finalizar.
