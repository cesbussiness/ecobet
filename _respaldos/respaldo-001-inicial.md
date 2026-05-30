# Respaldo 001 — Inicial
Fecha: 2026-05-30

## Reglas del proyecto acordadas

1. **Respaldo ("respalda c")**: respaldar todo lo conversado o actualizar lo
   existente, en carpeta aparte del código (`_respaldos/`). No se sube a Netlify
   ni se compila con el programa.
2. **Token de Git**: si el usuario sube un token, Claude se conecta y hace push.
   Es responsabilidad del usuario; autoriza a los chats del proyecto a hacer push.
   Usuario y equipo son responsables y dueños del repo.
3. **Datos (crítico)**: no inventar nada. Solo datos proporcionados o descargados.
   Información médica delicada. Sin fallback inventado: ante fallo o falta de dato,
   dar error y detener.

## Estado del repositorio

- Repo: github.com/cesbussiness/ecobet (confirmado por el usuario)
- Estado inicial: vacío.
- Archivos cargados e incorporados: README.md, netlify.toml,
  scripts-build-functions.sh, .env.example, .gitignore

## Proyecto

Sistema Inteligente de Informes de Ecosonografía.
Arquitectura de microservicios sobre Supabase + Netlify Functions + Claude API,
con frontend de páginas individuales. (Detalle completo en README.md)

## Pendiente

- Construir database/, services/ y frontend/ según el README.
- Recordatorio de seguridad: revocar y regenerar el token de Git tras el trabajo.
