from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(r"C:\Users\migue\medula\city-care")
OUTPUT = ROOT / "docs" / "Documentacion_Completa_2_7_Cierre_Tecnico.docx"

doc = Document()
doc.settings.odd_and_even_pages_header_footer = False
section = doc.sections[0]
section.page_width = Cm(21)
section.page_height = Cm(29.7)
section.top_margin = Cm(2)
section.bottom_margin = Cm(1.8)
section.left_margin = Cm(2.1)
section.right_margin = Cm(2.1)

doc.core_properties.title = "Documentación completa 2.7 Cierre técnico"
doc.core_properties.subject = "Validación y liberación de City Care 1.0.0"
doc.core_properties.author = "Proyecto City Care"

NAVY = "17365D"
PALE = "EAF2F8"
LINE = "D9D9D9"
WHITE = "FFFFFF"
BLACK = "000000"


def shade(cell, fill):
    props = cell._tc.get_or_add_tcPr()
    node = props.find(qn("w:shd"))
    if node is None:
        node = OxmlElement("w:shd")
        props.append(node)
    node.set(qn("w:fill"), fill)


def margins(cell):
    props = cell._tc.get_or_add_tcPr()
    node = props.first_child_found_in("w:tcMar")
    if node is None:
        node = OxmlElement("w:tcMar")
        props.append(node)
    for name, value in (("top", 110), ("start", 125), ("bottom", 110), ("end", 125)):
        edge = node.find(qn(f"w:{name}"))
        if edge is None:
            edge = OxmlElement(f"w:{name}")
            node.append(edge)
        edge.set(qn("w:w"), str(value))
        edge.set(qn("w:type"), "dxa")


def border(cell):
    props = cell._tc.get_or_add_tcPr()
    borders = props.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        props.append(borders)
    for name in ("top", "left", "bottom", "right", "insideH", "insideV"):
        edge = borders.find(qn(f"w:{name}"))
        if edge is None:
            edge = OxmlElement(f"w:{name}")
            borders.append(edge)
        edge.set(qn("w:val"), "single")
        edge.set(qn("w:sz"), "6")
        edge.set(qn("w:color"), LINE)


def table(headers, rows, widths):
    result = doc.add_table(rows=1, cols=len(headers))
    result.alignment = WD_TABLE_ALIGNMENT.CENTER
    result.autofit = False
    for index, label in enumerate(headers):
        cell = result.rows[0].cells[index]
        cell.text = label
        cell.width = Cm(widths[index])
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        shade(cell, NAVY)
        margins(cell)
        border(cell)
        for run in cell.paragraphs[0].runs:
            run.font.bold = True
            run.font.color.rgb = RGBColor.from_string(WHITE)
            run.font.size = Pt(9)
    for row_index, values in enumerate(rows):
        cells = result.add_row().cells
        for index, value in enumerate(values):
            cells[index].text = str(value)
            cells[index].width = Cm(widths[index])
            cells[index].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            shade(cells[index], PALE if row_index % 2 else WHITE)
            margins(cells[index])
            border(cells[index])
            for paragraph in cells[index].paragraphs:
                paragraph.paragraph_format.space_after = Pt(0)
                for run in paragraph.runs:
                    run.font.size = Pt(8.8)
    result.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))
    doc.add_paragraph()
    return result


normal = doc.styles["Normal"]
normal.font.name = "Aptos"
normal.font.size = Pt(10.5)
normal.font.color.rgb = RGBColor.from_string(BLACK)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.13

title = doc.styles["Title"]
title.font.name = "Aptos Display"
title.font.size = Pt(25)
title.font.bold = True
title.font.color.rgb = RGBColor.from_string(BLACK)
title.paragraph_format.space_after = Pt(14)
title_ppr = title.element.get_or_add_pPr()
title_border = title_ppr.find(qn("w:pBdr"))
if title_border is not None:
    title_ppr.remove(title_border)

