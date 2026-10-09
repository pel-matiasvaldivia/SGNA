# Reels — guion y publicación automática

Doce reels verticales para Instagram, Facebook y TikTok, con su guion de rodaje
y un workflow de n8n que los publica solos.

## Archivos
- `guion-reels.md` — el guion de cada reel: gancho, plano a plano, texto en
  pantalla, voz en off y copy de la publicación. Es lo que se lleva a grabar.
- `reels-n8n.csv` — la misma tabla, para subir a Google Sheets.
- `n8n-workflow-reels.json` — workflow importable en n8n.
- `gen_reels.py` — genera los tres. **Los guiones se editan acá**, no en los
  archivos de salida: si los tocás a mano, el próximo `python gen_reels.py` los
  pisa.

## Lo que hay que hacer a mano

El workflow publica, no graba. Falta un paso humano en el medio:

1. **Grabar los doce reels** siguiendo `guion-reels.md`. Vertical 9:16
   (1080×1920), MP4 con video H.264 y audio AAC, menos de 90 segundos.
2. **Subirlos a una URL pública** (un bucket, el propio servidor, Drive con
   enlace directo). La API de Instagram descarga el archivo desde esa URL: no
   acepta que se lo subas en el mismo pedido.
3. **Pegar cada enlace** en la columna `VideoURL` de la hoja.

Un reel sin `VideoURL` no se publica y **tampoco se marca como publicado**, así
que queda esperando a que el archivo esté. Publicar un reel vacío es peor que
no publicar nada.

## Instalación en n8n

1. **Google Sheets** — subí `reels-n8n.csv` a una hoja nueva y renombrá la
   pestaña a **Reels** (así la busca el workflow). Copiá el ID de la hoja: está
   en la URL, entre `/d/` y `/edit`.
2. **Importar** — en n8n: *Workflows → Import from File* → el `.json`.
3. **Pegar el ID** — en los nodos *Leer reels (Sheets)* y *Marcar como
   Publicado*, reemplazá `TU_GOOGLE_SHEET_ID`.
4. **Credenciales** — Google Sheets (OAuth2) y Gmail (o cambialo por SMTP).
5. **Variables** (*Settings → Variables*):
   - `IG_USER_ID` — el ID de la cuenta de Instagram **profesional** vinculada a
     tu página de Facebook.
   - `IG_ACCESS_TOKEN` — token de larga duración con `instagram_basic`,
     `instagram_content_publish` y `pages_read_engagement`.
6. **Probar** con *Execute Workflow* sobre una fila con `VideoURL` cargada, y
   recién después activarlo.

## Cómo funciona

```
Lun/mié/vie 09:30  →  Leer reels (Sheets)  →  Elegir el de hoy
   →  ¿Tiene video?  →  Crear contenedor en Instagram
   →  Esperar 30 s  →  ¿Terminó de procesar?
        ├─ FINISHED  →  Publicar  →  Marcar fila  →  Avisar al equipo
        ├─ ERROR     →  Avisar que falló (la fila NO se marca)
        └─ otro      →  volver a esperar
```

Ese ciclo no es un rodeo: Instagram no publica el reel en el mismo pedido.
Primero crea un contenedor, lo procesa por su cuenta y recién cuando está
`FINISHED` se puede publicar. Por eso el flujo consulta el estado hasta que
termina, y corta si da `ERROR` en vez de reintentar para siempre.

## Límites conocidos

- **Solo Instagram.** Los reels de Facebook usan otra API (`/video_reels`, con
  subida en tres pasos) y TikTok exige su propia app aprobada. Para esas dos
  redes, por ahora, la publicación es manual.
- **Instagram limita a 50 publicaciones por día** por cuenta vía API. Con tres
  reels por semana sobra, pero conviene saberlo si se suman las piezas
  estáticas al mismo token.
- **El workflow no graba ni edita video.** Si más adelante querés automatizar
  también el armado, el lugar donde entra es entre *Elegir reel de hoy* y
  *Crear contenedor*: un nodo HTTP contra el servicio de render que uses,
  devolviendo la URL del MP4.
- **Zona horaria**: el workflow viene con `America/Argentina/Mendoza`. Si tu
  instancia de n8n corre en UTC, verificá que el disparador caiga a las 09:30
  locales.
