# -*- coding: utf-8 -*-
"""
El menú agrupado contra el catálogo de módulos del backend.

El menú principal pasó de una lista plana de 22 módulos a cinco grupos
colapsables (`frontend/src/lib/nav-groups.ts`). Eso agrega una lista que puede
desincronizarse del catálogo canónico (`app/data/modules_catalog.py`), y las
dos formas de desincronizarse son silenciosas:

  - un módulo nuevo en el backend que nadie agrega a un grupo queda **sin
    entrada en el menú**: existe, responde, y no hay forma de llegar;
  - una entrada del menú con una `key` que el backend no conoce queda **sin
    gating**: `allowed_modules_for_role` no la restringe nunca, así que el
    enlace se le muestra a perfiles que no deberían verlo.

Ya pasó una vez con `FULL_ROLES` entre el backend y el layout (ver
`test_impersonacion.py`), así que acá se compara igual.

No necesita base de datos ni servidor: lee el .ts y el .py y compara.

    python tests/test_menu_agrupado.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.data.modules_catalog import MODULES, MODULE_KEYS  # noqa: E402

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
NAV_GROUPS_TS = os.path.join(RAIZ, "frontend", "src", "lib", "nav-groups.ts")
LAYOUT_TSX = os.path.join(RAIZ, "frontend", "src", "app", "dashboard", "layout.tsx")

fallos = []


def check(descripcion, condicion, detalle=""):
    estado = "OK  " if condicion else "FALLA"
    print(f"  [{estado}] {descripcion}" + (f" -> {detalle}" if detalle and not condicion else ""))
    if not condicion:
        fallos.append(descripcion)


def leer(ruta):
    with open(ruta, encoding="utf-8") as fh:
        return fh.read()


def keys_del_menu(fuente):
    """Las `key:` de los ítems de NAV_GROUPS, en orden de aparición."""
    # Solo el bloque de NAV_GROUPS: INICIO está arriba y es un ítem suelto.
    inicio = fuente.index("export const NAV_GROUPS")
    fin = fuente.index("export const NAV_ITEMS")
    return re.findall(r'\{\s*key:\s*"([^"]+)"', fuente[inicio:fin])


def grupos_del_menu(fuente):
    """[(id, label, [keys])] por grupo."""
    inicio = fuente.index("export const NAV_GROUPS")
    fin = fuente.index("export const NAV_ITEMS")
    bloque = fuente[inicio:fin]
    grupos = []
    # Cada grupo arranca con `id: "..."` y `label: "..."`; sus ítems son las
    # `key:` que aparecen antes del `id:` del grupo siguiente.
    marcas = [(m.start(), m.group(1), m.group(2)) for m in
              re.finditer(r'id:\s*"([^"]+)",\s*\n\s*label:\s*"([^"]+)"', bloque)]
    for i, (pos, gid, label) in enumerate(marcas):
        hasta = marcas[i + 1][0] if i + 1 < len(marcas) else len(bloque)
        grupos.append((gid, label, re.findall(r'\{\s*key:\s*"([^"]+)"', bloque[pos:hasta])))
    return grupos


print("\n=== Menú agrupado vs. catálogo de módulos ===\n")

ts = leer(NAV_GROUPS_TS)
layout = leer(LAYOUT_TSX)

print("1. El archivo del menú existe y se puede leer")
check("nav-groups.ts encontrado", os.path.exists(NAV_GROUPS_TS), NAV_GROUPS_TS)
check("NAV_GROUPS declarado", "export const NAV_GROUPS" in ts)
check("INICIO declarado aparte", "export const INICIO" in ts)

print("\n2. Cobertura: todo módulo del backend está en el menú")
del_menu = keys_del_menu(ts)
# `inicio` va suelto arriba de los grupos, no dentro de uno.
del_menu_mas_inicio = set(del_menu) | {"inicio"}
faltantes = MODULE_KEYS - del_menu_mas_inicio
check(
    "ningún módulo del backend quedó fuera del menú",
    not faltantes,
    f"sin entrada en el menú (existen y no se puede llegar): {sorted(faltantes)}",
)

print("\n3. Gating: todo ítem del menú existe en el catálogo del backend")
sobrantes = del_menu_mas_inicio - MODULE_KEYS
check(
    "ningún ítem del menú es desconocido para el backend",
    not sobrantes,
    f"sin gating de permisos (se mostrarían a cualquier perfil): {sorted(sobrantes)}",
)

print("\n4. Sin duplicados: un módulo vive en un solo grupo")
duplicados = sorted({k for k in del_menu if del_menu.count(k) > 1})
check("ninguna key repetida entre grupos", not duplicados, f"repetidas: {duplicados}")
check("`inicio` no está dentro de un grupo", "inicio" not in del_menu)

print("\n5. Los grupos están bien formados")
grupos = grupos_del_menu(ts)
check("hay al menos 4 grupos", len(grupos) >= 4, f"grupos: {len(grupos)}")
check("ningún grupo vacío", all(items for _, _, items in grupos),
      str([gid for gid, _, items in grupos if not items]))
ids = [gid for gid, _, _ in grupos]
check("los id de grupo son únicos", len(ids) == len(set(ids)), str(ids))
for gid, label, items in grupos:
    check(f"grupo '{gid}' ({label}): {len(items)} módulos", len(items) >= 1)

print("\n6. Las etiquetas del menú coinciden con las del catálogo")
# El label del backend es el que ve el admin en «Permisos y Perfiles». Si el
# menú dice otra cosa, el admin habilita «Equipos y Calibración» y el usuario
# busca en el menú un nombre que no existe.
etiquetas_backend = {m["key"]: m["label"] for m in MODULES}
etiquetas_menu = dict(re.findall(r'\{\s*key:\s*"([^"]+)",\s*name:\s*"([^"]+)"', ts))
distintas = {
    k: (etiquetas_menu[k], etiquetas_backend[k])
    for k in etiquetas_menu
    if k in etiquetas_backend and etiquetas_menu[k] != etiquetas_backend[k]
}
check("mismo nombre en el menú y en el catálogo", not distintas, f"difieren: {distintas}")

print("\n7. Las rutas del menú coinciden con las del catálogo")
rutas_backend = {m["key"]: m["path"] for m in MODULES}
rutas_menu = dict(re.findall(r'key:\s*"([^"]+)",\s*name:\s*"[^"]+",\s*path:\s*"([^"]+)"', ts))
rutas_distintas = {
    k: (rutas_menu[k], rutas_backend[k])
    for k in rutas_menu
    if k in rutas_backend and rutas_menu[k] != rutas_backend[k]
}
check("misma ruta en el menú y en el catálogo", not rutas_distintas, f"difieren: {rutas_distintas}")

print("\n8. El layout usa el catálogo agrupado y no una lista propia")
check("el layout importa nav-groups", 'from "@/lib/nav-groups"' in layout)
check("el layout importa NAV_GROUPS e INICIO",
      "NAV_GROUPS" in layout and "INICIO" in layout)
# La lista plana que había antes dentro del layout no debe volver: era la copia
# que se desincronizaba.
check("el layout ya no declara su propia lista de navegación",
      "const navItems = [" not in layout)
check("se sigue filtrando por permisos", "isAllowed(item.path)" in layout)
check("un grupo sin ítems visibles no se dibuja",
      "grupo.items.length > 0" in layout)

print("\n9. MODULE_PATH del layout sigue cubriendo el catálogo")
# MODULE_PATH es lo que traduce las keys de permisos a rutas: si le falta una
# key, el perfil que la tenga habilitada no puede entrar a ese módulo.
bloque_mp = layout[layout.index("const MODULE_PATH"):layout.index("// Alcance por defecto")]
keys_mp = set(re.findall(r'^\s*"?([a-z0-9-]+)"?:\s*"/dashboard', bloque_mp, re.M))
faltan_mp = MODULE_KEYS - keys_mp
check("MODULE_PATH cubre todos los módulos", not faltan_mp, f"faltan: {sorted(faltan_mp)}")

print("\n10. El umbral de menú plano es coherente")
m = re.search(r"const UMBRAL_AGRUPAR = (\d+)", layout)
check("UMBRAL_AGRUPAR definido", m is not None)
if m:
    umbral = int(m.group(1))
    check("el umbral es chico (agrupar solo cuando hay muchas secciones)",
          1 <= umbral <= 8, f"umbral = {umbral}")
    # El auditor de campo ve 1 módulo y usa otra cáscara, pero un perfil
    # personalizado con 2 o 3 módulos tiene que caer en el menú plano.
    check("un perfil de 3 módulos no ve encabezados de grupo", umbral >= 3,
          f"umbral = {umbral}")

print("\n" + "=" * 60)
if fallos:
    print(f"FALLARON {len(fallos)} comprobaciones:")
    for f in fallos:
        print(f"  - {f}")
    sys.exit(1)
print("Todas las comprobaciones pasaron.")
