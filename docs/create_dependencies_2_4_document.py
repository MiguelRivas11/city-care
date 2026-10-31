from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(r"C:\Users\migue\medula\city-care")
OUTPUT = ROOT / "docs" / "Documentacion_Completa_2_4_Dependencias.docx"
NAVY = "17365D"
PALE = "F4F6F8"
GREEN = "EAF6EF"
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
        item.set(qn("w:w"), "105")
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
                run.font.size = Pt(8.3)
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
                    run.font.size = Pt(8.3)
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
section.top_margin = Cm(1.8)
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
footer_run = footer.add_run("City Care  |  Dependencias 2.4  |  Página ")
footer_run.font.size = Pt(8)
footer_run.font.color.rgb = RGBColor(90, 90, 90)
page_number(footer)

doc.add_paragraph("Documentación completa 2.4 Dependencias", style="Title")
subtitle = doc.add_paragraph()
subtitle.add_run("Backend City Care  |  Versión 1.0").bold = True
subtitle.paragraph_format.space_after = Pt(18)

intro = doc.add_paragraph()
intro.add_run("Resultado. ").bold = True
intro.add_run(
    "El apartado 2.4 está terminado. City Care permite consultar, crear, editar, desactivar y "
    "reactivar dependencias; asignar responsables; proteger sus usuarios ante eliminaciones; y "
    "consumir todas estas operaciones mediante OpenAPI y Orval."
)

table(
    doc,
    ["Estado", "Cobertura", "Evidencia"],
    [
        ["COMPLETO", "6 de 6 puntos del apartado 2.4", "13 pruebas funcionales del módulo"],
        ["VALIDADO", "Sin regresiones en 2.1, 2.2 y 2.3", "46 de 46 pruebas aprobadas"],
        ["SINCRONIZADO", "MySQL, OpenAPI y Orval", "7 migraciones y 16 rutas API"],
    ],
    [3.0, 7.0, 7.0],
)

doc.add_heading("1 Alcance terminado", level=1)
table(
    doc,
    ["Punto", "Implementación", "Estado"],
    [
        ["Tabla y relación", "dependencies relacionada con users mediante dependency_id", "Listo"],
        ["Dependencia inicial", "El seeder conserva la dependencia administrativa base", "Listo"],
        ["Listado", "Paginación, búsqueda, estado y responsables", "Listo"],
        ["CRUD", "Alta, detalle, edición y baja lógica", "Listo"],
        ["Integridad", "ON DELETE RESTRICT evita borrados en cascada", "Listo"],
        ["Responsables", "Asignación transaccional de dependency_admin", "Listo"],
    ],
    [4.2, 10.2, 2.6],
)

doc.add_heading("2 Modelo de datos", level=1)
table(
    doc,
    ["Campo", "Tipo", "Regla"],
    [
        ["id", "unsigned integer", "Llave primaria"],
        ["name", "varchar", "Obligatorio y único mediante uq_dependencies_name"],
        ["description", "text nullable", "Descripción administrativa opcional"],
        ["is_active", "boolean", "Baja lógica; valor inicial true"],
        ["created_at / updated_at", "datetime", "Trazabilidad temporal"],
    ],
    [4.8, 4.0, 8.2],
)

doc.add_paragraph(
    "La migración 1793479000000_secure_and_activate_dependencies añade el estado, el índice único y "
    "reemplaza la clave foránea anterior. La relación users.dependency_id ahora aplica ON DELETE "
    "RESTRICT y ON UPDATE CASCADE."
)
code(
    doc,
    [
        "users.dependency_id -> dependencies.id",
        "ON DELETE RESTRICT",
        "ON UPDATE CASCADE",
    ],
)

doc.add_heading("3 Contrato HTTP", level=1)
table(
    doc,
    ["Método", "Ruta", "Operación", "Permiso"],
    [
        ["GET", "/api/v1/admin/dependencies", "Listar, buscar y filtrar", "dependencies.list"],
        ["POST", "/api/v1/admin/dependencies", "Crear", "dependencies.create"],
        ["GET", "/api/v1/admin/dependencies/:id", "Consultar detalle", "dependencies.read"],
        ["PATCH", "/api/v1/admin/dependencies/:id", "Editar nombre o descripción", "dependencies.update"],
        ["PATCH", "/api/v1/admin/dependencies/:id/status", "Activar o desactivar", "dependencies.status"],
        ["PATCH", "/api/v1/admin/dependencies/:id/managers", "Reemplazar responsables", "dependencies.manage"],
    ],
    [2.0, 6.3, 5.2, 3.5],
)

