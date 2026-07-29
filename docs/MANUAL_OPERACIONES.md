# Manual de Operaciones — AuditoríasEnLínea (SGNA)

> Guía operativa para desplegar, configurar, mantener y diagnosticar la plataforma.
> Para el contexto funcional ver [`FLUJO_DE_NEGOCIO.md`](./FLUJO_DE_NEGOCIO.md).

---

## 1. Arquitectura de la plataforma

```mermaid
flowchart TB
    subgraph Edge
        NG[nginx :80/:443<br/>reverse proxy]
    end
    subgraph App
        FE[frontend Next.js :3000<br/>NextAuth + UI]
        API[api FastAPI :8000<br/>lógica de negocio + multi-tenant]
        MCP[mcp-server :3001<br/>herramientas IA]
    end
    subgraph Datos
        PG[(PostgreSQL :5432<br/>public + tenant_slug)]
        RD[(Redis :6379<br/>códigos 2FA)]
        S3[(MinIO :9000/:9001<br/>buckets tenant-slug)]
    end

    NG --> FE
    NG --> API
    FE -->|REST /api/v1| API
    MCP -->|REST /api/v1/ia| API
    API --> PG
    API --> RD
    API --> S3
```

**Componentes** (ver `docker-compose.yml`):

| Servicio | Imagen | Puerto | Rol |
|----------|--------|--------|-----|
| `nginx` | `nginx:alpine` | 80/443 | Reverse proxy / TLS |
| `frontend` | `ghcr.io/pel-matiasvaldivia/sgna/frontend` | 3000 | UI + sesión (NextAuth) |
| `api` | `ghcr.io/pel-matiasvaldivia/sgna/backend` | 8000 | API REST FastAPI |
| `mcp-server` | `ghcr.io/pel-matiasvaldivia/sgna/mcp-server` | 3001 | Herramientas IA (MCP) |
| `postgres` | `postgres:16-alpine` | 5432 | Base de datos multi-tenant |
| `redis` | `redis:7-alpine` | 6379 | Almacén de códigos 2FA |
| `minio` | `minio/minio` | 9000/9001 | Almacenamiento de objetos |

**Stack:** Backend FastAPI + SQLAlchemy 2.0 + Alembic · Frontend Next.js 14 (App Router) +
NextAuth · MCP con `@modelcontextprotocol/sdk`.

---

## 2. Modelo de aislamiento multi-tenant

- **Esquema `public`**: tablas compartidas `tenants` y `users`.
- **Esquema `tenant_{slug}`**: las 36 tablas del SGI, una copia por cliente.
- En cada request autenticado, `get_tenant_db` ejecuta `SET search_path TO "tenant_{slug}", public`
  a partir del `tenant` que viaja en el JWT.
- **Objetos**: un bucket `tenant-{slug}` por cliente en MinIO/S3.
- El aprovisionamiento (`provision_tenant_schema`) crea el esquema, ejecuta
  `Base.metadata.create_all`, aplica migraciones dinámicas puntuales (columnas de
  `riesgos_oportunidades`) y asegura el bucket.

> ⚠️ Los modelos `User` y `Tenant` fijan `__table_args__ = {"schema": "public"}`, por lo que
> `create_all` los mantiene siempre en `public` aunque el `search_path` apunte al tenant.
> Solo las tablas del SGI (sin esquema explícito) se crean dentro de `tenant_{slug}`.

---

## 3. Variables de entorno

Copiar `.env.example` a `.env` y completar. Claves relevantes:

| Variable | Consumidor | Descripción |
|----------|-----------|-------------|
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | frontend | Base y secreto de NextAuth |
| `API_URL` → `NEXT_PUBLIC_API_URL` | frontend | URL pública del backend |
| `JWT_SECRET` | api | Firma de los JWT (HS256) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | postgres/api | Credenciales de la base |
| `REDIS_PASSWORD` | redis/api | Password de Redis (obligatorio, ver §8) |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | minio/api | Credenciales de objetos |
| `SMTP_HOST/PORT/USER/PASS` · `FROM_EMAIL` | api | Servidor SMTP y remitente de 2FA/comercial (ver §4) |
| `NOTIFICATIONS_FROM_EMAIL` · `NOTIFICATIONS_ENABLED` | api | Remitente y switch de las notificaciones del sistema (ver §4) |
| `APP_BASE_URL` | api | URL pública usada en los enlaces de los correos |
| `NOTIF_*_DIAS` · `SCHEDULER_ENABLED` · `NOTIF_HORA_UTC` · `CRON_SECRET` | api | Barrido preventivo "por vencer" (ver §4) |
| `ANTHROPIC_API_KEY` → `MCP_CLAUDE_API_KEY` | mcp/api | Clave del proveedor de IA |