for name, size in (("Heading 1", 18), ("Heading 2", 14), ("Heading 3", 11.5)):
    style = doc.styles[name]
    style.font.name = "Aptos Display"
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = RGBColor.from_string(BLACK)
    style.paragraph_format.keep_with_next = True

footer = section.footer.paragraphs[0]
footer.text = "City Care  |  Cierre técnico 2.7  |  Versión 1.0.0"
footer.runs[0].font.size = Pt(8)
footer.runs[0].font.color.rgb = RGBColor(95, 95, 95)
page = section.footer.add_paragraph()
page.alignment = WD_ALIGN_PARAGRAPH.CENTER
field = OxmlElement("w:fldSimple")
field.set(qn("w:instr"), "PAGE")
page._p.append(field)


def bullet(text):
    paragraph = doc.add_paragraph(f"- {text}")
    paragraph.paragraph_format.left_indent = Cm(0.6)
    paragraph.paragraph_format.first_line_indent = Cm(-0.3)


# Portada
doc.add_paragraph("CITY CARE").runs[0].bold = True
doc.add_paragraph("Documentación completa 2.7 Cierre técnico", style="Title")
subtitle = doc.add_paragraph()
subtitle.add_run("Validación, control de versiones y liberación 1.0.0").bold = True
doc.add_paragraph(
    "El cierre técnico confirma que los módulos desarrollados entre los apartados 2.1 y 2.6 compilan, cumplen sus "
    "pruebas automatizadas y están respaldados por migraciones, contrato OpenAPI y documentación. El backend y el "
    "frontend quedan identificados como versión 1.0.0."
)

table(
    ["Indicador", "Resultado"],
    [
        ("Estado del apartado", "Completo"),
        ("Pruebas automatizadas", "46 de 46 aprobadas"),
        ("Rutas de API", "16 endpoints registrados"),
        ("Migraciones MySQL", "7 completadas"),
        ("Versión", "1.0.0"),
        ("Fecha de cierre", "31 de octubre de 2026"),
    ],
    [5.2, 10.9],
)

doc.add_heading("Conclusión", level=1)
doc.add_paragraph(
    "El apartado 2.7 queda cerrado. El backend aprobó lint, typecheck, build y las 46 pruebas funcionales. MySQL reporta "
    "las siete migraciones como completadas. El frontend original aprobó typecheck y build. Ambos proyectos cuentan con "
    "versión 1.0.0, registro de cambios y control de versiones."
)
doc.add_page_break()

doc.add_heading("1 Validaciones del backend", level=1)
table(
    ["Validación", "Comando", "Resultado"],
    [
        ("Estilo y reglas", "npm run lint", "Aprobado sin errores"),
        ("Tipos", "npm run typecheck", "Aprobado sin errores"),
        ("Pruebas", "npm test", "46 aprobadas de 46"),
        ("Compilación", "npm run build", "Build de producción generado"),
        ("Rutas", "node ace list:routes", "16 endpoints de API y 3 rutas de documentación"),
        ("Base de datos", "node ace migration:status", "7 migraciones completadas"),
    ],
    [4.3, 5.3, 6.5],
)

doc.add_heading("2 Cobertura funcional", level=1)
table(
    ["Bloque", "Pruebas", "Aspectos comprobados"],
    [
        ("Autenticación", "9", "Login, expiración, perfil, logout, inactivos, revocación, errores y rate limit."),
        ("Usuarios", "14", "Listado, filtros, detalle, alta transaccional, edición, estado, contraseña y baja lógica."),
        ("Roles y permisos", "10", "Matriz, alcance por dependencia, asignación y prevención de escalamiento."),
        ("Dependencias", "13", "CRUD, estado, integridad, responsables y restricciones transaccionales."),
        ("Total", "46", "Suite completa aprobada."),
    ],
    [4.1, 2.1, 9.9],
)

doc.add_heading("3 Entorno de pruebas", level=1)
doc.add_paragraph(
    "La suite usa SQLite de forma aislada para no modificar la base MySQL de desarrollo. El servidor funcional escucha "
    "en 127.0.0.1:3333, aplica siete migraciones al comenzar, limpia las tablas entre escenarios y revierte las migraciones "
    "al finalizar. La dirección explícita evita diferencias de resolución IPv4 e IPv6."
)
doc.add_page_break()

