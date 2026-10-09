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

## Recuperación de contraseña

`test_recuperacion_password.py` cubre el flujo de «olvidé mi contraseña». Antes,
el auditor de campo que olvidaba la clave dependía de que un administrador se la
cambiara a mano: parado en planta, eso es quedar afuera del trabajo del día.

Un flujo de recuperación es, por definición, una puerta para entrar sin saber la
contraseña, así que la suite mira sobre todo que no se abra de más: que el
formulario responda igual exista o no la cuenta (si no, sirve para averiguar qué
correos están registrados), que en la base esté el SHA-256 del token y nunca el
token, que el enlace sirva una sola vez, que venza, que pedir uno nuevo apague el
anterior, que una cuenta desactivada no se pueda recuperar, y que no se pueda
reenviar el formulario en bucle para inundar una casilla ajena.

```bash
python tests/test_recuperacion_password.py
```

La migración `0005` crea `public.password_reset_tokens`.

## Ubicación y contacto de la auditoría de campo

`test_ubicacion_auditoria.py` cubre lo que el auditor necesita para llegar. El
listado mostraba el **área** auditada al lado de un ícono de mapa, que no es una
ubicación: sabía qué auditar pero no a qué domicilio ir ni a quién presentarse.

Verifica que la asignación llegue con la organización, el domicilio, el pin del
mapa, el horario, el referente y el alcance; que herede los datos de la ficha de
la organización cuando no los trae; que el correo de asignación diga lo mismo que
la app; y que el domicilio de una organización no se vea con el token de otra.

Dos comprobaciones salieron de problemas concretos del diseño:

- **Heredar no debe escribir.** `contacto_nombre` y compañía son columnas de la
  tabla: si el valor heredado se asignara sobre ellas, el contacto de la
  organización quedaría guardado dentro de la asignación en el primer flush y
  después no habría forma de distinguir lo acordado de lo heredado. Por eso el
  contacto resuelto viaja en un objeto aparte, y la suite lee la fila cruda.
- **Un referente parcial no se mezcla.** Si la asignación nombra a alguien sin
  teléfono, no se le cuelga el número de la recepción: se mostraría un número
  ajeno como si fuera el suyo.

```bash
python tests/test_ubicacion_auditoria.py
```

La migración `0006` agrega las columnas a `public.tenants` y a
`auditorias_asignaciones` de cada tenant.

## Menú agrupado

`test_menu_agrupado.py` cubre la agrupación del menú principal, que pasó de una
lista plana de 22 módulos a cinco grupos colapsables
(`frontend/src/lib/nav-groups.ts`).

Eso agrega una segunda lista que puede desincronizarse del catálogo canónico
(`app/data/modules_catalog.py`), y las dos formas de hacerlo son silenciosas: un
módulo nuevo del backend que nadie agrega a un grupo **existe y no hay forma de
llegar**; una entrada del menú con una `key` desconocida **no la restringe
`allowed_modules_for_role`**, así que se le muestra a cualquier perfil. La suite
compara las dos listas en los dos sentidos, más los nombres, las rutas, que
ningún módulo esté en dos grupos y que el layout no haya vuelto a declarar su
propia lista.

No necesita base de datos ni servidor: lee el `.ts` y el `.py`.

```bash
python tests/test_menu_agrupado.py
```

## Ediciones de la plataforma

`test_edicion.py` cubre el recorte por **edición**: Auditorías (ejecutar
auditorías internas, en cualquier industria) y SGI Completo. Antes las dos veían
los 22 módulos, así que quien contrataba para auditar se encontraba con Huella
de Carbono, CMMS y Revisión por la Dirección, todos vacíos.

Lo que se verifica es sobre todo que el recorte **no sea cosmético**:

- que el enforcement esté en la API y no solo en el menú —esconder un enlace no
  protege nada si la URL sigue contestando—;
- que la edición aplique **también a los administradores**, que no tienen límite
  de perfil pero sí el de lo que la organización contrató;
