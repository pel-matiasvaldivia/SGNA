# Auto-gestión del plan de marketing con n8n

Este paquete automatiza la publicación diaria del plan de contenidos de
**Auditorías en Línea** en redes sociales, usando [n8n](https://n8n.io).

## Archivos
- `n8n-workflow-auditorias-en-linea.json` — workflow importable en n8n.
- `calendario-n8n.csv` — el calendario de 30 días, listo para subir a Google Sheets.
- `plan-marketing-auditorias-en-linea.xlsx` — el plan completo (estrategia + calendario).
- `piezas/` — las 30 piezas gráficas (1080×1080) para cada post.

## Cómo funciona
```
Cada día 09:00  →  Leer calendario (Google Sheets)  →  Elegir post de hoy
   →  ¿Hay post?  →  Publicar en LinkedIn + Facebook
   →  Marcar la fila como "Publicado"  →  Avisar al equipo por email
```
El nodo **Elegir post de hoy** busca la fila cuya `Fecha` = hoy (dd/mm/aaaa) y
cuyo `Estado` ≠ *Publicado*. Si no hay, el flujo no publica nada.

## Instalación (paso a paso)
1. **Google Sheets**
   - Creá una hoja nueva e importá `calendario-n8n.csv`.
   - Renombrá la pestaña a **Calendario** (así la busca el workflow).
   - Copiá el **ID de la hoja** (está en la URL, entre `/d/` y `/edit`).

2. **Importar el workflow**
   - En n8n: *Workflows → Import from File* → elegí el `.json`.

3. **Pegar el ID de la hoja**
   - Abrí los nodos **Leer calendario** y **Marcar como Publicado** y reemplazá
     `TU_GOOGLE_SHEET_ID` por el ID real.

4. **Credenciales** (Credentials → New)
   - **Google Sheets** (OAuth2) — para leer/escribir el calendario.
   - **LinkedIn** (OAuth2) — cuenta con permiso de publicar en la página de empresa.
   - **Facebook Graph API** — token de la página con permiso `pages_manage_posts`.
   - **Gmail** (o reemplazá por SMTP) — para el aviso al equipo.

5. **Variables** (Settings → Variables)
   - `LINKEDIN_ORG_ID` → ID numérico de la página de empresa en LinkedIn.
   - `FB_PAGE_ID` → ID de la página de Facebook.

6. **Probar y activar**
   - Ejecutá manualmente (*Execute Workflow*) para ver un post de prueba.
   - Cuando funcione, activá el workflow (toggle **Active**).

## Notas
- **Instagram**: la API exige una imagen alojada públicamente. Para automatizarlo,
  subí las piezas de `piezas/` a un bucket/URL y agregá un nodo *Facebook Graph API*
  con `edge: media` + `media_publish`. (No incluido por defecto.)
- **Aprobación previa**: si querés revisar antes de publicar, insertá un nodo de
  Telegram/Slack o un *Wait* de aprobación antes de los nodos de publicación
  (ver la nota amarilla en el canvas).
- **Horario**: se publica 09:00 (cron `0 9 * * *`). Cambialo en el nodo *Cada día 09:00*.
- **Zona horaria**: configurala en *Settings → Timezone* del workflow (America/Argentina/Mendoza).
- **Datos [dato]**: reemplazá los marcadores `[dato: ...]` del calendario por cifras
  propias antes de automatizar.
