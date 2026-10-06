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

## Impersonación de tenants

`test_impersonacion.py` cubre el camino del superadmin, que es el único que
salta la verificación de pertenencia: entra sin pertenecer a ninguna
organización y opera dentro de una con un token firmado por
`/admin/tenants/{id}/impersonate`.

Además compara `FULL_ROLES` del backend con la copia que tiene el frontend en
`frontend/src/app/dashboard/layout.tsx`. Las dos listas ya se desincronizaron
una vez: el backend daba acceso a todo y la consola no mostraba ningún módulo,
así que impersonar terminaba siempre en Mi Perfil con el menú vacío. Si tocás
una, la prueba te avisa de la otra.

```bash
python tests/test_impersonacion.py
```

## Traza de aprobaciones

`test_firma_aprobacion.py` cubre la constancia de aprobación de documentos. La
pantalla mostraba un "Acta de Firma Electrónica Regulada" con un hash hecho con
`Math.random()` y una IP escrita a mano: el servidor sí registraba la traza
real, pero no la devolvía.

Verifica que lo que se muestra sea lo registrado, que la huella se pueda
**recalcular** desde la base (un hash que nadie puede volver a computar no
prueba nada), que alterar la fila se detecte, y que una versión subida después
no quede aparentemente cubierta por la aprobación anterior.

```bash
python tests/test_firma_aprobacion.py
```
