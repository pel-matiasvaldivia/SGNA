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

CMD ["sh", "-c", "alembic upgrade head && python -m app.db.seed_superadmin && uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]