doc.add_heading("3.1 Listado", level=2)
bullets(
    doc,
    [
        "Acepta page, perPage, search e isActive.",
        "Incluye id, nombre, descripción, estado y responsables activos.",
        "El administrador general ve todas; dependency_admin solamente su dependencia.",
    ],
)

doc.add_heading("3.2 Alta y edición", level=2)
bullets(
    doc,
    [
        "El nombre es obligatorio al crear y no puede repetirse.",
        "La edición parcial exige al menos un campo.",
        "No se expone DELETE físico; el estado se modifica con la ruta /status.",
        "No se puede crear ni trasladar un usuario a una dependencia inactiva.",
    ],
)

doc.add_heading("3.3 Baja lógica", level=2)
doc.add_paragraph(
    "La desactivación se rechaza con conflicto 409 mientras exista al menos un usuario activo. Esto "
    "evita dejar cuentas operativas dentro de una dependencia cerrada. Una dependencia vacía puede "
    "desactivarse y reactivarse sin perder su historial."
)

doc.add_heading("4 Responsables por dependencia", level=1)
doc.add_paragraph(
    "Los responsables son usuarios activos de la misma dependencia cuyo rol es dependency_admin. "
    "La ruta de responsables reemplaza el conjunto completo dentro de una transacción."
)
table(
    doc,
    ["Validación", "Comportamiento"],
    [
        ["Misma dependencia", "No admite usuarios pertenecientes a otra dependencia"],
        ["Cuenta activa", "No admite responsables inactivos"],
        ["Sin duplicados", "Cada identificador aparece una sola vez"],
        ["Jerarquía", "No admite cuentas con rol admin"],
        ["Promoción", "Los seleccionados cambian a dependency_admin"],
        ["Reemplazo", "Los responsables retirados regresan al rol user"],
    ],
    [5.2, 11.8],
)

doc.add_heading("5 Autorización", level=1)
table(
    doc,
    ["Acción", "admin", "dependency_admin", "user"],
    [
        ["Listar dependencias", "Todas", "Solo la propia", "No"],
        ["Consultar detalle", "Cualquiera", "Solo la propia", "No"],
        ["Crear", "Sí", "No", "No"],
        ["Editar", "Sí", "No", "No"],
        ["Cambiar estado", "Sí", "No", "No"],
        ["Asignar responsables", "Sí", "No", "No"],
    ],
    [6.0, 3.8, 4.4, 2.8],
)

doc.add_paragraph(
    "Cada ruta declara un permiso exacto mediante el middleware parametrizado. El alcance de "
    "dependency_admin se valida adicionalmente por dependency_id; conocer otro identificador no "
    "permite consultar ni administrar otra dependencia."
)

doc.add_heading("6 Respuestas y errores", level=1)
table(
    doc,
    ["Código", "Identificador", "Significado"],
    [
        ["401", "E_UNAUTHORIZED_ACCESS", "Falta token o no es válido"],
        ["403", "E_PERMISSION_REQUIRED", "El rol no posee el permiso"],
        ["403", "E_DEPENDENCY_SCOPE", "Intento de acceso fuera del alcance"],
        ["404", "E_DEPENDENCY_NOT_FOUND", "La dependencia no existe"],
        ["409", "E_DEPENDENCY_HAS_ACTIVE_USERS", "No puede desactivarse con usuarios activos"],
        ["409", "E_DEPENDENCY_INACTIVE", "No puede recibir usuarios"],
        ["422", "E_EMPTY_DEPENDENCY_UPDATE", "Edición sin campos"],
        ["422", "E_INVALID_DEPENDENCY_MANAGERS", "Selección de responsables inválida"],
        ["422", "E_VALIDATION_ERROR", "Datos o nombre duplicado inválidos"],
    ],
    [2.0, 6.2, 8.8],
)

