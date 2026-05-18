from typing import Any
from sqlalchemy.orm import as_declarative, declared_attr

@as_declarative()
class Base:
    id: Any
    __name__: str

    # Genera el nombre de la tabla automáticamente si no se provee
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()