**Mapeo de nombres (importante):** el backend (`app/core/config.py`) lee
`MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` y `REDIS_URL`. En
`docker-compose.yml` estas se derivan de las variables de `.env`:

```yaml
- REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
- MINIO_ENDPOINT=http://minio:9000
- MINIO_ACCESS_KEY=${MINIO_ROOT_USER}
- MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
```

> Si se renombran estas variables sin respetar los nombres que espera `Settings`
> (`case_sensitive=True`, `extra='ignore'`), la app usa **defaults** (`localhost:9000`) y las
> subidas a MinIO fallan silenciosamente.

---

## 4. Configuración de correo y notificaciones

La plataforma usa el correo para tres propósitos, **todos sobre la misma
configuración SMTP** (`app/services/email_service.py`):

| Propósito | Remitente | Variable |
|-----------|-----------|----------|
| Código 2FA de login | `FROM_EMAIL` | `FROM_EMAIL` |
| Avisos comerciales (demos) | `FROM_EMAIL` / `SALES_EMAIL` | `SALES_EMAIL` |
| **Notificaciones del sistema** | **`notificaciones@auditoriasenlinea.com.ar`** | `NOTIFICATIONS_FROM_EMAIL` |

### 4.1 SMTP base

```bash
SMTP_HOST=smtp.resend.com      # host del proveedor (Resend, SES, etc.)
SMTP_PORT=587                  # 587 = STARTTLS · 465 = SSL
SMTP_USER=resend               # usuario / API user
SMTP_PASS=***                  # password / API key
FROM_EMAIL=noreply@auditoriasenlinea.com.ar
```

> **Verificación de dominio.** Los remitentes (`FROM_EMAIL` y
> `NOTIFICATIONS_FROM_EMAIL`) deben estar verificados en el proveedor SMTP y el
> dominio debe tener **SPF, DKIM y DMARC** configurados; de lo contrario los
> correos caen en spam o son rechazados.

Podés probar la configuración SMTP de un tenant desde
`POST /api/v1/tenant/smtp/test`, que hace una conexión + login + envío real y
devuelve un diagnóstico legible (nunca lanza 500).

> Si `SMTP_HOST` queda vacío, **no se envía ningún correo**: el contenido completo
> se registra en el log del contenedor `api` (fallback para desarrollo).

### 4.2 Notificaciones del sistema

Todas salen desde `NOTIFICATIONS_FROM_EMAIL` y se agrupan en dos familias
(detalle funcional en [`backend/NOTIFICACIONES.md`](../backend/NOTIFICACIONES.md)).

**Inmediatas** — se disparan en el momento de la acción:

| Evento | Endpoint | Destinatario |
|--------|----------|--------------|
| Alta de tenant | `POST /onboarding/register`, `POST /admin/tenants` | Administrador del tenant |
| Invitación de miembro | `POST /tenant/users/invite` | Usuario invitado (con contraseña temporal) |
| Auditoría planificada | `POST /auditorias/programas` | Responsables de Calidad/SGI (admins) |
| Auditoría asignada | `POST /auditorias/asignaciones` | Auditor de campo |

**Preventivas ("por vencer")** — un barrido diario recorre todos los tenants
activos y envía a cada responsable un resumen de lo que requiere atención:

| Evento | Fuente | Umbral (días) |
|--------|--------|---------------|
| Calibración por vencer | `equipos_medicion.fecha_proxima_calibracion` | `NOTIF_CALIBRACION_DIAS` (15) |
| Mantenimiento programado | `cmms_ordenes_trabajo.fecha_programada` | `NOTIF_MANTENIMIENTO_DIAS` (7) |
| Acción/objetivo con fecha límite | `objetivos_sgi.fecha_limite` | `NOTIF_APROBACION_DIAS` (3) |

Variables de control:

```bash
NOTIFICATIONS_FROM_EMAIL=notificaciones@auditoriasenlinea.com.ar
NOTIFICATIONS_ENABLED=true                 # false = apaga todos los avisos
APP_BASE_URL=https://sgna.auditoriasenlinea.com.ar   # enlaces de los correos
NOTIF_CALIBRACION_DIAS=15
NOTIF_MANTENIMIENTO_DIAS=7
NOTIF_APROBACION_DIAS=3
```

### 4.3 Ejecución del barrido preventivo

Dos disparadores (podés usar uno o ambos):

