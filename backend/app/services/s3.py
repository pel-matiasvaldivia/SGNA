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

s3_service = S3Service()
