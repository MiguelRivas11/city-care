from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(r"C:\Users\migue\medula\city-care")
OUTPUT = ROOT / "docs" / "Documentacion_Completa_2_2_Administracion_Usuarios.docx"

NAVY = "17365D"
PALE_BLUE = "EAF2F8"
PALE_GRAY = "F5F6F7"
GRID = "D9D9D9"
GREEN = "1F7A4D"


def set_cell_fill(cell, color):
    shading = cell._tc.get_or_add_tcPr().find(qn("w:shd"))
    if shading is None:
        shading = OxmlElement("w:shd")
        cell._tc.get_or_add_tcPr().append(shading)
    shading.set(qn("w:fill"), color)


def set_cell_borders(cell, color=GRID, size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    margins = tc_pr.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        tc_pr.append(margins)
    for name, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = margins.find(qn("w:" + name))
        if node is None:
            node = OxmlElement("w:" + name)
            margins.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def add_page_number(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instr, separate, end])


def keep_with_next(paragraph):
    paragraph.paragraph_format.keep_with_next = True


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.autofit = False
    table.alignment = 1
    header = table.rows[0]
    set_repeat_table_header(header)
    for index, text in enumerate(headers):
        cell = header.cells[index]
        cell.text = str(text)
        set_cell_fill(cell, NAVY)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_borders(cell)
        set_cell_margins(cell)
        for paragraph in cell.paragraphs:
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in paragraph.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.size = Pt(8.5)
    for row_index, values in enumerate(rows):
        cells = table.add_row().cells
        for index, value in enumerate(values):
            cell = cells[index]
            cell.text = str(value)
            if row_index % 2:
                set_cell_fill(cell, PALE_GRAY)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_borders(cell)
            set_cell_margins(cell)
            for paragraph in cell.paragraphs:
                paragraph.paragraph_format.space_after = Pt(0)
                for run in paragraph.runs:
                    run.font.size = Pt(8.5)
        if widths:
            for index, width in enumerate(widths):
                cells[index].width = Cm(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_bullets(doc, items):
    for item in items:
        paragraph = doc.add_paragraph(style="List Bullet")
        paragraph.add_run(item)
        paragraph.paragraph_format.space_after = Pt(3)


def add_code(doc, lines):
    for line in lines:
        paragraph = doc.add_paragraph()
        paragraph.style = doc.styles["No Spacing"]
        paragraph.paragraph_format.left_indent = Cm(0.6)
        paragraph.paragraph_format.space_after = Pt(1)
        run = paragraph.add_run(line)
        run.font.name = "Consolas"
        run._element.rPr.rFonts.set(qn("w:ascii"), "Consolas")
        run._element.rPr.rFonts.set(qn("w:hAnsi"), "Consolas")
        run.font.size = Pt(8)


doc = Document()
section = doc.sections[0]
section.top_margin = Cm(1.9)
section.bottom_margin = Cm(1.7)
section.left_margin = Cm(2.0)
section.right_margin = Cm(2.0)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Aptos"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
normal.font.size = Pt(10)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.08

title_style = styles["Title"]
title_style.font.name = "Aptos Display"
title_style.font.size = Pt(28)
title_style.font.bold = True
title_style.font.color.rgb = RGBColor(0, 0, 0)
title_ppr = title_style._element.get_or_add_pPr()
title_border = title_ppr.find(qn("w:pBdr"))
if title_border is not None:
    title_ppr.remove(title_border)

for name, size in (("Heading 1", 17), ("Heading 2", 13), ("Heading 3", 11)):
    style = styles[name]
    style.font.name = "Aptos Display"
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.paragraph_format.space_before = Pt(12)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.keep_with_next = True

footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer_run = footer.add_run("City Care  |  Administración de usuarios 2.2  |  Página ")
footer_run.font.size = Pt(8)
footer_run.font.color.rgb = RGBColor(90, 90, 90)
add_page_number(footer)

title = doc.add_paragraph(style="Title")
title.alignment = WD_ALIGN_PARAGRAPH.LEFT
title.add_run("Documentación completa 2 2 Administración de usuarios")

subtitle = doc.add_paragraph()
subtitle.add_run("Backend City Care  |  Versión 1.0").bold = True
subtitle.paragraph_format.space_after = Pt(18)

intro = doc.add_paragraph()
intro.add_run("Resultado. ").bold = True
intro.add_run(
    "El módulo administrativo de usuarios está terminado en el backend. Permite crear, listar, buscar, "
    "consultar, editar, activar o desactivar cuentas y restablecer contraseñas. Todas las operaciones están "
    "protegidas por autenticación y rol administrador, cuentan con validación, contrato OpenAPI, cliente Orval "
    "y pruebas automatizadas."
)

add_table(
    doc,
    ["Estado", "Cobertura", "Evidencia"],
    [
        ["COMPLETO", "9 de 9 puntos del apartado 2.2", "14 pruebas funcionales nuevas"],
        ["VALIDADO", "Autenticación 2.1 sin regresiones", "23 de 23 pruebas aprobadas"],
        ["SINCRONIZADO", "OpenAPI y SDK Orval", "6 operaciones administrativas generadas"],
    ],
    [3.0, 7.0, 7.2],
)

doc.add_heading("1 Alcance terminado", level=1)
add_table(
    doc,
    ["Punto", "Implementación", "Estado"],
    [
        ["Crear usuario", "Alta transaccional del perfil y su credencial", "Listo"],
        ["Validar rol y dependencia", "Las referencias deben existir y el correo debe ser único", "Listo"],
        ["Transacción de alta", "Si falla una escritura, no queda información parcial", "Listo"],
        ["Listar y buscar", "Paginación, búsqueda y filtros combinables", "Listo"],
        ["Consultar detalle", "Incluye perfil, rol, dependencia y estado", "Listo"],
        ["Editar usuario", "Sincroniza el correo de users y credentials", "Listo"],
        ["Activar o desactivar", "Baja lógica y revocación de sesiones", "Listo"],
        ["Restablecer contraseña", "Hash nuevo, sesiones revocadas y evento auditable", "Listo"],
        ["Definir eliminación", "No existe borrado físico; se usa is_active", "Listo"],
    ],
    [4.2, 10.2, 2.5],
)

doc.add_heading("2 Arquitectura del módulo", level=1)
doc.add_paragraph(
    "Las rutas administrativas pasan primero por el middleware de autenticación y después por el middleware "
    "de administrador. El controlador valida la solicitud con VineJS, aplica las reglas de negocio, ejecuta "
    "las escrituras relacionadas dentro de una transacción y finalmente transforma la respuesta pública."
)
add_table(
    doc,
    ["Etapa", "Responsabilidad", "Archivo principal"],
    [
        ["1 Ruta", "Expone el recurso bajo /api/v1/admin/users", "start/routes.ts"],
        ["2 Seguridad", "Valida Bearer token, cuenta activa y rol admin", "auth_middleware.ts y admin_middleware.ts"],
        ["3 Validación", "Revisa formato, unicidad y referencias", "app/validators/user.ts"],
        ["4 Negocio", "Ejecuta consulta o modificación transaccional", "admin_users_controller.ts"],
        ["5 Persistencia", "Usa users, credentials, roles, dependencies y tokens", "Modelos Lucid"],
        ["6 Respuesta", "Oculta password_hash y expone datos públicos", "user_transformer.ts"],
    ],
    [3.0, 8.6, 5.2],
)

doc.add_heading("3 Catálogo de endpoints", level=1)
add_table(
    doc,
    ["Método", "Ruta", "Operación", "Respuesta"],
    [
        ["GET", "/api/v1/admin/users", "Listar, buscar y filtrar", "200"],
        ["POST", "/api/v1/admin/users", "Crear usuario", "201"],
        ["GET", "/api/v1/admin/users/{id}", "Consultar detalle", "200"],
        ["PATCH", "/api/v1/admin/users/{id}", "Editar usuario", "200"],
        ["PATCH", "/api/v1/admin/users/{id}/status", "Activar o desactivar", "200"],
        ["PATCH", "/api/v1/admin/users/{id}/password", "Restablecer contraseña", "200"],
    ],
    [2.2, 7.4, 5.2, 2.0],
)

doc.add_heading("3 1 Listado búsqueda y filtros", level=2)
doc.add_paragraph(
    "El listado devuelve data y meta. Los filtros son opcionales y se pueden combinar. El orden predeterminado "
    "es por id descendente. perPage admite como máximo 100 registros."
)
add_table(
    doc,
    ["Parámetro", "Tipo", "Uso"],
    [
        ["page", "number", "Página solicitada; valor inicial 1"],
        ["perPage", "number", "Elementos por página; valor inicial 20"],
        ["search", "string", "Busca en nombre, apellido y correo"],
        ["roleId", "number", "Filtra por rol"],
        ["dependencyId", "number", "Filtra por dependencia"],
        ["isActive", "boolean", "Filtra cuentas activas o inactivas"],
    ],
    [4.0, 3.0, 10.0],
)

doc.add_heading("3 2 Alta de usuario", level=2)
doc.add_paragraph(
    "El alta recibe dependencia, rol, nombre, apellidos, correo, contraseña y campos opcionales. La contraseña "
    "se transforma a hash antes de la transacción. users y credentials se crean juntos y se revierten juntos "
    "si ocurre un error."
)

doc.add_heading("3 3 Edición de usuario", level=2)
doc.add_paragraph(
    "La edición es parcial. Debe enviarse al menos un campo. Si cambia el correo, el mismo valor se actualiza "
    "en users y credentials dentro de una sola transacción. Un administrador no puede quitarse a sí mismo el "
    "rol admin."
)

doc.add_heading("3 4 Baja lógica y reactivación", level=2)
doc.add_paragraph(
    "La cuenta no se elimina. El endpoint de estado modifica is_active. Cuando cambia a false, elimina todos "
    "los tokens de acceso del usuario dentro de la misma transacción. Un administrador no puede desactivar su "
    "propia cuenta."
)

doc.add_heading("3 5 Restablecimiento de contraseña", level=2)
doc.add_paragraph(
    "El administrador envía password y passwordConfirmation. El backend genera un hash seguro, reemplaza "
    "password_hash y revoca todas las sesiones del usuario. La contraseña nunca se devuelve en la respuesta "
    "ni se escribe en los registros de auditoría."
)

doc.add_heading("4 Seguridad y reglas de negocio", level=1)
add_bullets(
    doc,
    [
        "Todas las rutas requieren Authorization: Bearer <token>.",
        "El usuario autenticado debe estar activo y tener un rol cuyo slug sea admin.",
        "La contraseña se almacena únicamente como hash en credentials.password_hash.",
        "La baja es lógica; no se expone un endpoint DELETE para usuarios.",
        "Desactivar una cuenta o restablecer su contraseña revoca todas sus sesiones.",
        "Se impide la autodesactivación y la pérdida accidental del propio rol administrador.",
        "Los eventos de creación, edición, estado y contraseña se registran con actorUserId y targetUserId.",
        "Los eventos de auditoría no incluyen contraseñas, hashes ni tokens.",
    ],
)

doc.add_heading("5 Datos y transacciones", level=1)
doc.add_paragraph(
    "El apartado 2.2 no necesita tablas nuevas. Reutiliza la estructura creada para autenticación y roles. "
    "Por lo tanto, no se requiere ejecutar una migración adicional en MySQL para estas funciones."
)
add_table(
    doc,
    ["Tabla", "Uso en 2.2"],
    [
        ["users", "Perfil, relación con rol y dependencia, y estado is_active"],
        ["credentials", "Correo de acceso y password_hash"],
        ["roles", "Autorización y asignación de rol"],
        ["dependencies", "Adscripción organizacional del usuario"],
        ["auth_access_tokens", "Revocación de sesiones al desactivar o restablecer contraseña"],
    ],
    [5.0, 12.0],
)

doc.add_heading("6 Formato de respuestas y errores", level=1)
doc.add_paragraph(
    "Las respuestas de usuario utilizan un transformador común. Incluyen datos públicos, rol y dependencia; "
    "nunca incluyen password_hash. El listado añade metadatos de paginación."
)
add_table(
    doc,
    ["Código", "Significado", "Ejemplo de causa"],
    [
        ["200", "Operación correcta", "Consulta, edición, estado o contraseña"],
        ["201", "Recurso creado", "Alta de usuario"],
        ["401", "No autenticado", "Token ausente, inválido o revocado"],
        ["403", "Sin permiso", "Usuario autenticado sin rol admin"],
        ["404", "No encontrado", "El id de usuario no existe"],
        ["409", "Conflicto de integridad", "Falta la credencial asociada"],
        ["422", "Solicitud inválida", "Campos incorrectos o regla de autoprotección"],
    ],
    [2.4, 5.0, 9.5],
)
doc.add_paragraph("Estructura uniforme de error:")
add_code(
    doc,
    [
        "{",
        '  "error": {',
        '    "code": "E_USER_NOT_FOUND",',
        '    "message": "Usuario no encontrado"',
        "  }",
        "}",
    ],
)

doc.add_heading("7 Contrato OpenAPI y cliente Orval", level=1)
doc.add_paragraph(
    "Swagger publica las rutas y esquemas del módulo. El archivo openapi/city-care.v1.yaml se sincronizó con "
    "el servidor y Orval generó sdk/generated/city-care.ts. El archivo generado no se edita manualmente."
)
add_table(
    doc,
    ["Operation ID", "Función generada", "Ruta"],
    [
        ["listUsers", "listUsers", "GET /admin/users"],
        ["createUser", "createUser", "POST /admin/users"],
        ["getUser", "getUser", "GET /admin/users/{id}"],
        ["updateUser", "updateUser", "PATCH /admin/users/{id}"],
        ["updateUserStatus", "updateUserStatus", "PATCH /admin/users/{id}/status"],
        ["resetUserPassword", "resetUserPassword", "PATCH /admin/users/{id}/password"],
    ],
    [4.5, 5.0, 7.5],
)
doc.add_paragraph("Comando de regeneración:")
add_code(doc, ["npm run openapi:generate"])

doc.add_heading("8 Pruebas y verificación", level=1)
doc.add_paragraph(
    "La suite contiene 14 pruebas funcionales específicas del módulo 2.2. Junto con las 9 pruebas de "
    "autenticación, el resultado final es 23 de 23 pruebas aprobadas."
)
add_table(
    doc,
    ["Grupo", "Casos comprobados"],
    [
        ["Autorización", "Sin token 401 y sin rol admin 403"],
        ["Consultas", "Listado, búsqueda, filtros, paginación, detalle y 404"],
        ["Alta", "Usuario y credencial creados en conjunto"],
        ["Edición", "Perfil, rol, dependencia y sincronización del correo"],
        ["Autoprotección", "No quitar propio rol ni desactivar propia cuenta"],
        ["Estado", "Desactivar, reactivar y revocar sesiones"],
        ["Contraseña", "Nuevo hash, revocación y login con contraseña nueva"],
        ["Eliminación", "La ruta DELETE no existe"],
    ],
    [4.1, 12.9],
)
doc.add_paragraph("Comandos de cierre ejecutados correctamente:")
add_code(doc, ["npm run typecheck", "npm run lint", "npm test", "npm run build", "node ace list:routes"])

doc.add_heading("9 Guía de operación", level=1)
guide_table = add_table(
    doc,
    ["Paso", "Acción"],
    [
        ["1", "Iniciar MySQL y confirmar que la base city-care está disponible"],
        ["2", "Ejecutar npm run dev en el backend"],
        ["3", "Iniciar sesión en POST /api/v1/auth/login con una cuenta admin activa"],
        ["4", "Copiar el token y enviar Authorization: Bearer <token>"],
        ["5", "Usar las rutas /api/v1/admin/users desde Swagger o el SDK Orval"],
        ["6", "Si cambia el contrato, sincronizar Swagger y volver a ejecutar Orval"],
    ],
    [2.0, 15.0],
)
for row in guide_table.rows[1:]:
    row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in row.cells[0].paragraphs[0].runs:
        run.font.bold = True

doc.add_heading("10 Criterio de cierre del apartado 2.2", level=1)
doc.add_paragraph(
    "El apartado 2.2 se considera terminado porque las nueve capacidades definidas están implementadas, "
    "protegidas, documentadas y comprobadas automáticamente. No queda una migración pendiente. La conexión "
    "de estas funciones con la vista administrativa del frontend corresponde a una etapa posterior y no cambia "
    "el estado de cierre del backend 2.2."
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUTPUT)
print(OUTPUT)
