from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(r"C:\Users\migue\medula\city-care")
OUTPUT = ROOT / "docs" / "Documentacion_Completa_2_3_Roles_y_Permisos.docx"
NAVY = "17365D"
PALE = "F4F6F8"
GRID = "D9D9D9"


def fill(cell, color):
    props = cell._tc.get_or_add_tcPr()
    shading = props.find(qn("w:shd"))
    if shading is None:
        shading = OxmlElement("w:shd")
        props.append(shading)
    shading.set(qn("w:fill"), color)


def borders(cell):
    props = cell._tc.get_or_add_tcPr()
    node = props.first_child_found_in("w:tcBorders")
    if node is None:
        node = OxmlElement("w:tcBorders")
        props.append(node)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        part = node.find(qn("w:" + edge))
        if part is None:
            part = OxmlElement("w:" + edge)
            node.append(part)
        part.set(qn("w:val"), "single")
        part.set(qn("w:sz"), "6")
        part.set(qn("w:color"), GRID)


def margins(cell):
    props = cell._tc.get_or_add_tcPr()
    node = props.first_child_found_in("w:tcMar")
    if node is None:
        node = OxmlElement("w:tcMar")
        props.append(node)
    for side in ("top", "start", "bottom", "end"):
        item = OxmlElement("w:" + side)
        item.set(qn("w:w"), "110")
        item.set(qn("w:type"), "dxa")
        node.append(item)


def repeat_header(row):
    props = row._tr.get_or_add_trPr()
    item = OxmlElement("w:tblHeader")
    item.set(qn("w:val"), "true")
    props.append(item)


def page_number(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = " PAGE "
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instruction, end])


def table(doc, headers, rows, widths):
    result = doc.add_table(rows=1, cols=len(headers))
    result.autofit = False
    result.alignment = 1
    repeat_header(result.rows[0])
    for index, value in enumerate(headers):
        cell = result.rows[0].cells[index]
        cell.text = value
        cell.width = Cm(widths[index])
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        fill(cell, NAVY)
        borders(cell)
        margins(cell)
        for paragraph in cell.paragraphs:
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in paragraph.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.size = Pt(8.5)
    for row_index, values in enumerate(rows):
        cells = result.add_row().cells
        for index, value in enumerate(values):
            cells[index].text = str(value)
            cells[index].width = Cm(widths[index])
            cells[index].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if row_index % 2:
                fill(cells[index], PALE)
            borders(cells[index])
            margins(cells[index])
            for paragraph in cells[index].paragraphs:
                paragraph.paragraph_format.space_after = Pt(0)
                for run in paragraph.runs:
                    run.font.size = Pt(8.5)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return result


def bullets(doc, values):
    for value in values:
        paragraph = doc.add_paragraph(style="List Bullet")
        paragraph.add_run(value)
        paragraph.paragraph_format.space_after = Pt(3)


def code(doc, values):
    for index, value in enumerate(values):
        paragraph = doc.add_paragraph(style="No Spacing")
        paragraph.paragraph_format.left_indent = Cm(0.7)
        paragraph.paragraph_format.keep_together = True
        paragraph.paragraph_format.keep_with_next = index < len(values) - 1
        run = paragraph.add_run(value)
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

normal = doc.styles["Normal"]
normal.font.name = "Aptos"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
normal.font.size = Pt(10)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.08

title_style = doc.styles["Title"]
title_style.font.name = "Aptos Display"
title_style.font.size = Pt(28)
title_style.font.bold = True
title_style.font.color.rgb = RGBColor(0, 0, 0)
title_props = title_style._element.get_or_add_pPr()
title_border = title_props.find(qn("w:pBdr"))
if title_border is not None:
    title_props.remove(title_border)

for name, size in (("Heading 1", 17), ("Heading 2", 13), ("Heading 3", 11)):
    style = doc.styles[name]
    style.font.name = "Aptos Display"
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.paragraph_format.space_before = Pt(12)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.keep_with_next = True

footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer_run = footer.add_run("City Care  |  Roles y permisos 2.3  |  Página ")
footer_run.font.size = Pt(8)
footer_run.font.color.rgb = RGBColor(90, 90, 90)
page_number(footer)