1. **Scheduler interno (APScheduler).** Arranca junto con la API (evento
   `startup` en `app/main.py`) y corre todos los días a las `NOTIF_HORA_UTC:00`
   UTC. Se controla con `SCHEDULER_ENABLED`. Si APScheduler no está instalado,
   la app arranca igual y solo queda disponible el disparo externo.

   ```bash
   SCHEDULER_ENABLED=true
   NOTIF_HORA_UTC=10        # 10:00 UTC ≈ 07:00 America/Argentina
   ```

2. **Endpoint externo.** Para dispararlo desde un cron del sistema, n8n o un
   uptime-monitor. Protegido por el header `X-Cron-Secret`, que debe coincidir
   con `CRON_SECRET`. Si `CRON_SECRET` queda vacío, el endpoint responde 503.

   ```bash
   curl -X POST https://sgna.auditoriasenlinea.com.ar/api/v1/cron/notificaciones \
        -H "X-Cron-Secret: $CRON_SECRET"
   ```

   Devuelve un resumen JSON: tenants procesados, avisos por categoría, equipos
   marcados como `vencido` y emails enviados.

> El barrido es **multiempresa**: itera por el `search_path` de cada esquema
> `tenant_{slug}` respetando el aislamiento de datos, y marca automáticamente
> como `vencido` los equipos cuya calibración ya pasó.

---

## 5. Despliegue

### 5.1 Con Docker Compose (recomendado)

```bash
cp .env.example .env      # y completar valores reales
docker compose pull       # imágenes desde ghcr.io
docker compose up -d
docker compose ps         # verificar salud
```

Orden de arranque garantizado por `depends_on` + healthchecks: `postgres`/`redis`/`minio`
→ `api` → `frontend`/`mcp-server` → `nginx`.

### 5.2 Secuencia de arranque del backend

El contenedor `api` ejecuta en su `CMD`:

```mermaid
flowchart LR
    A[alembic upgrade head] --> B[python -m app.db.seed_superadmin] --> C[uvicorn app.main:app]
```

1. **`alembic upgrade head`** — aplica migraciones (crea columnas SMTP/límites y
   `two_factor_enabled` en `public.tenants`).
2. **`seed_superadmin`** — crea/actualiza el usuario `gerencia@auditoriasenlinea.com.ar`
   y garantiza la columna `two_factor_enabled` (idempotente).
3. **`uvicorn`** — levanta la API. En el evento `startup` arranca el **scheduler
   de notificaciones preventivas** si `SCHEDULER_ENABLED=true` (ver §4.3).

> Las tablas base `public.tenants`/`public.users` se crean en el **primer arranque de
> PostgreSQL** vía `db/init/00_create_base_schema.sql` (montado en
> `/docker-entrypoint-initdb.d`). Ese script solo corre con el volumen de datos vacío.

### 5.3 Build local de imágenes

```bash
docker build -t sgna/backend  ./backend
docker build -t sgna/frontend ./frontend
docker build -t sgna/mcp      ./mcp-server
```

El workflow `.github/workflows/docker-build.yml` publica las imágenes en GHCR.

---

## 6. Operación de la base de datos

### 6.1 Migraciones (Alembic)

```bash
# dentro del contenedor api (o con DATABASE_URL exportada)
alembic upgrade head              # aplicar
alembic downgrade -1              # revertir la última
alembic revision -m "descripcion" # nueva migración
alembic current                   # revisión aplicada
```

`alembic/env.py` toma la URL de `settings.DATABASE_URL` (ignora la de `alembic.ini`).

### 6.2 Respaldo y restauración

```bash
# Backup completo (todos los esquemas: public + tenant_*)
docker compose exec postgres pg_dump -U "$DB_USER" "$DB_NAME" > backup_$(date +%F).sql

# Backup de un tenant puntual
docker compose exec postgres pg_dump -U "$DB_USER" -n "tenant_<slug>" "$DB_NAME" > tenant_slug.sql

# Restore
cat backup.sql | docker compose exec -T postgres psql -U "$DB_USER" "$DB_NAME"
```

MinIO: respaldar el volumen `minio_data` o usar `mc mirror` sobre los buckets `tenant-*`.

### 6.3 Inspección rápida

```bash
# Listar esquemas de tenants
docker compose exec postgres psql -U "$DB_USER" "$DB_NAME" -c "\dn"
# Contar tablas por esquema
docker compose exec postgres psql -U "$DB_USER" "$DB_NAME" \
  -c "SELECT table_schema, count(*) FROM information_schema.tables GROUP BY 1;"
```

---

## 7. Administración operativa (Superadmin)

Endpoints bajo `/api/v1/admin` (requieren rol `superadmin`):

