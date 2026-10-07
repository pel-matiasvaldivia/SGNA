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

### IP de origen

La misma suite cubre que la IP de la constancia no la pueda elegir el que
firma. `X-Forwarded-For` se appendea en cada salto y el primer eslabón lo
escribe el navegador; uvicorn corría con `--forwarded-allow-ips='*'`, que lo
hace quedarse justo con ese primer eslabón. Mandando un header se podía
imponer cualquier IP en el registro de auditoría.

Las comprobaciones leen `--forwarded-allow-ips` del `Dockerfile` real y los
`proxy_set_header` de `nginx/`, así que avisan si alguien vuelve a `'*'` o a
`$proxy_add_x_forwarded_for`.

El tramo de nginx —que no se puede ejercitar desde Python— tiene su propio
script, que levanta un nginx real con la configuración del repositorio y le
pega con headers falsificados:

```bash
scripts/probar-ip-cliente.sh   # necesita nginx y python3, no necesita root
```

## Plan de auditoría y checklist ISO 9001

`test_plan_auditoria.py` cubre el Plan de Auditoría —el documento que se acuerda
con la organización antes de auditar— y el checklist completo de ISO 9001.

El plan nace con el programa: código, criterios y cronograma de la jornada ya
cargados. Lo que se verifica es que se emita solo, que un programa anterior a
esta función también obtenga el suyo al pedirlo, que lo editado persista, que
el plan de una organización no se vea con el token de otra, y que el checklist
llegue a la base con el módulo y la evidencia a solicitar en cada punto.

Una comprobación salió de un error que la propia suite encontró: al borrar un
programa, su plan se iba con él y el correlativo volvía atrás, reemitiendo un
código ya entregado impreso. Por eso el número lo da `planes_auditoria_correlativo`,
un contador que sólo sube, y no un conteo de los planes vivos.

```bash
python tests/test_plan_auditoria.py
```

La migración `0004` crea esas tablas en el schema de cada tenant. Se probó
aplicándola sobre schemas que venían de antes (sin las tablas ni las columnas),
con downgrade y re-upgrade, y sobre un slug con guion —`tenant_olca-sa`—, que
es el caso que rompía: el nombre del índice llevaba el schema adentro y
Postgres lo rechazaba por sintaxis.