doc.add_paragraph("Documentación completa 2 3 Roles y permisos", style="Title")
subtitle = doc.add_paragraph()
subtitle.add_run("Backend City Care  |  Versión 1.0").bold = True
subtitle.paragraph_format.space_after = Pt(18)

intro = doc.add_paragraph()
intro.add_run("Resultado. ").bold = True
intro.add_run(
    "El apartado 2.3 está terminado. City Care dispone de tres roles iniciales, una matriz centralizada "
    "de permisos, autorización por acción y aislamiento de los administradores de dependencia. El contrato "
    "OpenAPI, el cliente Orval, MySQL y las pruebas quedaron sincronizados."
)

table(
    doc,
    ["Estado", "Cobertura", "Evidencia"],
    [
        ["COMPLETO", "6 de 6 puntos del apartado 2.3", "10 pruebas funcionales nuevas"],
        ["VALIDADO", "Sin regresiones en 2.1 y 2.2", "33 de 33 pruebas aprobadas"],
        ["SINCRONIZADO", "MySQL, OpenAPI y Orval", "Rol dependency_admin y función listRoles"],
    ],
    [3.0, 7.0, 7.0],
)

doc.add_heading("1 Alcance terminado", level=1)
table(
    doc,
    ["Punto", "Implementación", "Estado"],
    [
        ["Tabla y relación", "Se conserva roles y la relación users.role_id", "Listo"],
        ["Roles iniciales", "admin, dependency_admin y user", "Listo"],
        ["Administrador de dependencia", "Alcance obligatorio por dependency_id", "Listo"],
        ["Matriz de permisos", "Servicio central con siete permisos", "Listo"],
        ["Endpoint de roles", "GET /api/v1/admin/roles", "Listo"],
        ["Autorización granular", "Middleware parametrizado por permiso", "Listo"],
    ],
    [4.4, 10.0, 2.6],
)

doc.add_heading("2 Modelo de roles", level=1)
table(
    doc,
    ["Rol", "Alcance", "Uso"],
    [
        ["admin", "Global", "Administra usuarios de todas las dependencias y asigna cualquier rol"],
        ["dependency_admin", "Su dependencia", "Administra cuentas locales con rol user"],
        ["user", "Cuenta propia", "Accede a autenticación y perfil; no usa rutas administrativas"],
    ],
    [4.2, 4.0, 8.8],
)
doc.add_paragraph(
    "Los permisos se resuelven mediante el slug del rol. Las rutas no preguntan solamente si el usuario es "
    "admin; cada una declara la acción exacta que requiere."
)

doc.add_heading("3 Matriz de permisos", level=1)
table(
    doc,
    ["Permiso", "admin", "dependency_admin", "user"],
    [
        ["roles.list", "Sí", "Sí, solo asignables", "No"],
        ["users.list", "Sí, global", "Sí, dependencia", "No"],
        ["users.read", "Sí, global", "Sí, dependencia", "No"],
        ["users.create", "Sí, global", "Sí, dependencia", "No"],
        ["users.update", "Sí, global", "Sí, dependencia", "No"],
        ["users.status", "Sí, global", "Sí, dependencia", "No"],
        ["users.reset_password", "Sí, global", "Sí, dependencia", "No"],
    ],
    [6.0, 3.5, 4.8, 2.7],
)

doc.add_heading("4 Reglas del administrador de dependencia", level=1)
bullets(
    doc,
    [
        "El listado se limita a cuentas con rol user y dependency_id igual al de la cuenta autenticada.",
        "Consultar, editar, activar, desactivar o restablecer una cuenta externa devuelve 403.",
        "Solo puede crear usuarios dentro de su propia dependencia.",
        "Solo puede asignar el rol user; no puede crear admin ni dependency_admin.",
        "No puede administrar cuentas admin o dependency_admin aunque compartan dependencia.",
        "No puede mover un usuario a otra dependencia.",
        "La baja lógica y el restablecimiento de contraseña conservan la revocación de sesiones del 2.2.",
    ],
)