| Acción | Endpoint |
|--------|----------|
| Alta de tenant | `POST /admin/tenants` |
| Listar tenants | `GET /admin/tenants` |
| Activar/desactivar 2FA | `PUT /admin/tenants/{id}/toggle-2fa` |
| Suspender/reactivar | `PUT /admin/tenants/{id}/suspend` |
| Eliminar (drop schema) | `DELETE /admin/tenants/{id}` |
| Métricas globales | `GET /admin/metrics` |

Administración por tenant (`/api/v1/tenant`, rol `admin`): configurar SMTP, invitar usuarios
(`POST /tenant/users/invite`, genera password temporal), activar/desactivar usuarios.

Documentación interactiva de la API: **`/api/v1/docs`** (Swagger) y **`/api/v1/redoc`**.
Health check: **`GET /health`**.

---

## 8. Resolución de incidentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Todo request de tenant devuelve 500 al aprovisionar | FK inválida en un modelo hace fallar `create_all` | Revisar que todos los `ForeignKey` apunten a tablas existentes (`documents`, no `documentos`). Reproducir con `provision_tenant_schema` en un Postgres de prueba. |
| Subidas de archivos fallan / `localhost:9000` | Nombres de env S3 no coinciden con `MINIO_*` | Usar `MINIO_ENDPOINT/ACCESS_KEY/SECRET_KEY` (ver §3). |
| 2FA no persiste entre instancias | Redis sin autenticar → cae al store en memoria | Incluir password en `REDIS_URL`: `redis://:PASS@redis:6379/0`. |
| Login 500 "column two_factor_enabled does not exist" | Migración no aplicada / seed no corrió | Verificar que el `CMD` ejecute `alembic upgrade head` y `seed_superadmin`. |
| No existe usuario para entrar en un deploy nuevo | Seed no ejecutado | Correr `python -m app.db.seed_superadmin`. |
| No se puede leer el código 2FA en pruebas | — | El código **siempre** se imprime en el log del contenedor `api`. |
| Ningún correo llega (2FA ni notificaciones) | `SMTP_HOST` vacío o credenciales inválidas | El contenido queda en el log del `api`. Revisar SMTP y probar con `POST /tenant/smtp/test` (ver §4). |
| Notificaciones no llegan pero el 2FA sí | Remitente `NOTIFICATIONS_FROM_EMAIL` no verificado, o `NOTIFICATIONS_ENABLED=false` | Verificar el remitente en el proveedor (SPF/DKIM/DMARC) y el switch (ver §4.2). |
| Los avisos "por vencer" no se envían | Scheduler apagado y sin cron externo | `SCHEDULER_ENABLED=true`, o disparar `POST /cron/notificaciones` con `X-Cron-Secret` (ver §4.3). |

Comandos útiles:

```bash
docker compose logs -f api           # ver códigos 2FA / errores / envío de correos
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" ping
curl -f http://localhost:8000/health
# Forzar el barrido preventivo de notificaciones (si CRON_SECRET está configurado)
curl -X POST http://localhost:8000/api/v1/cron/notificaciones -H "X-Cron-Secret: $CRON_SECRET"
```

---

## 9. Seguridad — notas y backlog

Puntos vigentes a endurecer antes de producción real:

- **CORS abierto**: `app/main.py` usa `allow_origins=["*"]` con `allow_credentials=True`
  (marcado con `# TODO`). Restringir a los orígenes del frontend.
- **Credenciales del Superadmin**: `seed_superadmin.py` fija email y password por defecto y
  los reescribe en cada arranque. Rotar el password y gestionarlo como secreto.
- **Bypass de 2FA**: el código constante `"BYPASS"` se genera tras validar la contraseña en
  `/auth/login`; evitar exponer `verify-2fa` a códigos constantes fuera de ese flujo.
- **`search_path` en pool**: el aislamiento por request se apoya en `SET search_path`; validar
  que no haya fugas entre conexiones reutilizadas bajo alta concurrencia.
- **Endpoint de impersonación** (`POST /admin/tenants/{id}/impersonate`): actualmente invoca
  `create_access_token(data=..., expires_delta=...)`, pero la firma real es
  `create_access_token(subject, tenant_slug, role, expires_delta)`. La llamada falla con
  `TypeError` → **el endpoint no funciona**. Corregir la invocación antes de usarlo.

---

## 10. Referencias del repositorio

```
backend/    API FastAPI (app/api, app/models, app/services, alembic)
frontend/   Next.js 14 (src/app dashboard + auth)
mcp-server/ Servidor MCP con herramientas de IA
db/init/    SQL de bootstrap del esquema público
nginx/      Configuración del reverse proxy
docker-compose.yml   Orquestación de todos los servicios
```
