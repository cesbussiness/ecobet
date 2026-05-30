#!/bin/bash
# Script para copiar handlers de services/ a netlify/functions/

set -e

echo "🔨 Building Netlify Functions..."

# Crear directorio destino
mkdir -p netlify/functions

# Copiar cada handler con el nombre correcto
echo "  → auth.js"
cp services/auth-service/src/handler.js netlify/functions/auth.js

echo "  → ai-process.js"
cp services/ai-service/src/handler.js netlify/functions/ai-process.js

echo "  → patients.js"
cp services/patient-service/src/handler.js netlify/functions/patients.js

echo "  → reports.js"
cp services/report-service/src/handler.js netlify/functions/reports.js

echo "  → pdf-generate.js"
cp services/pdf-service/src/handler.js netlify/functions/pdf-generate.js

echo "  → email-send.js"
cp services/email-service/src/handler.js netlify/functions/email-send.js

echo ""
echo "✅ Funciones copiadas a netlify/functions/"
echo ""
ls -lh netlify/functions/