- que edición y perfil se **intersequen**, en vez de que gane el más permisivo:
  un perfil personalizado con los 22 módulos otorgados sigue viendo los de su
  edición y nada más;
- que un tenant con la edición en NULL —todos los anteriores a esta función— no
  pierda acceso a nada, y que se distinga de uno que eligió la completa, porque
  de eso depende que el asistente de alta pregunte una sola vez;
- que cambiar de edición sea reversible y no borre datos: lo que se apaga es el
  acceso, no la información.

```bash
python tests/test_edicion.py
```

La migración `0007` agrega `public.tenants.edicion`, **nullable y sin default**:
NULL significa «todavía no eligió», no «completa». Un default en la base habría
dejado a los tenants existentes indistinguibles de los que eligieron a
conciencia, y sin forma de saber a quién le falta contestar.

## Empresas auditadas y plantillas propias

`test_empresas_y_plantillas.py` cubre las dos mitades de lo que hace falta para
que la plataforma le sirva a un auditor de cualquier actividad.

**La cartera.** La plataforma asumía que la organización auditaba su propia
casa: la ficha de `public.tenants` era a la vez quién usa el sistema y qué se
audita. Un auditor externo con quince clientes mandaba a su equipo al domicilio
de su propio estudio. Lo que más se verifica es la **precedencia**, porque es
donde un error manda a una persona a la dirección equivocada:

- lo acordado para esta visita gana sobre la ficha del cliente, y la ficha del
  cliente sobre la de la organización;
- **las coordenadas viajan con el domicilio al que pertenecen**: si la visita
  es en otra sede, no se le pegan las del cliente o el pin caería a kilómetros;
- el contacto del propio estudio **no** se usa de respaldo del cliente: darle
  al auditor el teléfono de su oficina para entrar a una planta ajena parece un
  dato útil y no lo es;
- heredar **no escribe** (se lee la fila cruda), el mismo riesgo que ya tenía el
  contacto de la organización;
- borrar una empresa con auditorías está prohibido —un informe sin auditado no
  prueba nada—: se desactiva, sale del selector y su historia queda.

**Las plantillas.** Antes solo podían nacer de una asignación ya cargada,
tipeando pregunta por pregunta. La suite cubre el importador de CSV contra los
archivos que la gente realmente tiene: Excel en español (punto y coma y BOM),
coma, tabulaciones, sin encabezado, con sinónimos de columna y con tildes. Un
archivo imperfecto importa lo que se puede y reporta el resto por número de
fila: rechazar cien filas por dos malas obliga a adivinar cuáles son.

Una comprobación salió de un límite del formato: un archivo de dos columnas sin
encabezado es **estructuralmente idéntico** a un checklist sin encabezado —una
lista de contactos entra igual—, así que no se puede rechazar sin rechazar
también el caso legítimo. Lo que sí se puede es decir en voz alta qué
interpretación se usó, y eso es lo que se verifica.

```bash
python tests/test_empresas_y_plantillas.py
```

La migración `0008` crea `empresas_auditadas` y agrega
`auditorias_asignaciones.empresa_id` en el schema de cada tenant. La columna es
**nullable y sin default**: NULL significa «se audita la propia organización»,
que es como se comportaba todo hasta ahora, así que ninguna asignación
existente cambia de domicilio.

## Migraciones sobre esquemas que ya existían

La migración `0004` crea esas tablas en el schema de cada tenant. Se probó
aplicándola sobre schemas que venían de antes (sin las tablas ni las columnas),
con downgrade y re-upgrade, y sobre un slug con guion —`tenant_olca-sa`—, que
es el caso que rompía: el nombre del índice llevaba el schema adentro y
Postgres lo rechazaba por sintaxis.

`0005` y `0006` se probaron igual, y además se verificó que `alembic heads`
devuelva **una sola** cabeza: con dos, `alembic upgrade head` aborta y —como el
`CMD` del Dockerfile encadena con `&&`— el contenedor de la API no arranca.
