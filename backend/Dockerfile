FROM python:3.11-slim as builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt requirements.lock.txt ./
# Se instala desde el lock, no desde requirements.txt: fija también las
# transitivas, así dos builds del mismo commit instalan exactamente lo mismo.
# Antes las versiones eran `>=` sin tope y un rebuild podía traer un major
# nuevo —fue así como SQLAlchemy 2.1 dejó el backend sin arrancar—.
RUN pip install --no-cache-dir --user -r requirements.lock.txt

FROM python:3.11-slim as runner
WORKDIR /app

# Copy only installed site-packages/binaries from builder
COPY --from=builder /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Expose backend port
EXPOSE 8000

# --forwarded-allow-ips: antes era '*'. Con '*' uvicorn confía en cualquiera y
# toma el PRIMER eslabón de X-Forwarded-For, que es el que escribe el navegador:
# la IP que queda en la constancia de aprobación la elegía el firmante. Acotado
# a redes privadas, uvicorn recorre la cadena de derecha a izquierda y se queda
# con el primer eslabón que NO es un proxy conocido. El puerto 8000 no se
# publica: el único que puede llegar es nginx, por la red interna de Docker.
CMD ["sh", "-c", "alembic upgrade head && python -m app.db.seed_superadmin && uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,fc00::/7'"]
