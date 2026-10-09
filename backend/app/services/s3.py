import hashlib
import logging
import re
import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError
from app.core.config import settings

logger = logging.getLogger(__name__)


class AlmacenamientoError(Exception):
    """
    Falla al guardar o leer un objeto del almacenamiento.

    Existe porque el patrón anterior —devolver False— perdía la causa: el
    auditor en planta veía «Error al subir la firma al almacenamiento» y nadie,
    ni él ni quien mirara después los logs, podía saber si fue una credencial
    vencida, un bucket inexistente o MinIO apagado. El mensaje de esta
    excepción es el que se le muestra, así que dice qué pasó.
    """

    def __init__(self, mensaje: str, causa: str | None = None):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.causa = causa


# Un bucket de S3/MinIO admite 3 a 63 caracteres, minúsculas, dígitos, puntos y
# guiones, y tiene que empezar y terminar en letra o dígito.
_BUCKET_VALIDO = re.compile(r"^[a-z0-9][a-z0-9.\-]{1,61}[a-z0-9]$")


def nombre_de_bucket(tenant_slug: str) -> str:
    """
    Nombre del bucket aislado de un tenant.

    El nombre natural es `tenant-{slug}`, y mientras sea un nombre válido se
    usa tal cual: cambiarlo dejaría a los clientes existentes mirando un bucket
    vacío. Pero el slug no siempre da uno válido —el alta por autogestión lo
    arma recortando el nombre de la empresa, así que puede terminar en guion o
    pasarse de largo— y en ese caso S3 rechaza *toda* subida con un error que
    no menciona el nombre. Para esos casos se deriva uno válido y estable; como
    el nombre inválido nunca pudo existir, no hay nada que perder.
    """
    natural = f"tenant-{tenant_slug}".lower()
    if _BUCKET_VALIDO.match(natural):
        return natural
    limpio = re.sub(r"[^a-z0-9.\-]", "-", natural).strip(".-")
    # El hash del slug original evita que dos slugs distintos colapsen en el
    # mismo bucket después del recorte.
    huella = hashlib.sha256(tenant_slug.encode("utf-8")).hexdigest()[:8]
    limpio = f"{limpio[:54].rstrip('.-')}-{huella}"
    if not _BUCKET_VALIDO.match(limpio):       # slug vacío o impronunciable
        limpio = f"tenant-{huella}"
    return limpio


