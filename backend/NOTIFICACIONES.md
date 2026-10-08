# Sistema de notificaciones por email

Todas las notificaciones transaccionales de la plataforma salen desde
**`notificaciones@auditoriasenlinea.com.ar`** (configurable en
`NOTIFICATIONS_FROM_EMAIL`). Reutilizan la misma configuración SMTP del sistema
(`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).

> El remitente `notificaciones@...` debe estar verificado en tu proveedor SMTP
> (Resend, SES, etc.) para que los correos no caigan en spam.

## Familias de avisos

### 1. Inmediatos (al ocurrir la acción)

| Evento | Se dispara en | Destinatario |
|---|---|---|
| **Alta de tenant** | `POST /onboarding/register` y `POST /admin/tenants` | Administrador del nuevo tenant |
| **Invitación de miembro** | `POST /tenant/users/invite` | El usuario invitado (con su contraseña temporal) |
| **Auditoría planificada** | `POST /auditorias/programas` | Administradores (Responsable de Calidad/SGI) |
| **Auditoría asignada** | `POST /auditorias/asignaciones` | El auditor de campo asignado |
| **Solicitud de checklist** | `POST /auditorias/asignaciones/{id}/solicitar-checklist` | Administradores del tenant (auditor líder / supervisor) |
| **Enlace de recuperación de contraseña** | `POST /auth/recuperar-password` | La cuenta que lo pidió |
| **Aviso de contraseña cambiada** | `POST /auth/restablecer-password` | La cuenta afectada |

Son funciones síncronas en `app/services/notifications.py` y **nunca lanzan
excepción**: si el correo falla, la operación de negocio se completa igual y el
error queda en el log.

Dos salvedades sobre esa regla:

- **El enlace de recuperación es la excepción que importa.** Ahí el correo no
  acompaña a la operación: *es* la operación. Si no sale, la persona no puede
  entrar. El fallo no se le informa —el mensaje es siempre el mismo, para que
  el formulario no sirva para averiguar qué correos están registrados— así que
  queda sólo en el log, con el texto `NO se pudo enviar`.
- **El correo de auditoría asignada tiene que alcanzar para llegar al lugar**:
  organización, domicilio con enlace al mapa, horario, referente en sitio y
  alcance. Esos datos salen de la ficha de la organización
  (`public.tenants.domicilio`, `telefono`, `contacto_*`) o de la propia
  asignación cuando se audita en otra sede. Sin domicilio cargado el correo
  sale igual, pero sin la mitad que sirve.

### 2. Preventivos ("por vencer") — barrido diario

Un barrido recorre **todos los tenants activos** y le envía a cada responsable
un **resumen** de lo que requiere su atención:

| Evento | Fuente de datos | Umbral (días de anticipación) |
|---|---|---|
| **Calibración por vencer** | `equipos_medicion.fecha_proxima_calibracion` | `NOTIF_CALIBRACION_DIAS` (15) |
| **Mantenimiento programado** | `cmms_ordenes_trabajo.fecha_programada` (estado pendiente/en progreso) | `NOTIF_MANTENIMIENTO_DIAS` (7) |
| **Acción/objetivo por vencer** | `objetivos_sgi.fecha_limite` (progreso < 100%) | `NOTIF_APROBACION_DIAS` (3) |

El destinatario es el **`responsable_id`** del registro; si no tiene, se usa el
primer **administrador** del tenant. Además, los equipos cuya calibración ya
pasó se marcan automáticamente como `estado = "vencido"`.

## Cómo se ejecuta el barrido

Hay dos disparadores (podés usar uno o ambos):

1. **Scheduler interno (APScheduler).** Corre solo, todos los días a las
   `NOTIF_HORA_UTC:00` UTC (por defecto 10:00 UTC ≈ 07:00 Argentina). Se
   controla con `SCHEDULER_ENABLED`. Arranca/para con la app (`main.py`).

2. **Endpoint externo.** `POST /api/v1/cron/notificaciones` con el header
   `X-Cron-Secret: <CRON_SECRET>`. Útil para dispararlo desde un cron del
   sistema, n8n o un uptime-monitor. Si `CRON_SECRET` está vacío, el endpoint
   queda deshabilitado (503).

   ```bash
   curl -X POST https://sgna.auditoriasenlinea.com.ar/api/v1/cron/notificaciones \
        -H "X-Cron-Secret: TU_SECRETO"
   ```

   Devuelve un resumen: tenants procesados, cantidad de avisos por categoría y
   emails enviados.

## Variables de entorno

Ver `.env.example`. Las relevantes:

```
NOTIFICATIONS_FROM_EMAIL=notificaciones@auditoriasenlinea.com.ar
NOTIFICATIONS_ENABLED=true
APP_BASE_URL=https://sgna.auditoriasenlinea.com.ar
PASSWORD_RESET_TTL_MINUTES=120      # vigencia del enlace de recuperación
PASSWORD_RESET_THROTTLE_SECONDS=120 # espera mínima entre dos pedidos
NOTIF_CALIBRACION_DIAS=15
NOTIF_MANTENIMIENTO_DIAS=7
NOTIF_APROBACION_DIAS=3
SCHEDULER_ENABLED=true
NOTIF_HORA_UTC=10
CRON_SECRET=            # definilo si vas a usar el disparo externo
```

## Notas

- Si `SMTP_HOST` no está configurado, los correos **no se envían**: se registra
  el contenido completo en el log (fallback para desarrollo). Eso requiere
  `LOG_LEVEL=INFO` —el valor por defecto—: uvicorn deja el logger raíz en
  `WARNING`, así que hasta que `app/main.py` configuró el logging, ese
  "fallback" no mostraba nada.
- Para desactivar todos los avisos sin tocar SMTP: `NOTIFICATIONS_ENABLED=false`.
- El barrido es multiempresa: itera por `search_path` de cada schema
  `tenant_<slug>`, respetando el aislamiento de datos.
