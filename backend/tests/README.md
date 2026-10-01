# Pruebas de pertenencias (multi-organización)

Cubren el modelo que permite que una misma persona —un auditor externo o un
partner— trabaje en varias organizaciones con una sola cuenta, y sobre todo que
el token de una organización no alcance los datos de otra.

Necesitan un Postgres real, porque lo que se verifica son restricciones de
integridad, subconsultas correlacionadas y cascadas.

```bash
export TEST_DATABASE_URL="postgresql+psycopg2://usuario:clave@localhost:5432/basedeprueba"
python tests/test_membresias.py       # modelo y consultas
python tests/test_membresias_api.py   # API de punta a punta
```

**Las dos borran y recrean el schema `public`.** Apuntalas a una base
descartable, nunca a producción.
