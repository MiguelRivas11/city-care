from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(r"C:\Users\migue\medula\city-care")
DOCS = ROOT / "docs"
ENDPOINT_OUTPUT = DOCS / "Documentacion_Contrato_Endpoint_Reportes_3_1.docx"
TECHNICAL_OUTPUT = DOCS / "Documentacion_Completa_3_1_Reportes.docx"

NAVY = "17365D"
PALE = "EAF2F8"
PALE_GRAY = "F3F4F6"
LINE = "D9D9D9"
WHITE = "FFFFFF"
BLACK = "000000"
GRAY = "666666"


def shade(cell, fill):
    props = cell._tc.get_or_add_tcPr()
    node = props.find(qn("w:shd"))
    if node is None:
        node = OxmlElement("w:shd")
        props.append(node)
    node.set(qn("w:fill"), fill)


def cell_margins(cell):
    props = cell._tc.get_or_add_tcPr()
    node = props.first_child_found_in("w:tcMar")
    if node is None:
        node = OxmlElement("w:tcMar")
        props.append(node)
    for name, value in (("top", 105), ("start", 115), ("bottom", 105), ("end", 115)):
        edge = node.find(qn(f"w:{name}"))
        if edge is None:
            edge = OxmlElement(f"w:{name}")
            node.append(edge)
        edge.set(qn("w:w"), str(value))
        edge.set(qn("w:type"), "dxa")


def cell_borders(cell):
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


def configure_document(title_text, subject, footer_text):
    doc = Document()
    section = doc.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(1.8)
    section.bottom_margin = Cm(1.7)
    section.left_margin = Cm(2.1)
    section.right_margin = Cm(2.1)

    doc.core_properties.title = title_text
    doc.core_properties.subject = subject
    doc.core_properties.author = "Proyecto City Care"

    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.3)
    normal.font.color.rgb = RGBColor.from_string(BLACK)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.12

    title = doc.styles["Title"]
    title.font.name = "Aptos Display"
    title.font.size = Pt(25)
    title.font.bold = True
    title.font.color.rgb = RGBColor.from_string(BLACK)
    title.paragraph_format.space_after = Pt(13)
    title_ppr = title.element.get_or_add_pPr()
    title_border = title_ppr.find(qn("w:pBdr"))
    if title_border is not None:
        title_ppr.remove(title_border)

    for name, size in (("Heading 1", 17), ("Heading 2", 13.5), ("Heading 3", 11.2)):
        style = doc.styles[name]
        style.font.name = "Aptos Display"
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(BLACK)
        style.paragraph_format.keep_with_next = True
        style.paragraph_format.space_before = Pt(10)
        style.paragraph_format.space_after = Pt(5)

    footer = section.footer.paragraphs[0]
    footer.text = footer_text
    footer.alignment = WD_ALIGN_PARAGRAPH.LEFT
    footer.runs[0].font.size = Pt(8)
    footer.runs[0].font.color.rgb = RGBColor.from_string(GRAY)
    page = section.footer.add_paragraph()
    page.alignment = WD_ALIGN_PARAGRAPH.CENTER
    field = OxmlElement("w:fldSimple")
    field.set(qn("w:instr"), "PAGE")
    page._p.append(field)
    return doc


def add_table(doc, headers, rows, widths, font_size=8.5, aligns=None):
    result = doc.add_table(rows=1, cols=len(headers))
    result.alignment = WD_TABLE_ALIGNMENT.CENTER
    result.autofit = False
    for index, label in enumerate(headers):
        cell = result.rows[0].cells[index]
        cell.text = label
        cell.width = Cm(widths[index])
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        shade(cell, NAVY)
        cell_margins(cell)
        cell_borders(cell)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in cell.paragraphs[0].runs:
            run.font.bold = True
            run.font.color.rgb = RGBColor.from_string(WHITE)
            run.font.size = Pt(font_size)
    for row_index, values in enumerate(rows):
        cells = result.add_row().cells
        for index, value in enumerate(values):
            cells[index].text = str(value)
            cells[index].width = Cm(widths[index])
            cells[index].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            shade(cells[index], PALE if row_index % 2 else WHITE)
            cell_margins(cells[index])
            cell_borders(cells[index])
            for paragraph in cells[index].paragraphs:
                paragraph.paragraph_format.space_after = Pt(0)
                paragraph.alignment = (
                    aligns[index] if aligns else WD_ALIGN_PARAGRAPH.LEFT
                )
                for run in paragraph.runs:
                    run.font.size = Pt(font_size)
    header_props = result.rows[0]._tr.get_or_add_trPr()
    repeat = OxmlElement("w:tblHeader")
    repeat.set(qn("w:val"), "true")
    header_props.append(repeat)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return result