doc.add_heading("7 Auditoría", level=1)
bullets(
    doc,
    [
        "dependency_created registra actor y dependencia creada.",
        "dependency_updated registra actor, dependencia y campos modificados.",
        "dependency_status_updated registra actor, dependencia y estado.",
        "dependency_managers_updated registra actor, dependencia y responsables finales.",
    ],
)

doc.add_heading("8 OpenAPI y cliente Orval", level=1)
doc.add_paragraph(
    "El Swagger fue exportado desde el backend y Orval regeneró el SDK TypeScript. Las funciones "
    "disponibles para el futuro frontend son:"
)
table(
    doc,
    ["Función", "Uso"],
    [
        ["listDependencies", "Listado paginado y filtros"],
        ["createDependency", "Alta administrativa"],
        ["getDependency", "Consulta por id"],
        ["updateDependency", "Edición parcial"],
        ["updateDependencyStatus", "Baja lógica o reactivación"],
        ["updateDependencyManagers", "Reemplazo de responsables"],
    ],
    [7.0, 10.0],
)
code(doc, ["npm run openapi:generate", "# salida: sdk/generated/city-care.ts"])

doc.add_heading("9 Verificación automatizada", level=1)
table(
    doc,
    ["Prueba del 2.4", "Resultado"],
    [
        ["Autenticación y permiso requerido", "Aprobada"],
        ["Listado, búsqueda, filtro y responsables", "Aprobada"],
        ["Alcance del administrador de dependencia", "Aprobada"],
        ["Alta y nombre único", "Aprobada"],
        ["Dependencia inactiva no recibe usuarios", "Aprobada"],
        ["Edición parcial y cuerpo vacío", "Aprobada"],
        ["Baja lógica con protección de usuarios", "Aprobada"],
        ["Asignación y reemplazo transaccional", "Aprobada"],
        ["Responsables externos, inactivos o superiores", "Aprobada"],
        ["Integridad RESTRICT y ausencia de DELETE", "Aprobada"],
    ],
    [13.3, 3.7],
)

table(
    doc,
    ["Comprobación", "Resultado"],
    [
        ["npm run typecheck", "Sin errores"],
        ["npm run lint", "Sin errores"],
        ["npm run build", "Compilación exitosa"],
        ["npm test", "46 pruebas aprobadas"],
        ["OpenAPI + Orval", "Generación exitosa"],
    ],
    [10.5, 6.5],
)

doc.add_heading("10 Archivos principales", level=1)
table(
    doc,
    ["Archivo", "Responsabilidad"],
    [
        ["app/controllers/dependencies_controller.ts", "Casos de uso HTTP"],
        ["app/validators/dependency.ts", "Validación de entradas"],
        ["app/services/authorization_service.ts", "Permisos, alcance y estado"],
        ["database/migrations/1793479000000_secure_and_activate_dependencies.ts", "Estado e integridad"],
        ["tests/functional/dependencies.spec.ts", "Cobertura funcional"],
        ["openapi/city-care.v1.yaml", "Contrato OpenAPI"],
        ["sdk/generated/city-care.ts", "Cliente Orval generado"],
    ],
    [10.7, 6.3],
)

doc.add_heading("11 Conclusión", level=1)
conclusion = doc.add_table(rows=1, cols=1)
cell = conclusion.cell(0, 0)
fill(cell, GREEN)
borders(cell)
margins(cell)
cell.text = (
    "El apartado 2.4 queda cerrado: datos protegidos, administración completa con baja lógica, "
    "responsables con alcance controlado, contrato sincronizado y pruebas aprobadas. El siguiente "
    "bloque de trabajo es 2.5: integración final del SDK, Bearer y URL por entorno en el frontend."
)
for paragraph in cell.paragraphs:
    for run in paragraph.runs:
        run.font.size = Pt(10)
        run.font.bold = True

doc.core_properties.title = "City Care - Documentación completa 2.4 Dependencias"
doc.core_properties.subject = "Administración de dependencias, responsables e integridad"
doc.core_properties.author = "Proyecto City Care"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUTPUT)
print(OUTPUT)
