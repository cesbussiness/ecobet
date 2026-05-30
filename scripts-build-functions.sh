#!/usr/bin/env bash
# Copia los handlers de cada microservicio a la carpeta de funciones de Netlify
set -e
mkdir -p netlify/functions
cp services/auth-service/src/handler.js     netlify/functions/auth.js
cp services/ai-service/src/handler.js       netlify/functions/ai-process.js
cp services/ai-service/src/prompt.js        netlify/functions/prompt.js
cp services/email-service/src/handler.js    netlify/functions/email-send.js
cp services/pdf-service/src/handler.js      netlify/functions/pdf-generate.js
cp services/patient-service/src/handler.js  netlify/functions/patients.js
cp services/report-service/src/handler.js   netlify/functions/reports.js
echo "Funciones copiadas a netlify/functions/"
