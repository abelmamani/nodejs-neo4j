# Neo4j Daily Cleanup Automation

Automatización diaria para limpieza de fechas de calendario en Neo4j con reportes por email.

## 🚀 Características

- Limpieza automática diaria de fechas pasadas
- Reporte por email del servicio del día
- Configuración mediante GitHub Actions
- Notificaciones en caso de error

## ⚙️ Configuración

1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Copia `.env.example` a `.env`
4. Configura las variables de entorno en `.env`

## 🔧 GitHub Secrets

Configura estos secrets en tu repositorio de GitHub:

- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
- `EMAIL_TO`

## 🕐 Programación

Se ejecuta automáticamente todos los días a las 00:01 UTC