def add_bullet(doc, text):
    paragraph = doc.add_paragraph(style="List Bullet")
    paragraph.add_run(text)
    paragraph.paragraph_format.space_after = Pt(3)
    return paragraph


def add_number(doc, text):
    paragraph = doc.add_paragraph(style="List Number")
    paragraph.add_run(text)
    paragraph.paragraph_format.space_after = Pt(3)
    return paragraph


def add_code(doc, code):
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.left_indent = Cm(0.35)
    paragraph.paragraph_format.right_indent = Cm(0.35)
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(8)
    props = paragraph._p.get_or_add_pPr()
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), PALE_GRAY)
    props.append(shading)
    run = paragraph.add_run(code)
    run.font.name = "Consolas"
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), "Consolas")
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), "Consolas")
    run.font.size = Pt(8.2)
    return paragraph


def add_cover(doc, title, subtitle, intro, indicators):
    brand = doc.add_paragraph("CITY CARE")
    brand.runs[0].bold = True
    brand.runs[0].font.size = Pt(11)
    doc.add_paragraph(title, style="Title")
    subtitle_p = doc.add_paragraph()
    subtitle_run = subtitle_p.add_run(subtitle)
    subtitle_run.bold = True
    subtitle_run.font.size = Pt(12)
    doc.add_paragraph(intro)
    add_table(doc, ["Indicador", "Definición"], indicators, [5.2, 10.9], 9)