doc.add_heading("4 Rutas y contrato", level=1)
doc.add_paragraph(
    "El registro final contiene las rutas de autenticación, perfil, usuarios, roles y dependencias. Las rutas administrativas "
    "usan los middlewares auth y permission. Swagger permanece disponible en /swagger y la interfaz de consulta en /docs."
)
table(
    ["Grupo", "Cantidad", "Protección"],
    [
        ("Autenticación", "1", "Rate limiting y validación de credenciales"),
        ("Cuenta", "2", "Token Bearer"),
        ("Dependencias", "6", "Bearer y permiso específico"),
        ("Roles", "1", "Bearer y permiso específico"),
        ("Usuarios", "6", "Bearer y permiso específico"),
        ("Documentación", "3", "Acceso local de desarrollo"),
    ],
    [5.1, 2.4, 8.6],
)

doc.add_heading("5 Estado de MySQL", level=1)
doc.add_paragraph(
    "La base de datos city-care reporta como completed las migraciones de dependencias, usuarios, tokens, credenciales, "
    "roles, modificación de usuarios y seguridad de dependencias. No fue necesario agregar tablas nuevas para el 2.7."
)

doc.add_heading("6 Validaciones del frontend", level=1)
table(
    ["Validación", "Resultado"],
    [
        ("npm run typecheck", "Aprobado"),
        ("npm run build", "Aprobado con Nuxt 4.5.2"),
        ("Sesión administrativa", "Ruta protegida y panel disponible con sesión válida"),
        ("Versión", "1.0.0 registrada en package.json y package-lock.json"),
    ],
    [6.2, 9.9],
)
doc.add_page_break()

doc.add_heading("7 Control de versiones", level=1)
doc.add_paragraph(
    "El backend conserva su historial existente en la rama main y recibe un commit de cierre con la etiqueta v1.0.0. "
    "El frontend original no tenía repositorio; se inicializó como proyecto independiente para registrar su estado y "
    "aplicar la misma etiqueta de versión."
)
table(
    ["Proyecto", "Repositorio", "Versión", "Archivos de apoyo"],
    [
        ("Backend", r"C:\Users\migue\medula\city-care", "v1.0.0", "README.md y CHANGELOG.md"),
        ("Frontend", r"C:\Users\migue\OneDrive\Desktop\front-medular\mi-proyecto", "v1.0.0", "README.md y CHANGELOG.md"),
    ],
    [3.1, 7.7, 2.5, 3.8],
)

doc.add_heading("8 Contenido de la versión 1.0.0", level=1)
bullet("Autenticación segura y administración de sesiones.")
bullet("Administración completa de usuarios con baja lógica.")
bullet("Roles y permisos con alcance por dependencia.")
bullet("Administración de dependencias y responsables.")
bullet("Contrato OpenAPI, Swagger y SDK Orval.")
bullet("Frontend conectado para login y panel de usuarios.")
bullet("Documentación técnica de los apartados 2.1 a 2.7.")

doc.add_heading("9 Límites de esta liberación", level=1)
doc.add_paragraph(
    "La etiqueta 1.0.0 cierra la primera parte del sistema. Incidencias, equipos de trabajo, evidencias, recuperación de "
    "contraseña, auditoría ampliada y despliegue productivo permanecen como módulos de la siguiente etapa."
)

doc.add_heading("10 Procedimiento de comprobación", level=1)
bullet("Backend: ejecutar npm run lint, npm run typecheck, npm test y npm run build.")
bullet("Base de datos: ejecutar node ace migration:status.")
bullet("Frontend: ejecutar npm run typecheck y npm run build.")
bullet("Contrato: regenerar Orval cuando cambie OpenAPI y repetir las validaciones.")
bullet("Git: comprobar que HEAD conserva la etiqueta v1.0.0 y que no existen cambios pendientes.")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUTPUT)
print(OUTPUT)
