"""
Huella de auditoría de una aprobación de documento.

Qué es y qué no es: acredita que una aprobación quedó registrada, por quién,
cuándo y sobre qué versión, y permite detectar después si esa fila fue
modificada. No es una firma digital con certificado en los términos de la
Ley 25.506, y la pantalla que la muestra lo dice explícitamente.

El cálculo vive acá, en un solo lugar, porque tiene que dar idéntico al firmar
y al verificar. Si se separan, el hash deja de poder recalcularse y la huella
pasa a ser decorativa.
"""

import hashlib
from datetime import datetime
from uuid import UUID


def sello_tiempo(momento: datetime) -> str:
    """
    Instante en texto, en un formato que sobrevive la ida y vuelta a la base.

    `document_approvals.fecha_resolucion` es DateTime SIN zona horaria: al
    guardar un datetime con tzinfo y volver a leerlo, la zona se pierde. Usar
    `isoformat()` daría "...+00:00" al firmar y "..." al releer, con lo cual el
    hash jamás volvería a coincidir. `strftime` ignora la zona, así que las dos
    rutas producen el mismo texto.
    """
    return momento.strftime("%Y-%m-%dT%H:%M:%S.%f")


def huella_aprobacion(
    email_aprobador: str,
    momento: datetime,
    estado: str,
    documento_id: UUID,
    version: int | None,
) -> str:
    """SHA-256 sobre quién, cuándo, qué decisión, qué documento y qué versión."""
    semilla = (
        f"{email_aprobador}|{sello_tiempo(momento)}|{estado}|"
        f"{documento_id}|v{version}"
    )
    return hashlib.sha256(semilla.encode("utf-8")).hexdigest()
