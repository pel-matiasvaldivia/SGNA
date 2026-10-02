#!/usr/bin/env bash
#
# Replica la imagen de MinIO en el GHCR propio y deja MINIO_IMAGE en .env.
#
# Por qué hace falta: el namespace minio/* de Docker Hub pasó a exigir
# autenticación, así que `docker compose pull` falla y un host nuevo no puede
# levantar el stack. Este script toma la imagen que YA está en este host
# (la que viene corriendo en producción, no una versión nueva sin probar),
# la sube al GHCR del proyecto y pinnea esa versión exacta.
#
#   ./scripts/espejar-minio.sh
#
# Requiere estar logueado en GHCR con permiso de escritura de paquetes:
#   echo "$GITHUB_TOKEN" | docker login ghcr.io -u <usuario> --password-stdin
# (el token necesita el scope write:packages)

set -euo pipefail

DESTINO="${DESTINO:-ghcr.io/pel-matiasvaldivia/sgna/minio}"
ORIGEN="${ORIGEN:-minio/minio:latest}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$RAIZ/.env}"

echo "==> Buscando la imagen de MinIO en este host"
if ! docker image inspect "$ORIGEN" >/dev/null 2>&1; then
  # Puede estar cacheada bajo el nombre que usa el contenedor en marcha.
  EN_USO="$(docker inspect --format '{{.Config.Image}}' \
            "$(docker compose -f "$RAIZ/docker-compose.yml" ps -q minio 2>/dev/null)" 2>/dev/null || true)"
  if [ -n "$EN_USO" ] && docker image inspect "$EN_USO" >/dev/null 2>&1; then
    ORIGEN="$EN_USO"
  else
    echo "ERROR: no hay ninguna imagen de MinIO en este host." >&2
    echo "       Docker Hub ya no la sirve sin autenticación, así que no se" >&2
    echo "       puede bajar de nuevo. Corré esto en el servidor que todavía" >&2
    echo "       tiene el contenedor andando, o conseguí la imagen de otra" >&2
    echo "       fuente (quay.io/minio/minio) antes de espejarla." >&2
    exit 1
  fi
fi
echo "    origen: $ORIGEN"

# La versión sale de la propia imagen, no de una suposición: MinIO la publica
# como etiqueta OCI y, si no está, el binario la reporta.
VERSION="$(docker image inspect "$ORIGEN" \
  --format '{{index .Config.Labels "org.opencontainers.image.version"}}' 2>/dev/null || true)"
if [ -z "$VERSION" ] || [ "$VERSION" = "<no value>" ]; then
  VERSION="$(docker run --rm --entrypoint minio "$ORIGEN" --version 2>/dev/null \
             | grep -oE 'RELEASE\.[0-9TZ:-]+' | head -1 || true)"
fi
if [ -z "$VERSION" ]; then
  # Último recurso: el digest, que identifica la imagen sin ambigüedad.
  VERSION="sha-$(docker image inspect "$ORIGEN" --format '{{.Id}}' | cut -d: -f2 | cut -c1-12)"
  echo "    AVISO: la imagen no declara versión; se usa el digest abreviado."
fi
# Un tag de Docker no admite ':' (RELEASE.2025-04-22T22-12-26Z los trae).
TAG="$(printf '%s' "$VERSION" | tr ':' '-')"
echo "    versión: $VERSION  ->  tag: $TAG"

echo "==> Etiquetando y subiendo a $DESTINO"
docker tag "$ORIGEN" "$DESTINO:$TAG"
docker push "$DESTINO:$TAG"

# Alias movible, solo por comodidad para inspeccionar. El compose NO lo usa:
# apunta siempre al tag fijo, para que un reinicio no cambie la versión de
# MinIO por debajo de los datos.
docker tag "$ORIGEN" "$DESTINO:stable"
docker push "$DESTINO:stable"

LINEA="MINIO_IMAGE=$DESTINO:$TAG"
echo "==> Registrando $LINEA en $ENV_FILE"
if [ -f "$ENV_FILE" ] && grep -q '^MINIO_IMAGE=' "$ENV_FILE"; then
  cp "$ENV_FILE" "$ENV_FILE.bak"
  # El valor puede traer '/' y ':', así que el separador de sed no puede ser '/'.
  sed -i "s|^MINIO_IMAGE=.*|$LINEA|" "$ENV_FILE"
  echo "    actualizado (copia previa en $ENV_FILE.bak)"
else
  printf '\n# Espejo propio de MinIO (ver scripts/espejar-minio.sh)\n%s\n' "$LINEA" >> "$ENV_FILE"
  echo "    agregado"
fi

cat <<FIN

Listo. Dos cosas antes de desplegar:

1. El paquete nace PRIVADO en GHCR. Hacelo público, o el pull desde el
   servidor va a pedir login:
     https://github.com/users/pel-matiasvaldivia/packages/container/sgna%2Fminio/settings
   (las otras imágenes del proyecto ya son públicas)

2. Verificá que baje sin credenciales y levantá:
     docker logout ghcr.io && docker pull $DESTINO:$TAG
     docker compose up -d
FIN