class S3Service:
    def __init__(self):
        # Configured for MinIO compatibility (with path-style routing support)
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.MINIO_ENDPOINT,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",  # Standard fallback region
        )

    @staticmethod
    def _motivo(e: Exception, bucket_name: str) -> str:
        """Traduce la falla de boto a algo que le sirva a quien la lee."""
        if isinstance(e, ClientError):
            codigo = str(e.response.get("Error", {}).get("Code", "")) or "desconocido"
            if codigo in ("AccessDenied", "403", "InvalidAccessKeyId", "SignatureDoesNotMatch"):
                return ("El almacenamiento rechazó las credenciales del servidor "
                        f"({codigo}). Revisá MINIO_ACCESS_KEY y MINIO_SECRET_KEY.")
            if codigo in ("NoSuchBucket", "404"):
                return f"No existe el espacio de archivos «{bucket_name}» y no se pudo crear."
            if codigo in ("InvalidBucketName",):
                return f"El nombre del espacio de archivos «{bucket_name}» no es válido."
            return f"El almacenamiento devolvió un error ({codigo})."
        return ("No se pudo contactar al almacenamiento. "
                f"Verificá que el servicio esté levantado en {settings.MINIO_ENDPOINT}.")

    def _ensure_bucket_exists(self, bucket_name: str) -> None:
        """Crea el bucket del tenant si falta. Levanta AlmacenamientoError si no puede."""
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
            return
        except ClientError as e:
            codigo = e.response.get("Error", {}).get("Code")
            es_404 = (codigo == "404"
                      or e.response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 404)
            if not es_404:
                logger.error("Error checking bucket %s: %s", bucket_name, e)
                raise AlmacenamientoError(self._motivo(e, bucket_name), str(e))
        except BotoCoreError as e:
            # Endpoint caído, DNS, timeout: no es un ClientError y antes se
            # escapaba sin atrapar, terminando en un 500 sin explicación.
            logger.error("No se pudo contactar el almacenamiento (%s): %s",
                         settings.MINIO_ENDPOINT, e)
            raise AlmacenamientoError(self._motivo(e, bucket_name), str(e))

        try:
            self.s3_client.create_bucket(Bucket=bucket_name)
            logger.info("Created new isolated bucket: %s", bucket_name)
        except (ClientError, BotoCoreError) as e:
            # Carrera benigna: otro proceso lo creó entre el head y el create.
            codigo = (e.response.get("Error", {}).get("Code")
                      if isinstance(e, ClientError) else None)
            if codigo in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
                return
            logger.error("Error creating bucket %s: %s", bucket_name, e)
            raise AlmacenamientoError(self._motivo(e, bucket_name), str(e))

    def subir(self, tenant_slug: str, file_key: str, file_data: bytes) -> None:
        """
        Guarda un objeto en el bucket aislado del tenant.

        Levanta AlmacenamientoError con el motivo si no se puede; no devuelve
        un booleano a propósito, porque la causa es lo único que después sirve.
        """
        bucket_name = nombre_de_bucket(tenant_slug)
        self._ensure_bucket_exists(bucket_name)
        try:
            self.s3_client.put_object(Bucket=bucket_name, Key=file_key, Body=file_data)
            logger.info("Successfully uploaded file %s to bucket %s", file_key, bucket_name)
        except (ClientError, BotoCoreError) as e:
            logger.error("Failed to upload %s to S3/MinIO: %s", file_key, e)
            raise AlmacenamientoError(self._motivo(e, bucket_name), str(e))

    def upload_file(self, tenant_slug: str, file_key: str, file_data: bytes) -> bool:
        """Variante booleana de `subir`, para quien solo necesita saber si anduvo."""
        try:
            self.subir(tenant_slug, file_key, file_data)
            return True
        except AlmacenamientoError:
            return False

    def download_file(self, tenant_slug: str, file_key: str) -> bytes | None:
        """
        Descarga el contenido de un objeto del bucket aislado del tenant.
        Devuelve None si no existe o si el almacenamiento no está disponible.
        """
        bucket_name = nombre_de_bucket(tenant_slug)
        try:
            obj = self.s3_client.get_object(Bucket=bucket_name, Key=file_key)
            return obj["Body"].read()
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Failed to download {file_key} from S3/MinIO: {e}")
            return None

    def generate_presigned_download_url(self, tenant_slug: str, file_key: str, expires_in: int = 900) -> str | None:
        """
        Generates a secure temporary download URL for the requested file.
        """
        bucket_name = nombre_de_bucket(tenant_slug)
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket_name, "Key": file_key},
                ExpiresIn=expires_in,
            )
            return url
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Failed to generate pre-signed URL for {file_key}: {e}")
            return None

    def calcular_uso_bytes(self, tenant_slug: str) -> int | None:
        """
        Suma el tamaño de todos los objetos del bucket del tenant.

        Es la única medida correcta del almacenamiento consumido: la evidencia de
        campo —fotos y notas de voz— se sube al bucket pero no queda registrada
        como Document, así que contar filas en la base subestimaría el uso justo
        en el módulo que más pesa.

        Devuelve None si el bucket no existe o el objeto de almacenamiento no
        responde; quien llama debe distinguir «cero» de «no se pudo medir».
        """
        bucket_name = nombre_de_bucket(tenant_slug)
        total = 0
        try:
            paginator = self.s3_client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=bucket_name):
                for obj in page.get("Contents", []):
                    total += obj.get("Size", 0)
            return total
        except (ClientError, BotoCoreError) as e:
            logger.warning(f"No se pudo medir el uso del bucket {bucket_name}: {e}")
            return None


s3_service = S3Service()