doc.add_heading("5 Flujo de autorización", level=1)
table(
    doc,
    ["Etapa", "Comprobación", "Resultado de error"],
    [
        ["1 Autenticación", "Bearer token válido y cuenta activa", "401"],
        ["2 Permiso", "El rol contiene la acción requerida", "403 E_PERMISSION_REQUIRED"],
        ["3 Alcance", "La dependencia está dentro del ámbito del actor", "403 E_DEPENDENCY_SCOPE"],
        ["4 Asignación", "El actor puede asignar el rol solicitado", "403 E_ROLE_ASSIGNMENT_FORBIDDEN"],
        ["5 Jerarquía", "El rol del objetivo puede ser administrado", "403 E_ROLE_SCOPE"],
        ["6 Operación", "Validación y transacción del recurso", "200, 201 o error uniforme"],
    ],
    [3.3, 8.0, 5.7],
)

doc.add_heading("6 Endpoint de roles", level=1)
doc.add_paragraph(
    "GET /api/v1/admin/roles requiere roles.list. El administrador general recibe todos los roles. El "
    "administrador de dependencia recibe solamente user, porque es el único rol que puede asignar. Cada "
    "registro incluye id, name, slug, description y permissions."
)
code(
    doc,
    [
        "GET /api/v1/admin/roles",
        "Authorization: Bearer <token>",
        "",
        '{ "data": [{ "id": 3, "name": "Usuario", "slug": "user", "permissions": [] }] }',
    ],
)

doc.add_heading("7 Integración con perfil y frontend", level=1)
doc.add_paragraph(
    "El transformador de usuario incluye role.permissions en las respuestas de login, perfil y operaciones "
    "administrativas. El frontend puede usar esa lista para ocultar acciones no permitidas. El backend sigue "
    "siendo la autoridad final y vuelve a comprobar cada permiso."
)

doc.add_heading("8 Base de datos y seeder", level=1)
doc.add_paragraph(
    "No se agregó una tabla ni una migración. La tabla roles ya soportaba el tercer rol. El seeder fue "
    "actualizado y ejecutado sobre MySQL para registrar dependency_admin de forma idempotente. Las seis "
    "migraciones permanecen en estado completed."
)
table(
    doc,
    ["Slug", "Nombre", "Descripción"],
    [
        ["admin", "Administrador", "Acceso administrativo global"],
        ["dependency_admin", "Administrador de dependencia", "Administra usuarios de su dependencia"],
        ["user", "Usuario", "Acceso normal al sistema"],
    ],
    [5.0, 5.8, 6.2],
)

doc.add_heading("9 Archivos principales", level=1)
table(
    doc,
    ["Archivo", "Responsabilidad"],
    [
        ["authorization_service.ts", "Matriz, comprobación de alcance y roles asignables"],
        ["permission_middleware.ts", "Exige un permiso específico antes del controlador"],
        ["roles_controller.ts", "Publica roles asignables y sus permisos"],
        ["admin_users_controller.ts", "Aplica el alcance por dependencia"],
        ["new_account_controller.ts", "Impide altas externas o escalamiento de rol"],
        ["admin_seeder.ts", "Registra los tres roles iniciales"],
        ["roles_permissions.spec.ts", "Pruebas del apartado 2.3"],
    ],
    [7.0, 10.0],
)

doc.add_heading("10 OpenAPI y Orval", level=1)
doc.add_paragraph(
    "El contrato publica RolesListApiResponse, permissions dentro de RolePublic y la operación listRoles. "
    "Orval regeneró sdk/generated/city-care.ts y expone la función listRoles."
)
code(doc, ["npm run openapi:generate", "listRoles(options)"])

doc.add_page_break()
doc.add_heading("11 Pruebas y cierre", level=1)
table(
    doc,
    ["Grupo", "Casos"],
    [
        ["Roles", "Matriz completa para admin y roles asignables para dependency_admin"],
        ["Permisos", "Usuario normal rechazado con 403"],
        ["Aislamiento", "Listado y detalle limitados por dependencia"],
        ["Altas", "Alta local permitida y alta externa rechazada"],
        ["Escalamiento", "Asignación de admin rechazada"],
        ["Jerarquía", "Estado y contraseña de roles superiores rechazados"],
        ["Perfil", "Permisos del rol visibles para el frontend"],
    ],
    [5.0, 12.0],
)
doc.add_paragraph(
    "La suite finaliza con 33 de 33 pruebas aprobadas. TypeScript, ESLint, build, rutas, OpenAPI y Orval "
    "terminan sin errores. El apartado 2.3 queda cerrado; el siguiente bloque es 2.4 Dependencias."
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUTPUT)
print(OUTPUT)
