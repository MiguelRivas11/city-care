from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(r"C:\Users\migue\medula\city-care")
OUTPUT = ROOT / "docs" / "Documentacion_Completa_2_5_OpenAPI_Orval.docx"
NAVY, PALE, GRID = "17365D", "F4F6F8", "D9D9D9"


def fill(cell, color):
    props = cell._tc.get_or_add_tcPr()
    node = props.find(qn("w:shd"))
    if node is None:
        node = OxmlElement("w:shd")
        props.append(node)
    node.set(qn("w:fill"), color)


def format_cell(cell):
    props = cell._tc.get_or_add_tcPr()
    borders = props.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        props.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        part = borders.find(qn("w:" + edge))
        if part is None:
            part = OxmlElement("w:" + edge)
            borders.append(part)
        part.set(qn("w:val"), "single")
        part.set(qn("w:sz"), "6")
        part.set(qn("w:color"), GRID)
    margins = props.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        props.append(margins)
    for side in ("top", "start", "bottom", "end"):
        item = OxmlElement("w:" + side)
        item.set(qn("w:w"), "105")
        item.set(qn("w:type"), "dxa")
        margins.append(item)


def repeat_header(row):
    props = row._tr.get_or_add_trPr()
    item = OxmlElement("w:tblHeader")
    item.set(qn("w:val"), "true")
    props.append(item)


def add_page_number(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    text = OxmlElement("w:instrText")
    text.set(qn("xml:space"), "preserve")
    text.text = " PAGE "
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, text, end])


def add_table(doc, headers, rows, widths):
    table = doc.add_table(rows=1, cols=len(headers))
    table.autofit = False
    table.alignment = 1
    repeat_header(table.rows[0])
    for index, value in enumerate(headers):
        cell = table.rows[0].cells[index]
        cell.text = value
        cell.width = Cm(widths[index])
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        fill(cell, NAVY)
        format_cell(cell)
        for paragraph in cell.paragraphs:
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in paragraph.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.size = Pt(8.5)
    for row_index, values in enumerate(rows):
        cells = table.add_row().cells
        for index, value in enumerate(values):
            cells[index].text = str(value)
            cells[index].width = Cm(widths[index])
            cells[index].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if row_index % 2:
                fill(cells[index], PALE)
            format_cell(cells[index])
            for paragraph in cells[index].paragraphs:
                paragraph.paragraph_format.space_after = Pt(0)
                for run in paragraph.runs:
                    run.font.size = Pt(8.5)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)


def bullets(doc, items):
    for item in items:
        paragraph = doc.add_paragraph(style="List Bullet")
        paragraph.add_run(item)
        paragraph.paragraph_format.space_after = Pt(3)


def code(doc, lines):
    for index, line in enumerate(lines):
        paragraph = doc.add_paragraph(style="No Spacing")
        paragraph.paragraph_format.left_indent = Cm(0.7)
        paragraph.paragraph_format.keep_with_next = index < len(lines) - 1
        run = paragraph.add_run(line)
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

title = doc.styles["Title"]
title.font.name = "Aptos Display"
title.font.size = Pt(28)
title.font.bold = True
title.font.color.rgb = RGBColor(0, 0, 0)
title_props = title._element.get_or_add_pPr()
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
run = footer.add_run("City Care  |  OpenAPI y Orval 2.5  |  Página ")
run.font.size = Pt(8)
run.font.color.rgb = RGBColor(90, 90, 90)
add_page_number(footer)

doc.add_paragraph("Documentación completa 2 5 OpenAPI y Orval", style="Title")
subtitle = doc.add_paragraph()
subtitle.add_run("Integración backend y frontend City Care  |  Versión 1.0").bold = True
subtitle.paragraph_format.space_after = Pt(18)

opening = doc.add_paragraph()
opening.add_run("Resultado. ").bold = True
opening.add_run(
    "El apartado 2.5 está terminado. El contrato OpenAPI se conserva como fuente versionable, Orval "
    "genera las 16 operaciones del backend dentro del frontend Nuxt y un cliente HTTP común resuelve "
    "la URL del entorno, el Bearer, las respuestas JSON y los errores de la API."
)

add_table(
    doc,
    ["Estado", "Cobertura", "Evidencia"],
    [
        ["COMPLETO", "6 de 6 puntos del apartado 2.5", "SDK con 16 operaciones"],
        ["VALIDADO", "Orval, TypeScript y build Nuxt", "Tres comandos exitosos"],
        ["INTEGRADO", "Login, perfil y logout", "Sesión y Bearer centralizados"],
    ],
    [3.0, 7.0, 7.0],
)

doc.add_heading("1 Alcance terminado", level=1)
add_table(
    doc,
    ["Punto", "Implementación", "Estado"],
    [
        ["Swagger", "Contrato disponible en /swagger e interfaz en /docs", "Listo"],
        ["Cliente Orval", "16 funciones y tipos generados en el frontend", "Listo"],
        ["Bearer centralizado", "cityCareFetch agrega Authorization automáticamente", "Listo"],
        ["URL por entorno", "NUXT_PUBLIC_API_BASE_URL mediante runtimeConfig", "Listo"],
        ["Regeneración", "npm run openapi:generate usa el contrato local", "Listo"],
        ["Frontend real", "SDK y sesión integrados en mi-proyecto", "Listo"],
    ],
    [4.2, 10.2, 2.6],
)

