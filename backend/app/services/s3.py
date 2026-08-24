import logging
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings

logger = logging.getLogger(__name__)

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

    def _ensure_bucket_exists(self, bucket_name: str) -> bool:
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
            return True
        except ClientError as e:
            # If 404, the bucket does not exist, so we create it
            error_code = e.response.get("Error", {}).get("Code")
            if error_code == "404" or e.response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 404:
                try:
                    self.s3_client.create_bucket(Bucket=bucket_name)
                    logger.info(f"Created new isolated bucket: {bucket_name}")
                    return True
                except Exception as create_err:
                    logger.error(f"Error creating bucket {bucket_name}: {create_err}")
                    return False
            else:
                logger.error(f"Error checking bucket {bucket_name}: {e}")
                return False

    def upload_file(self, tenant_slug: str, file_key: str, file_data: bytes) -> bool:
        """
        Uploads a file to an isolated tenant bucket: tenant-{slug}.
        """
        bucket_name = f"tenant-{tenant_slug}"
        if not self._ensure_bucket_exists(bucket_name):
            return False

        try:
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=file_key,
                Body=file_data,
            )
            logger.info(f"Successfully uploaded file {file_key} to bucket {bucket_name}")
            return True
        except ClientError as e:
            logger.error(f"Failed to upload {file_key} to S3/MinIO: {e}")
            return False

    def download_file(self, tenant_slug: str, file_key: str) -> bytes | None:
        """
        Descarga el contenido de un objeto del bucket aislado del tenant.
        Devuelve None si no existe o si el almacenamiento no está disponible.
        """
        bucket_name = f"tenant-{tenant_slug}"
        try:
            obj = self.s3_client.get_object(Bucket=bucket_name, Key=file_key)
            return obj["Body"].read()
        except ClientError as e:
            logger.error(f"Failed to download {file_key} from S3/MinIO: {e}")
            return None

    def generate_presigned_download_url(self, tenant_slug: str, file_key: str, expires_in: int = 900) -> str | None:
        """
        Generates a secure temporary download URL for the requested file.
        """
        bucket_name = f"tenant-{tenant_slug}"
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket_name, "Key": file_key},
                ExpiresIn=expires_in,
            )
            return url
        except ClientError as e:
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
        bucket_name = f"tenant-{tenant_slug}"
        total = 0
        try:
            paginator = self.s3_client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=bucket_name):
                for obj in page.get("Contents", []):
                    total += obj.get("Size", 0)
            return total
        except ClientError as e:
            logger.warning(f"No se pudo medir el uso del bucket {bucket_name}: {e}")
            return None


s3_service = S3Service()
