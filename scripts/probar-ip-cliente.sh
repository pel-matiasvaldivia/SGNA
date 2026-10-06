#!/usr/bin/env bash
#
# Comprueba que nginx resuelve bien la IP real del cliente.
#
# Por qué existe: esa IP queda guardada en la constancia de aprobación de
# documentos (document_approvals.ip_address). X-Forwarded-For lo appendea cada
# salto y el PRIMER eslabón lo escribe el navegador, así que si se reenvía la
# cadena tal cual, el que firma elige qué IP queda registrada. nginx la
# reemplaza por un único valor calculado; esto verifica que lo siga haciendo.
#
# Requisitos: nginx y python3 en el PATH. No necesita root ni Docker.
# Uso: scripts/probar-ip-cliente.sh
#
# Sustituciones respecto del despliegue real (para poder correr sin root ni el
# stack levantado): el puerto de escucha pasa de 80 a 8080, los upstreams
# frontend:3000 / api:8000 apuntan al eco local, y las rutas de log/pid van a
# un directorio temporal. Las líneas bajo prueba —los proxy_set_header y el
# bloque de $ip_cliente— se usan tal como están en el repositorio.

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command -v nginx >/dev/null || { echo "falta nginx en el PATH"; exit 1; }
command -v python3 >/dev/null || { echo "falta python3 en el PATH"; exit 1; }

TMP="$(mktemp -d)"
PUERTO_NGINX=8080
PUERTO_ECO=8099
limpiar() {
  nginx -c "$TMP/nginx.conf" -s quit 2>/dev/null || true
  [ -n "${ECO_PID:-}" ] && kill "$ECO_PID" 2>/dev/null || true
  rm -rf "$TMP"
}
trap limpiar EXIT

mkdir -p "$TMP/conf.d" "$TMP/logs"

sed -e 's|^user  nginx;||' \
    -e "s|/var/log/nginx|$TMP/logs|g" \
    -e "s|/var/run/nginx.pid|$TMP/nginx.pid|" \
    -e "s|include /etc/nginx/conf.d/\*.conf;|include $TMP/conf.d/*.conf;|" \
    "$RAIZ/nginx/nginx.conf" > "$TMP/nginx.conf"

sed -e "s|listen 80;|listen $PUERTO_NGINX;|" \
    -e "s|http://api:8000/api/v1/|http://127.0.0.1:$PUERTO_ECO/|" \
    -e "s|http://api:8000/api/v1/docs|http://127.0.0.1:$PUERTO_ECO/|" \
    -e "s|http://frontend:3000|http://127.0.0.1:$PUERTO_ECO|" \
    "$RAIZ/nginx/sites/default.conf" > "$TMP/conf.d/default.conf"

# Eco: devuelve el X-Forwarded-For que nginx terminó mandando al backend.
# Ese valor es el que uvicorn --proxy-headers convierte en request.client.host.
cat > "$TMP/eco.py" <<'PY'
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
import sys


class Eco(BaseHTTPRequestHandler):
    def do_GET(self):
        cuerpo = json.dumps({
            "xff": self.headers.get("X-Forwarded-For"),
            "xreal": self.headers.get("X-Real-IP"),
        }).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def log_message(self, *a):
        pass


HTTPServer(("127.0.0.1", int(sys.argv[1])), Eco).serve_forever()
PY

python3 "$TMP/eco.py" "$PUERTO_ECO" &
ECO_PID=$!
nginx -c "$TMP/nginx.conf" -t >/dev/null
nginx -c "$TMP/nginx.conf"
for _ in $(seq 1 40); do
  curl -sf -o /dev/null "http://127.0.0.1:$PUERTO_ECO/" && break || sleep 0.25
done

fallos=0
probar() {  # nombre, esperado, headers de curl...
  local nombre="$1" esperado="$2"; shift 2
  local obtenido
  obtenido=$(curl -s "$@" "http://127.0.0.1:$PUERTO_NGINX/api/v1/x" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["xff"])')
  if [ "$obtenido" = "$esperado" ]; then
    printf '  [OK   ] %s -> %s\n' "$nombre" "$obtenido"
  else
    printf '  [FALLA] %s -> esperaba %s, obtuvo %s\n' "$nombre" "$esperado" "$obtenido"
    fallos=$((fallos + 1))
  fi
}

echo "IP que nginx reenvía al backend (el peer es 127.0.0.1, o sea red privada:"
echo "cuenta como proxy de entrada, igual que NPM en producción)"
echo
probar "X-Real-IP del proxy gana sobre el XFF del navegador" 203.0.113.9 \
  -H "X-Real-IP: 203.0.113.9" -H "X-Forwarded-For: 1.2.3.4, 203.0.113.9"
probar "sólo X-Real-IP" 203.0.113.9 -H "X-Real-IP: 203.0.113.9"
probar "XFF inventado sin respaldo: se descarta" 127.0.0.1 \
  -H "X-Forwarded-For: 1.2.3.4"
probar "XFF inventado con varios eslabones: se descarta" 127.0.0.1 \
  -H "X-Forwarded-For: 1.2.3.4, 5.6.7.8, 9.9.9.9"
probar "sin headers: vale la IP de origen" 127.0.0.1

echo
if [ "$fallos" -gt 0 ]; then
  echo "FALLARON $fallos comprobaciones"
  exit 1
fi
echo "Todas las comprobaciones pasaron"