doc.add_heading("2 Flujo de generación", level=1)
doc.add_paragraph(
    "El backend es la autoridad del contrato. La copia versionada openapi/city-care.v1.yaml se coloca "
    "en el frontend y Orval transforma sus esquemas, parámetros, cuerpos y respuestas en TypeScript. "
    "El archivo generado no se edita manualmente."
)
code(
    doc,
    [
        "backend: openapi/city-care.v1.yaml",
        "frontend: openapi/city-care.v1.yaml",
        "npm run openapi:generate",
        "salida: app/generated/api/city-care.ts",
    ],
)

doc.add_page_break()
doc.add_heading("3 Operaciones generadas", level=1)
add_table(
    doc,
    ["Grupo", "Funciones"],
    [
        ["Autenticación", "login, getProfile, logout"],
        ["Dependencias", "list, create, get, update, updateStatus, updateManagers"],
        ["Roles", "listRoles"],
        ["Usuarios", "list, create, get, update, updateStatus, resetPassword"],
    ],
    [4.2, 12.8],
)

doc.add_heading("4 Cliente HTTP central", level=1)
doc.add_paragraph(
    "Orval utiliza app/services/api/api.client.ts como mutator. Todas las funciones pasan por "
    "cityCareFetch, por lo que ninguna vista necesita repetir la lectura del token ni construir "
    "manualmente encabezados de autenticación."
)
bullets(
    doc,
    [
        "Lee la cookie city-care-token al ejecutar cada solicitud.",
        "Agrega Authorization: Bearer cuando existe una sesión.",
        "Solicita y procesa JSON con Accept: application/json.",
        "Conserva credentials: include para escenarios con cookies.",
        "Convierte respuestas no exitosas en CityCareApiError con status y error de la API.",
    ],
)

doc.add_heading("5 Configuración por entorno", level=1)
doc.add_paragraph(
    "Nuxt expone apiBaseUrl mediante runtimeConfig.public. El valor se obtiene de "
    "NUXT_PUBLIC_API_BASE_URL, por lo que el mismo código puede utilizar desarrollo, pruebas, staging "
    "o producción sin volver a generar el SDK."
)
add_table(
    doc,
    ["Entorno", "Ejemplo"],
    [
        ["Desarrollo", "NUXT_PUBLIC_API_BASE_URL=http://localhost:3333"],
        ["Staging", "NUXT_PUBLIC_API_BASE_URL=https://api-staging.ejemplo.mx"],
        ["Producción", "NUXT_PUBLIC_API_BASE_URL=https://api.ejemplo.mx"],
    ],
    [4.2, 12.8],
)

doc.add_heading("6 Ciclo de sesión", level=1)
add_table(
    doc,
    ["Momento", "Comportamiento"],
    [
        ["Login", "Guarda token y usuario; dirige al panel según el rol"],
        ["Recarga", "El plugin auth.client restaura el perfil si existe token"],
        ["Solicitud protegida", "El mutator agrega el Bearer sin intervención del componente"],
        ["Token inválido", "La restauración limpia la sesión local"],
        ["Logout", "Revoca el token en el backend y limpia el estado local"],
    ],
    [4.2, 12.8],
)

doc.add_heading("7 Archivos principales", level=1)
add_table(
    doc,
    ["Archivo", "Responsabilidad"],
    [
        ["openapi/city-care.v1.yaml", "Contrato versionado del backend"],
        ["orval.config.ts", "Entrada, salida, cliente fetch y mutator"],
        ["app/generated/api/city-care.ts", "Tipos y funciones generadas"],
        ["app/services/api/api.client.ts", "Bearer y manejo uniforme de errores"],
        ["app/services/auth/auth.service.ts", "Login, perfil y logout"],
        ["app/composables/useAuth.ts", "Estado, persistencia y restauración"],
        ["app/plugins/auth.client.ts", "Restauración al iniciar el navegador"],
        ["nuxt.config.ts", "URL pública por entorno"],
    ],
    [10.0, 7.0],
)

doc.add_heading("8 Validación técnica", level=1)
add_table(
    doc,
    ["Comprobación", "Resultado"],
    [
        ["npm run openapi:generate", "Orval 8.46 genera 16 operaciones"],
        ["npm run typecheck", "Nuxt y vue-tsc sin errores"],
        ["npm run build", "Build de producción exitoso"],
        ["Respuesta local", "Frontend y backend responden HTTP 200"],
        ["npm audit", "Sin vulnerabilidades altas ni críticas; quedan avisos moderados transitivos"],
    ],
    [7.0, 10.0],
)

doc.add_heading("9 Uso para el equipo", level=1)
bullets(
    doc,
    [
        "Actualizar primero el contrato OpenAPI cuando cambie una ruta del backend.",
        "Copiar el contrato actualizado al frontend y ejecutar npm run openapi:generate.",
        "No modificar app/generated/api/city-care.ts manualmente.",
        "Consumir las funciones generadas desde servicios o composables de cada módulo.",
        "Ejecutar typecheck y build antes de integrar cambios.",
    ],
)

doc.add_heading("10 Conclusión", level=1)
conclusion = doc.add_paragraph()
conclusion.add_run("El apartado 2.5 queda cerrado. ").bold = True
conclusion.add_run(
    "Backend y frontend comparten un contrato verificable, la autenticación se adjunta desde un único "
    "punto y el SDK puede regenerarse de forma repetible. El siguiente bloque es 2.6: conectar los "
    "paneles visuales con las operaciones ya disponibles y proteger las rutas por rol."
)

doc.core_properties.title = "City Care Documentación completa 2 5 OpenAPI y Orval"
doc.core_properties.subject = "Contrato, SDK, autenticación y configuración por entorno"
doc.core_properties.author = "Proyecto City Care"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUTPUT)
print(OUTPUT)