def build_endpoint_document():
    doc = configure_document(
        "Contrato del endpoint de creación de reportes 3.1",
        "Datos que debe enviar el frontend y respuestas del backend",
        "City Care  |  Contrato del endpoint de reportes 3.1",
    )
    add_cover(
        doc,
        "Contrato del endpoint de creación de reportes 3.1",
        "Guía para conectar la aplicación móvil con el backend",
        "Este documento define exactamente cómo debe enviarse un reporte ciudadano. La petición requiere "
        "autenticación Bearer y formato multipart para transportar en una sola operación los datos del formulario, "
        "las coordenadas y la fotografía.",
        [
            ("Método", "POST"),
            ("Ruta", "/api/v1/reports"),
            ("Autenticación", "Bearer token obligatorio"),
            ("Contenido", "multipart/form-data"),
            ("Resultado correcto", "HTTP 201 Created"),
            ("Estado inicial", "Pendiente"),
        ],
    )
    doc.add_heading("Conclusión de integración", level=1)
    doc.add_paragraph(
        "El frontend no debe enviar el identificador del usuario, el folio, el estado ni el identificador de la "
        "dependencia. El backend toma al usuario desde el token, resuelve la categoría y genera los demás valores. "
        "En esta etapa la evidencia se conserva en preparación privada; fotoUrl se incorporará con MinIO en el 3.2."
    )
    doc.add_page_break()

    doc.add_heading("1 Petición HTTP", level=1)
    add_table(
        doc,
        ["Elemento", "Valor"],
        [
            ("URL de desarrollo", "http://localhost:3333/api/v1/reports"),
            ("Método", "POST"),
            ("Authorization", "Bearer <token_de_acceso>"),
            ("Content Type", "multipart/form-data; el cliente debe generar el boundary"),
            ("Cuerpo", "Campos de texto y archivo binario foto"),
        ],
        [5.1, 11.0],
        9,
    )
    doc.add_paragraph(
        "No se debe fijar manualmente el encabezado Content-Type cuando se usa FormData. El cliente HTTP agrega "
        "automáticamente el boundary necesario para separar los campos y el archivo."
    )

    doc.add_heading("2 Campos que recibe el backend", level=1)
    add_table(
        doc,
        ["Campo", "Tipo", "Obligatorio", "Reglas", "Ejemplo"],
        [
            ("categoria", "texto", "Sí", "2 a 100 caracteres; debe coincidir con una categoría activa", "Bache"),
            ("descripcion", "texto", "Condicional", "Máximo 2000; obligatoria cuando categoria es Otro", "Bache profundo"),
            ("direccion", "texto", "No", "Máximo 500 caracteres", "Av. Vallarta 120"),
            ("latitud", "número", "Sí", "Entre -90 y 90", "20.676650"),
            ("longitud", "número", "Sí", "Entre -180 y 180", "-103.347510"),
            ("precisionUbicacion", "número", "No", "Entre 0 y 100000; se interpreta en metros", "12.5"),
            ("origenUbicacion", "texto", "Sí", "Solo gps o manual", "gps"),
            ("foto", "archivo", "Sí", "JPG, JPEG o PNG; máximo 10 MB", "evidencia.png"),
        ],
        [2.7, 2.1, 2.2, 5.4, 3.0],
        7.6,
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )
    doc.add_paragraph(
        "La combinación latitud 0 y longitud 0 se rechaza aunque ambos números se encuentren dentro de sus rangos. "
        "Esto evita guardar la ubicación predeterminada que algunas aplicaciones usan cuando no lograron obtener GPS."
    )
    doc.add_page_break()

    doc.add_heading("3 Categorías aceptadas", level=1)
    doc.add_paragraph(
        "El campo categoria usa el nombre visible y debe coincidir con uno de estos valores activos. Los IDs son "
        "internos y no se envían desde el frontend."
    )
    add_table(
        doc,
        ["ID MySQL", "Código interno", "Valor de categoria", "Descripción obligatoria"],
        [
            (1, "pothole", "Bache", "No"),
            (2, "public_lighting", "Alumbrado público", "No"),
            (3, "water_leak", "Fuga de agua", "No"),
            (4, "accumulated_garbage", "Basura acumulada", "No"),
            (5, "damaged_traffic_light", "Semáforo dañado", "No"),
            (6, "damaged_sidewalk", "Banqueta dañada", "No"),
            (7, "fallen_tree", "Árbol caído", "No"),
            (8, "graffiti_or_vandalism", "Grafiti o vandalismo", "No"),
            (9, "other", "Otro", "Sí"),
        ],
        [2.2, 4.7, 5.8, 3.4],
        8.2,
        [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER],
    )

    doc.add_heading("4 Ejemplo con cURL", level=1)
    add_code(
        doc,
        'curl -X POST "http://localhost:3333/api/v1/reports" \\\n  -H "Authorization: Bearer TOKEN" \\\n  -F "categoria=Bache" \\\n  -F "descripcion=Bache profundo frente a una escuela" \\\n  -F "direccion=Avenida de prueba 123, Guadalajara" \\\n  -F "latitud=20.67665" \\\n  -F "longitud=-103.34751" \\\n  -F "precisionUbicacion=12.5" \\\n  -F "origenUbicacion=gps" \\\n  -F "foto=@evidencia.png;type=image/png"',
    )

    doc.add_heading("5 Ejemplo conceptual con FormData", level=1)
    add_code(
        doc,
        "const data = new FormData()\n"
        "data.append('categoria', 'Bache')\n"
        "data.append('descripcion', 'Bache profundo frente a una escuela')\n"
        "data.append('direccion', direccionDetectada)\n"
        "data.append('latitud', String(latitud))\n"
        "data.append('longitud', String(longitud))\n"
        "data.append('precisionUbicacion', String(precision))\n"
        "data.append('origenUbicacion', 'gps')\n"
        "data.append('foto', archivo)\n\n"
        "await createReport(data, { headers: { Authorization: `Bearer ${token}` } })",
    )
    doc.add_page_break()

    doc.add_heading("6 Respuesta correcta", level=1)
    doc.add_paragraph("El backend responde HTTP 201 con un objeto como el siguiente:")
    add_code(
        doc,
        '{\n'
        '  "id": 1,\n'
        '  "folio": "CC-2026-000001",\n'
        '  "categoria": "Bache",\n'
        '  "descripcion": "Bache profundo frente a una escuela",\n'
        '  "direccion": "Avenida de prueba 123, Guadalajara",\n'
        '  "latitud": 20.67665,\n'
        '  "longitud": -103.34751,\n'
        '  "precisionUbicacion": 12.5,\n'
        '  "origenUbicacion": "gps",\n'
        '  "estado": "Pendiente",\n'
        '  "estadoEvidencia": "Pendiente",\n'
        '  "creadoEn": "2026-10-31T21:00:00.000Z"\n'
        '}',
    )
    add_table(
        doc,
        ["Campo de respuesta", "Significado"],
        [
            ("id", "Llave primaria del reporte en MySQL."),
            ("folio", "Identificador público generado con año e ID."),
            ("estado", "Estado inicial visible; en la creación siempre es Pendiente."),
            ("estadoEvidencia", "Pendiente mientras la imagen esté en preparación local."),
            ("fotoUrl", "No se devuelve en 3.1; se agregará cuando MinIO esté integrado."),
            ("creadoEn", "Fecha y hora UTC en formato ISO 8601."),
        ],
        [5.0, 11.1],
        9,
    )

    doc.add_heading("7 Respuestas de error", level=1)
    add_table(
        doc,
        ["HTTP", "Código", "Causa"],
        [
            (401, "E_UNAUTHORIZED_ACCESS", "Falta el token, es inválido o ya expiró."),
            (422, "E_VALIDATION_ERROR", "Campo faltante, rango inválido, formato o fotografía no aceptada."),
            (422, "E_REPORT_CATEGORY_INVALID", "La categoría no existe o está inactiva."),
            (422, "E_REPORT_DESCRIPTION_REQUIRED", "Se eligió Otro sin descripción."),
            (422, "E_REPORT_LOCATION_INVALID", "Se recibió la combinación 0,0."),
            (422, "E_REPORT_LOCATION_SOURCE_INVALID", "El origen no es gps ni manual."),
        ],
        [2.0, 5.9, 8.2],
        8.5,
        [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )
    doc.add_page_break()

    doc.add_heading("8 Flujo interno de creación", level=1)
    for text in (
        "El middleware valida el token y obtiene al usuario autenticado.",
        "VineJS valida campos, rangos y archivo.",
        "El controlador localiza la categoría activa por su nombre.",
        "Se aplican las reglas especiales de Otro, coordenadas 0,0 y origen de ubicación.",
        "La fotografía se mueve a almacenamiento privado de preparación.",
        "Una transacción crea el reporte y su registro de evidencia.",
        "El folio se construye con el año y el ID autoincremental del reporte.",
        "Si la transacción falla, el archivo preparado se elimina para evitar archivos huérfanos.",
        "El backend responde 201 con los datos públicos del reporte.",
    ):
        add_number(doc, text)

    doc.add_heading("9 Lista de verificación para el frontend", level=1)
    for text in (
        "Conservar el token obtenido en el inicio de sesión y enviarlo como Bearer.",
        "Construir FormData; no enviar JSON para esta ruta.",
        "Usar exactamente los nombres de campo documentados.",
        "No enviar 0,0 cuando el GPS falle; solicitar corrección manual o reintentar.",
        "Enviar direccion como dato informativo; las coordenadas siguen siendo la referencia geográfica principal.",
        "Comprimir o rechazar imágenes que superen 10 MB.",
        "Mostrar los mensajes de error 401 y 422 de manera comprensible.",
        "No esperar fotoUrl hasta que se complete la etapa 3.2.",
    ):
        add_bullet(doc, text)

    doc.add_heading("10 Contrato generado", level=1)
    doc.add_paragraph(
        "La misma operación se encuentra en Swagger y en openapi/city-care.v1.yaml con operationId createReport. "
        "Orval genera la función createReport y construye el FormData con el archivo recibido por el frontend."
    )

    doc.save(ENDPOINT_OUTPUT)


def build_technical_document():
    doc = configure_document(
        "Documentación completa 3.1 Módulo de reportes",
        "Implementación técnica de creación de reportes ciudadanos",
        "City Care  |  Documentación técnica 3.1 Reportes",
    )
    add_cover(
        doc,
        "Documentación completa 3.1 Módulo de reportes",
        "Base de datos, backend, validaciones, evidencia y pruebas",
        "La etapa 3.1 incorpora la recepción autenticada de reportes ciudadanos, su persistencia transaccional en "
        "MySQL y la preparación privada de la fotografía. El módulo queda listo para sustituir el almacenamiento "
        "temporal por MinIO durante la etapa 3.2 sin cambiar los datos principales del reporte.",
        [
            ("Estado", "Completo"),
            ("Endpoint nuevo", "POST /api/v1/reports"),
            ("Tablas nuevas", "3"),
            ("Categorías iniciales", "9"),
            ("Migraciones totales", "10 completadas en MySQL"),
            ("Suite funcional", "52 de 52 pruebas aprobadas"),
        ],
    )
    doc.add_heading("Resultado", level=1)
    doc.add_paragraph(
        "MySQL contiene las tablas report_categories, reports y report_evidences. Cada tabla tiene una llave primaria "
        "id autoincremental y las relaciones están protegidas mediante llaves foráneas. El catálogo inicial quedó "
        "insertado con IDs del 1 al 9."
    )
    doc.add_page_break()

    doc.add_heading("1 Alcance funcional", level=1)
    for text in (
        "Crear un reporte únicamente para un usuario autenticado.",
        "Recibir datos y fotografía en una petición multipart/form-data.",
        "Validar categoría, descripción, ubicación, origen GPS o manual y evidencia.",
        "Generar el folio público y el estado inicial en el servidor.",
        "Guardar el reporte y la metadata de evidencia dentro de una transacción.",
        "Conservar la fotografía en un espacio privado de preparación hasta integrar MinIO.",
        "Publicar la operación en OpenAPI y regenerar el cliente Orval.",
        "Cubrir el comportamiento principal y los rechazos mediante pruebas funcionales.",
    ):
        add_bullet(doc, text)

    doc.add_heading("2 Arquitectura del flujo", level=1)
    add_table(
        doc,
        ["Paso", "Componente", "Responsabilidad"],
        [
            (1, "Aplicación móvil", "Forma el multipart con texto, coordenadas y fotografía."),
            (2, "Middleware auth", "Valida el token y aporta el usuario real."),
            (3, "Validador VineJS", "Comprueba tipos, límites, rangos y archivo."),
            (4, "ReportsController", "Aplica reglas de negocio y coordina la operación."),
            (5, "Staging service", "Mueve la imagen a almacenamiento privado con nombre UUID."),
            (6, "Transacción Lucid", "Crea reports y report_evidences de manera atómica."),
            (7, "MySQL", "Conserva los datos, relaciones, folio y metadata."),
            (8, "Respuesta HTTP", "Devuelve 201 y la representación pública del reporte."),
        ],
        [1.7, 4.3, 10.1],
        8.5,
        [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )

    doc.add_heading("3 Decisiones de diseño", level=1)
    doc.add_paragraph(
        "El usuario no se acepta como dato del formulario porque podría falsificarse. Se obtiene exclusivamente desde "
        "el token. El frontend envía el nombre visible de la categoría y el backend resuelve su ID, actividad y "
        "dependencia. La fotografía no se guarda como BLOB en MySQL; solo se registra su metadata y la clave del objeto."
    )
    doc.add_page_break()

    doc.add_heading("4 Modelo de datos", level=1)
    doc.add_heading("4.1 Tabla report_categories", level=2)
    add_table(
        doc,
        ["Columna", "Tipo", "Regla", "Uso"],
        [
            ("id", "INT UNSIGNED", "PK autoincremental", "Identificador interno."),
            ("dependency_id", "INT UNSIGNED", "FK nullable a dependencies.id; RESTRICT", "Dependencia que atenderá la categoría."),
            ("code", "VARCHAR 50", "Único y obligatorio", "Código estable para integraciones."),
            ("name", "VARCHAR 100", "Único y obligatorio", "Nombre que envía el frontend."),
            ("description", "TEXT", "Nullable", "Descripción administrativa."),
            ("requires_description", "BOOLEAN", "Default false", "Activa descripción obligatoria."),
            ("is_active", "BOOLEAN", "Default true", "Permite baja lógica de la categoría."),
            ("created_at", "TIMESTAMP", "Obligatorio", "Fecha de creación."),
            ("updated_at", "TIMESTAMP", "Obligatorio", "Fecha de actualización."),
        ],
        [3.4, 3.4, 4.5, 4.8],
        7.9,
    )

    doc.add_heading("4.2 Tabla reports", level=2)
    add_table(
        doc,
        ["Columna", "Tipo", "Regla", "Uso"],
        [
            ("id", "INT UNSIGNED", "PK autoincremental", "Identificador del reporte."),
            ("folio", "VARCHAR 32", "Único y obligatorio", "Folio público CC-AÑO-ID."),
            ("user_id", "INT UNSIGNED", "FK users.id; RESTRICT", "Autor autenticado."),
            ("category_id", "INT UNSIGNED", "FK report_categories.id; RESTRICT", "Clasificación elegida."),
            ("dependency_id", "INT UNSIGNED", "FK dependencies.id; nullable; RESTRICT", "Dependencia asignada por categoría."),
            ("description", "TEXT", "Nullable", "Detalle ciudadano."),
            ("address", "VARCHAR 500", "Nullable", "Dirección legible detectada."),
            ("latitude", "DECIMAL 9,6", "Obligatorio", "Latitud geográfica."),
            ("longitude", "DECIMAL 9,6", "Obligatorio", "Longitud geográfica."),
            ("location_accuracy", "DECIMAL 10,2", "Nullable", "Precisión aproximada en metros."),
            ("location_source", "VARCHAR 20", "Obligatorio", "gps o manual."),
            ("status", "VARCHAR 20", "Default pending", "Estado interno inicial."),
            ("created_at", "TIMESTAMP", "Obligatorio", "Fecha de creación."),
            ("updated_at", "TIMESTAMP", "Obligatorio", "Fecha de actualización."),
        ],
        [3.6, 3.3, 4.8, 4.4],
        7.5,
    )
    doc.add_page_break()

    doc.add_heading("4.3 Tabla report_evidences", level=2)
    add_table(
        doc,
        ["Columna", "Tipo", "Regla", "Uso"],
        [
            ("id", "INT UNSIGNED", "PK autoincremental", "Identificador de evidencia."),
            ("report_id", "INT UNSIGNED", "FK reports.id; CASCADE", "Reporte propietario."),
            ("kind", "VARCHAR 20", "Default image", "Tipo de evidencia."),
            ("storage_provider", "VARCHAR 30", "Default local_staging", "Proveedor actual."),
            ("storage_status", "VARCHAR 20", "Default staged", "Estado de transferencia."),
            ("bucket", "VARCHAR 100", "Nullable", "Bucket futuro de MinIO."),
            ("object_key", "VARCHAR 500", "Único y obligatorio", "Ruta lógica del archivo."),
            ("original_name", "VARCHAR 255", "Obligatorio", "Nombre recibido del cliente."),
            ("mime_type", "VARCHAR 100", "Obligatorio", "Tipo MIME validado."),
            ("size_bytes", "BIGINT UNSIGNED", "Obligatorio", "Tamaño del archivo."),
            ("created_at", "TIMESTAMP", "Obligatorio", "Fecha de creación."),
            ("updated_at", "TIMESTAMP", "Obligatorio", "Fecha de actualización."),
        ],
        [3.7, 3.3, 4.6, 4.5],
        7.6,
    )

    doc.add_heading("4.4 Relaciones verificadas en MySQL", level=2)
    add_table(
        doc,
        ["Origen", "Columna", "Destino", "Borrado"],
        [
            ("report_categories", "dependency_id", "dependencies.id", "RESTRICT"),
            ("reports", "user_id", "users.id", "RESTRICT"),
            ("reports", "category_id", "report_categories.id", "RESTRICT"),
            ("reports", "dependency_id", "dependencies.id", "RESTRICT"),
            ("report_evidences", "report_id", "reports.id", "CASCADE"),
        ],
        [4.7, 3.7, 4.9, 2.8],
        8.4,
    )

    doc.add_heading("4.5 Índices", level=2)
    doc.add_paragraph(
        "Se añadieron índices para categoría activa, dependencia, usuario y fecha, estado, coordenadas, reporte de "
        "evidencia y estado de almacenamiento. folio, code, name y object_key cuentan además con unicidad."
    )
    doc.add_page_break()

    doc.add_heading("5 Catálogo real cargado en MySQL", level=1)
    doc.add_paragraph(
        "La consulta directa realizada después de ejecutar el seeder confirmó los siguientes registros. Todos están "
        "activos y dependency_id permanece en null hasta definir el enrutamiento administrativo de cada categoría."
    )
    add_table(
        doc,
        ["ID", "Código", "Nombre", "Requiere descripción", "Activo"],
        [
            (1, "pothole", "Bache", "No", "Sí"),
            (2, "public_lighting", "Alumbrado público", "No", "Sí"),
            (3, "water_leak", "Fuga de agua", "No", "Sí"),
            (4, "accumulated_garbage", "Basura acumulada", "No", "Sí"),
            (5, "damaged_traffic_light", "Semáforo dañado", "No", "Sí"),
            (6, "damaged_sidewalk", "Banqueta dañada", "No", "Sí"),
            (7, "fallen_tree", "Árbol caído", "No", "Sí"),
            (8, "graffiti_or_vandalism", "Grafiti o vandalismo", "No", "Sí"),
            (9, "other", "Otro", "Sí", "Sí"),
        ],
        [1.3, 5.2, 5.2, 3.0, 1.4],
        8.0,
        [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
    )
    doc.add_paragraph(
        "Los IDs son autoincrementales. El seeder usa updateOrCreate por code, por lo que puede ejecutarse otra vez sin "
        "duplicar las categorías existentes."
    )

    doc.add_heading("6 Migraciones", level=1)
    add_table(
        doc,
        ["Orden", "Migración", "Resultado"],
        [
            (8, "create_report_categories_table", "Tabla de catálogo creada."),
            (9, "create_reports_table", "Tabla principal y relaciones creadas."),
            (10, "create_report_evidences_table", "Tabla de metadata y relación CASCADE creada."),
        ],
        [1.6, 8.5, 6.0],
        8.5,
        [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )
    doc.add_page_break()

    doc.add_heading("7 Componentes del backend", level=1)
    add_table(
        doc,
        ["Componente", "Responsabilidad"],
        [
            ("reports_controller.ts", "Autenticación, reglas de negocio, transacción, folio, carga de relaciones y respuesta 201."),
            ("report.ts validator", "Esquema de entrada multipart y límites de todos los campos."),
            ("report_evidence_staging_service.ts", "Nombre UUID, organización por año y mes, movimiento y eliminación compensatoria."),
            ("report.ts model", "Relaciones con usuario, categoría, dependencia y evidencias."),
            ("report_category.ts model", "Catálogo, actividad, dependencia y regla de descripción."),
            ("report_evidence.ts model", "Metadata y estado de almacenamiento."),
            ("handler.ts", "Conversión de errores del módulo al formato JSON uniforme."),
            ("routes.ts", "Registro de POST /api/v1/reports con middleware auth."),
        ],
        [5.5, 10.6],
        8.4,
    )

    doc.add_heading("8 Reglas de negocio", level=1)
    for text in (
        "El usuario siempre se obtiene del token de acceso.",
        "Solo una categoría activa y con nombre exacto puede utilizarse.",
        "Otro requiere una descripción no vacía.",
        "Latitud debe estar entre -90 y 90; longitud entre -180 y 180.",
        "La combinación 0,0 se considera ubicación inválida.",
        "El origen solo admite gps o manual.",
        "La fotografía es obligatoria, debe ser JPG, JPEG o PNG y no superar 10 MB.",
        "El reporte nace con estado interno pending y se presenta como Pendiente.",
        "El folio se genera como CC-AÑO-ID con seis posiciones para el ID.",
    ):
        add_bullet(doc, text)

    doc.add_heading("9 Atomicidad y archivos huérfanos", level=1)
    doc.add_paragraph(
        "El reporte y la evidencia se insertan dentro de la misma transacción. Antes de abrirla se prepara la imagen "
        "para evitar mantener una conexión ocupada durante el movimiento del archivo. Si MySQL rechaza la operación, "
        "el bloque de compensación elimina la imagen preparada. Así no queda un reporte sin metadata ni un archivo sin reporte."
    )
    doc.add_page_break()

    doc.add_heading("10 Almacenamiento de evidencia en 3.1", level=1)
    add_table(
        doc,
        ["Elemento", "Valor actual"],
        [
            ("Directorio privado", "storage/report-evidence-staging"),
            ("Estructura", "reports/AÑO/MES/UUID.extensión"),
            ("Proveedor registrado", "local_staging"),
            ("Estado registrado", "staged"),
            ("Bucket", "null"),
            ("Exposición pública", "Ninguna"),
            ("fotoUrl", "No se devuelve durante 3.1"),
        ],
        [5.2, 10.9],
        9,
    )
    doc.add_paragraph(
        "La carpeta está excluida del control de versiones. Este mecanismo es una transición segura para desarrollo, "
        "no el almacenamiento definitivo. En 3.2 se transferirá la evidencia a MinIO y se completarán bucket, provider, "
        "status y la URL de consulta."
    )

    doc.add_heading("11 Contrato OpenAPI y Orval", level=1)
    for text in (
        "El contrato documenta multipart/form-data y marca foto como binary.",
        "La operación tiene operationId createReport.",
        "La seguridad Bearer se declara en la ruta.",
        "Las respuestas 201, 401 y 422 están tipadas.",
        "Orval genera createReport y construye FormData para el frontend.",
        "La generación finalizó sin errores de validación del contrato.",
    ):
        add_bullet(doc, text)

    doc.add_heading("12 Manejo de errores", level=1)
    add_table(
        doc,
        ["Código", "Significado"],
        [
            ("E_VALIDATION_ERROR", "Entrada incompatible con el contrato."),
            ("E_REPORT_CATEGORY_INVALID", "Categoría inexistente o inactiva."),
            ("E_REPORT_DESCRIPTION_REQUIRED", "Falta descripción para Otro."),
            ("E_REPORT_LOCATION_INVALID", "Ubicación 0,0."),
            ("E_REPORT_LOCATION_SOURCE_INVALID", "Origen distinto de gps o manual."),
        ],
        [6.3, 9.8],
        8.6,
    )
    doc.add_page_break()

    doc.add_heading("13 Pruebas y validación técnica", level=1)
    add_table(
        doc,
        ["Validación", "Resultado"],
        [
            ("Creación sin autenticación", "Rechazada con 401."),
            ("Creación correcta", "Reporte, folio, coordenadas y evidencia verificados."),
            ("Coordenadas 0,0", "Rechazadas con error de ubicación."),
            ("Categoría Otro", "Descripción requerida."),
            ("Categoría desconocida o inactiva", "Rechazada."),
            ("Rangos, origen y fotografía", "Validaciones comprobadas."),
            ("Suite completa", "52 de 52 pruebas aprobadas."),
            ("TypeScript", "Sin errores."),
            ("ESLint", "Sin errores."),
            ("Build", "Compilación de producción correcta."),
            ("OpenAPI y Orval", "Contrato válido y SDK generado."),
            ("MySQL", "10 migraciones completadas y catálogo verificado."),
        ],
        [7.0, 9.1],
        8.7,
    )

    doc.add_heading("14 Operación y mantenimiento", level=1)
    add_code(
        doc,
        "node ace migration:status\n"
        "node ace migration:run\n"
        "node ace db:seed --files=database/seeders/report_category_seeder.ts\n"
        "npm run typecheck\n"
        "npm run lint\n"
        "npm test\n"
        "npm run build\n"
        "npm run openapi:generate",
    )
    doc.add_paragraph(
        "El seeder es idempotente por código. Antes de cambiar nombres visibles debe considerarse que el frontend de "
        "3.1 envía el nombre de la categoría. Como mejora posterior puede exponerse un endpoint de catálogo y enviar el "
        "código estable en lugar del nombre."
    )

    doc.add_heading("15 Pendiente para 3.2", level=1)
    for text in (
        "Configurar cliente, endpoint, credenciales y bucket de MinIO mediante variables de entorno.",
        "Subir la evidencia con una clave única y tipo MIME correcto.",
        "Actualizar provider, bucket y storage_status después de una transferencia exitosa.",
        "Generar una URL firmada o una ruta controlada para consultar la imagen.",
        "Definir reintentos y recuperación para transferencias fallidas.",
        "Migrar o procesar los archivos que permanezcan en local_staging.",
        "Añadir pruebas de integración de MinIO y expiración de URLs.",
    ):
        add_bullet(doc, text)

    doc.save(TECHNICAL_OUTPUT)


if __name__ == "__main__":
    DOCS.mkdir(parents=True, exist_ok=True)
    build_endpoint_document()
    build_technical_document()
    print(ENDPOINT_OUTPUT)
    print(TECHNICAL_OUTPUT)
