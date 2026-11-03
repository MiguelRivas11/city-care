from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUTPUT = Path(__file__).resolve().parent / "Documentacion_Prioridad_Alta_Punto_2_Control_Concurrencia.docx"

NAVY = "17365D"
PALE_BLUE = "EAF2F8"
PALE_GRAY = "F5F7F9"
LIGHT_BORDER = "D9D9D9"
BLACK = RGBColor(0, 0, 0)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=110, start=120, bottom=110, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for name, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{name}"))
        if node is None:
            node = OxmlElement(f"w:{name}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_borders(table):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = borders.find(qn(f"w:{edge}"))
        if tag is None:
            tag = OxmlElement(f"w:{edge}")
            borders.append(tag)
        tag.set(qn("w:val"), "single")
        tag.set(qn("w:sz"), "6")
        tag.set(qn("w:space"), "0")
        tag.set(qn("w:color"), LIGHT_BORDER)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def prevent_row_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    cant_split.set(qn("w:val"), "true")
    tr_pr.append(cant_split)


def set_cell_width(cell, width_inches):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(int(width_inches * 1440)))
    tc_w.set(qn("w:type"), "dxa")


def add_table(doc, headers, rows, widths):
    table = doc.add_table(rows=1, cols=len(headers))
    table.autofit = False
    set_table_borders(table)
    header = table.rows[0]
    set_repeat_table_header(header)
    prevent_row_split(header)
    for idx, text in enumerate(headers):
        cell = header.cells[idx]
        set_cell_width(cell, widths[idx])
        set_cell_shading(cell, NAVY)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(text)
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(9.5)
    for row_idx, values in enumerate(rows):
        row = table.add_row()
        prevent_row_split(row)
        for idx, text in enumerate(values):
            cell = row.cells[idx]
            set_cell_width(cell, widths[idx])
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if row_idx % 2 == 1:
                set_cell_shading(cell, PALE_BLUE)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            run = p.add_run(str(text))
            run.font.size = Pt(9.2)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return table


def set_keep_with_next(paragraph):
    paragraph.paragraph_format.keep_with_next = True


def add_heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    set_keep_with_next(p)
    return p


def add_body(doc, text, bold_lead=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(7)
    p.paragraph_format.line_spacing = 1.12
    if bold_lead and text.startswith(bold_lead):
        first, rest = text[: len(bold_lead)], text[len(bold_lead) :]
        p.add_run(first).bold = True
        p.add_run(rest)
    else:
        p.add_run(text)
    return p


def add_bullet(doc, text, level=0):
    style = "List Bullet" if level == 0 else "List Bullet 2"
    p = doc.add_paragraph(text, style=style)
    p.paragraph_format.space_after = Pt(2.5)
    return p


def add_number(doc, number, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.first_line_indent = Inches(-0.25)
    p.paragraph_format.space_after = Pt(3)
    p.add_run(f"{number}.  ").bold = False
    p.add_run(text)
    return p


def add_code(doc, code):
    for line in code.strip("\n").splitlines():
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.28)
        p.paragraph_format.right_indent = Inches(0.15)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        run = p.add_run(line or " ")
        run.font.name = "Consolas"
        run._element.rPr.rFonts.set(qn("w:ascii"), "Consolas")
        run._element.rPr.rFonts.set(qn("w:hAnsi"), "Consolas")
        run.font.size = Pt(8.5)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld_char_1 = OxmlElement("w:fldChar")
    fld_char_1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char_2 = OxmlElement("w:fldChar")
    fld_char_2.set(qn("w:fldCharType"), "end")
    run._r.extend([fld_char_1, instr_text, fld_char_2])


def configure_styles(doc):
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Aptos"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = BLACK

    title = styles["Title"]
    title.font.name = "Aptos Display"
    title._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
    title._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
    title.font.size = Pt(25)
    title.font.bold = True
    title.font.color.rgb = BLACK
    if title._element.pPr is not None:
        border = title._element.pPr.find(qn("w:pBdr"))
        if border is not None:
            title._element.pPr.remove(border)

    for style_name, size in (("Heading 1", 16), ("Heading 2", 12.5), ("Heading 3", 11)):
        style = styles[style_name]
        style.font.name = "Aptos Display"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = BLACK
        style.paragraph_format.space_before = Pt(12 if style_name == "Heading 1" else 8)
        style.paragraph_format.space_after = Pt(5)


def build_document():
    doc = Document()
    configure_styles(doc)

    section = doc.sections[0]
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(0.82)
    section.right_margin = Inches(0.82)

    footer = section.footer
    footer_p = footer.paragraphs[0]
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_p.add_run("City Care  |  Control de concurrencia  |  Página ")
    add_page_number(footer_p)
    for run in footer_p.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(89, 89, 89)

    title = doc.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    title.paragraph_format.space_before = Pt(52)
    title.paragraph_format.space_after = Pt(14)
    title.add_run("Control de concurrencia en reportes")

    subtitle = doc.add_paragraph()
    subtitle.paragraph_format.space_after = Pt(24)
    run = subtitle.add_run("Documentación técnica del punto 2 de prioridad alta")
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(64, 64, 64)

    meta = add_table(
        doc,
        ["Elemento", "Información"],
        [
            ["Proyecto", "City Care"],
            ["Componente", "Reportes e incidencias"],
            ["Versión documentada", "1.0"],
            ["Fecha", "2 de noviembre de 2026"],
            ["Estado", "Implementado y validado"],
        ],
        [1.7, 4.6],
    )
    meta.rows[0].cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
    meta.rows[0].cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT

    add_heading(doc, "Resumen", 1)
    add_body(
        doc,
        "El punto 2 incorpora control de concurrencia optimista en los reportes. Cada reporte conserva una versión numérica y toda operación crítica indica la versión que el administrador tenía visible. Si el registro cambió antes de confirmar la operación, el backend rechaza la solicitud con HTTP 409 y evita sobrescribir información más reciente.",
    )
    add_body(
        doc,
        "La solución cubre cambios de estado, asignaciones, reasignaciones, retiro de equipos y revisión de posibles duplicados. También actualiza el panel administrativo, el contrato OpenAPI y los clientes generados con Orval. La implementación quedó validada con compilación y 66 pruebas funcionales aprobadas.",
    )

    doc.add_page_break()

    add_heading(doc, "1 Objetivo y alcance", 1)
    add_body(
        doc,
        "El objetivo es impedir que dos administradores modifiquen el mismo reporte a partir de datos desactualizados. El mecanismo no bloquea la lectura ni mantiene bloqueos durante el tiempo que una persona observa la pantalla. La comprobación ocurre al guardar y se complementa con un bloqueo transaccional breve sobre la fila afectada.",
    )
    add_bullet(doc, "Evitar la pérdida silenciosa de cambios realizados por otro administrador.")
    add_bullet(doc, "Mantener una única asignación activa por reporte.")
    add_bullet(doc, "Conservar el historial de asignaciones y estados.")
    add_bullet(doc, "Informar al usuario cuando su vista quedó desactualizada.")
    add_bullet(doc, "Mantener sincronizados backend, OpenAPI, Orval y panel administrativo.")

    add_heading(doc, "2 Problema que resuelve", 1)
    add_body(
        doc,
        "Sin esta protección, dos administradores pueden abrir el mismo folio con los mismos datos. Si el primero asigna una cuadrilla y después el segundo guarda una asignación distinta desde la pantalla anterior, la segunda operación puede sustituir la primera sin advertencia. El mismo riesgo existe en los cambios de estado y en el retiro de una asignación.",
    )
    add_body(
        doc,
        "Con el control implementado, la primera operación incrementa la versión. La segunda solicitud conserva la versión anterior, por lo que el backend detecta el conflicto, devuelve HTTP 409 y obliga a recargar el reporte antes de volver a decidir.",
    )

    add_heading(doc, "3 Diseño de la solución", 1)
    add_number(doc, 1, "El backend entrega el reporte con su campo version.")
    add_number(doc, 2, "El panel conserva esa versión mientras el administrador revisa la información.")
    add_number(doc, 3, "La operación de escritura envía expectedVersion junto con los demás datos.")
    add_number(doc, 4, "La transacción bloquea la fila del reporte y compara ambas versiones.")
    add_number(doc, 5, "Si coinciden, se guarda la operación y se incrementa version. Si no coinciden, se devuelve HTTP 409.")

    add_table(
        doc,
        ["Concepto", "Función"],
        [
            ["version", "Versión actual almacenada en la tabla reports."],
            ["expectedVersion", "Versión que el cliente tenía visible al iniciar la operación."],
            ["Bloqueo de fila", "Serializa escrituras concurrentes dentro de una transacción corta."],
            ["HTTP 409", "Indica que la operación entra en conflicto con el estado vigente."],
            ["Recarga", "Actualiza el panel para que el administrador decida con información reciente."],
        ],
        [1.7, 4.6],
    )

    add_heading(doc, "4 Cambios en MySQL", 1)
    add_body(
        doc,
        "Se agregó la migración 1796000000900_add_report_version_column. La migración modifica la tabla reports y crea una columna version de tipo entero sin signo, obligatoria y con valor inicial 1. Los reportes existentes reciben ese valor al aplicar la migración.",
    )
    add_code(
        doc,
        """
table.integer('version').unsigned().notNullable().defaultTo(1)
""",
    )
    add_body(
        doc,
        "La migración se ejecutó en la base MySQL real y aparece con estado completed en el lote 10. No fue necesario crear una tabla adicional porque la versión pertenece al ciclo de vida del reporte.",
    )

    add_heading(doc, "5 Cambios en el backend", 1)
    add_table(
        doc,
        ["Componente", "Responsabilidad"],
        [
            ["report_concurrency_service.ts", "Compara expectedVersion y aumenta la versión del reporte."],
            ["report_queries_controller.ts", "Protege cambios de estado y revisiones de duplicados."],
            ["work_teams_controller.ts", "Protege asignaciones, reasignaciones y desasignaciones."],
            ["report_presenter_service.ts", "Incluye version en las respuestas públicas y de detalle."],
            ["report.ts y work_team.ts", "Exigen expectedVersion en las operaciones críticas."],
            ["handler.ts", "Normaliza los mensajes de conflicto enviados a los clientes."],
        ],
        [2.25, 4.05],
    )

    add_heading(doc, "5.1 Servicio de concurrencia", 2)
    add_body(
        doc,
        "La función assertReportVersion compara la versión bloqueada en MySQL con la versión enviada por el cliente. Si son distintas, lanza una excepción con estado 409 y código E_REPORT_CONCURRENCY_CONFLICT. La función incrementReportVersion aumenta la versión antes de guardar la operación aceptada.",
    )
    add_code(
        doc,
        """
if (report.version !== expectedVersion) {
  throw new Exception(
    'El reporte fue modificado por otro usuario. Recarga la información antes de continuar',
    { status: 409, code: 'E_REPORT_CONCURRENCY_CONFLICT' }
  )
}
""",
    )

    add_heading(doc, "5.2 Transacciones y bloqueo", 2)
    add_body(
        doc,
        "Las escrituras consultan nuevamente el reporte dentro de una transacción y utilizan forUpdate. La comparación se realiza después de adquirir el bloqueo. Esta secuencia evita que dos solicitudes que llegan casi al mismo tiempo validen la misma versión y escriban ambas como si fueran la primera.",
    )
    add_body(
        doc,
        "En una reasignación se cierran las asignaciones activas anteriores, se crea la nueva asignación, se actualiza currentAssignmentId y se incrementa version dentro de la misma transacción. Si cualquier paso falla, la transacción se revierte completa.",
    )

    add_heading(doc, "6 Operaciones protegidas", 1)
    add_table(
        doc,
        ["Operación", "Método y ruta", "Protección"],
        [
            ["Cambiar estado", "PATCH /api/v1/admin/reports/{id}/status", "Versión y bloqueo del reporte"],
            ["Asignar o reasignar", "POST /api/v1/admin/reports/{id}/assignments", "Versión, bloqueo y cierre de asignaciones activas"],
            ["Retirar asignación", "DELETE /api/v1/admin/reports/{id}/assignment", "Versión y bloqueo del reporte"],
            ["Revisar duplicado", "PATCH /api/v1/admin/reports/{id}/possible-duplicates/{reviewId}", "Bloqueo de revisión y estado pendiente"],
        ],
        [1.35, 3.25, 1.8],
    )

    add_heading(doc, "7 Contrato de la API", 1)
    add_body(
        doc,
        "Las respuestas de listado y detalle incluyen version. Las solicitudes de cambio de estado, asignación y retiro requieren expectedVersion como entero positivo. El campo es obligatorio; una solicitud que no lo incluya se rechaza durante la validación.",
    )

    add_heading(doc, "7.1 Cambio de estado", 2)
    add_code(
        doc,
        """
{
  "status": "in_progress",
  "expectedVersion": 1,
  "note": "Cuadrilla revisando la incidencia"
}
""",
    )

    add_heading(doc, "7.2 Asignación de equipo", 2)
    add_code(
        doc,
        """
{
  "workTeamId": 8,
  "expectedVersion": 2,
  "priority": "high",
  "observations": "Atender antes del fin de semana"
}
""",
    )

    add_heading(doc, "7.3 Retiro de asignación", 2)
    add_code(
        doc,
        """
{
  "expectedVersion": 3,
  "note": "La incidencia será reasignada a otra cuadrilla"
}
""",
    )

    add_heading(doc, "7.4 Respuesta de conflicto", 2)
    add_code(
        doc,
        """
HTTP 409 Conflict

{
  "error": {
    "code": "E_REPORT_CONCURRENCY_CONFLICT",
    "message": "El reporte fue modificado por otro usuario. Recarga la información antes de continuar"
  }
}
""",
    )

    add_heading(doc, "8 Integración con el panel administrativo", 1)
    add_body(
        doc,
        "El panel de dependencia utiliza el valor version entregado por Orval. Antes de asignar o retirar un equipo busca el reporte visible y agrega expectedVersion al cuerpo de la solicitud. En el modal de detalle hace lo mismo al cambiar el estado.",
    )
    add_body(
        doc,
        "Cuando recibe E_REPORT_CONCURRENCY_CONFLICT, el panel conserva el mensaje del backend y vuelve a consultar el listado. En un cambio de estado también recarga el detalle abierto. De esta forma el administrador ve el estado actual y puede repetir la acción de manera consciente.",
    )
    add_body(
        doc,
        "La revisión de posibles duplicados utiliza E_DUPLICATE_REVIEW_CONFLICT. Si otra persona ya confirmó o descartó la coincidencia, el panel vuelve a consultar las revisiones y muestra el resultado vigente.",
    )

    add_heading(doc, "9 OpenAPI y Orval", 1)
    add_body(
        doc,
        "El contrato OpenAPI fue regenerado desde el backend en http://127.0.0.1:3333/swagger y se copió al frontend. Después se regeneraron los clientes Orval de ambos proyectos. Los tipos ReportPublic y ReportDetailApiResponse ahora incluyen version; UpdateReportStatusRequest, AssignReportRequest y UnassignReportRequest incluyen expectedVersion.",
    )
    add_body(
        doc,
        "Los archivos generados no deben modificarse manualmente. Cualquier cambio futuro debe comenzar en las interfaces, validadores y anotaciones del backend, seguido por la regeneración del contrato y de Orval.",
    )

    add_heading(doc, "10 Pruebas realizadas", 1)
    add_table(
        doc,
        ["Prueba", "Resultado"],
        [
            ["Cambio de estado con versión vigente", "Aceptado e incrementa la versión"],
            ["Cambio de estado con versión antigua", "HTTP 409 E_REPORT_CONCURRENCY_CONFLICT"],
            ["Asignación con versión vigente", "Aceptada y queda una asignación activa"],
            ["Reasignación con versión antigua", "HTTP 409 sin sobrescribir la asignación actual"],
            ["Reasignación con versión vigente", "Cierra la anterior y conserva el historial"],
            ["Retiro de asignación", "Libera el reporte e incrementa la versión"],
            ["Segunda revisión de un duplicado", "HTTP 409 E_DUPLICATE_REVIEW_CONFLICT"],
            ["Suite funcional del backend", "66 de 66 pruebas aprobadas"],
            ["Typecheck y build del backend", "Correctos"],
            ["Typecheck y build del frontend", "Correctos"],
        ],
        [3.85, 2.45],
    )

    add_heading(doc, "11 Procedimiento de verificación manual", 1)
    add_number(doc, 1, "Iniciar el backend y el frontend con sus configuraciones habituales.")
    add_number(doc, 2, "Abrir el mismo reporte en dos sesiones administrativas distintas.")
    add_number(doc, 3, "En la primera sesión, asignar un equipo o cambiar el estado.")
    add_number(doc, 4, "Sin recargar la segunda sesión, intentar modificar el mismo reporte.")
    add_number(doc, 5, "Comprobar que la segunda solicitud recibe HTTP 409 y no sobrescribe el cambio anterior.")
    add_number(doc, 6, "Confirmar que el panel recarga el reporte y muestra la versión vigente.")
    add_number(doc, 7, "Consultar MySQL y verificar que version aumentó una sola vez por operación aceptada.")

    add_heading(doc, "12 Consideraciones de mantenimiento", 1)
    add_bullet(doc, "Toda nueva operación que modifique un reporte debe exigir expectedVersion.")
    add_bullet(doc, "La comparación debe ejecutarse dentro de la misma transacción que realiza la escritura.")
    add_bullet(doc, "El reporte debe consultarse con bloqueo de fila antes de validar la versión.")
    add_bullet(doc, "La versión solo debe aumentar cuando la operación completa se guarda correctamente.")
    add_bullet(doc, "Los clientes deben tratar HTTP 409 como conflicto recuperable y recargar datos.")
    add_bullet(doc, "No se debe reutilizar una versión recibida antes de una operación exitosa.")

    add_heading(doc, "13 Criterios de aceptación", 1)
    add_table(
        doc,
        ["Criterio", "Estado"],
        [
            ["La tabla reports contiene version con valor inicial 1", "Cumplido"],
            ["Las respuestas de reportes exponen version", "Cumplido"],
            ["Las escrituras críticas requieren expectedVersion", "Cumplido"],
            ["Las solicitudes desactualizadas reciben HTTP 409", "Cumplido"],
            ["Las operaciones aceptadas incrementan version", "Cumplido"],
            ["El panel recarga los datos después de un conflicto", "Cumplido"],
            ["OpenAPI y Orval representan el nuevo contrato", "Cumplido"],
            ["La suite completa permanece aprobada", "Cumplido"],
        ],
        [5.0, 1.3],
    )

    add_heading(doc, "Conclusión", 1)
    add_body(
        doc,
        "El punto 2 de prioridad alta quedó implementado de extremo a extremo. MySQL conserva la versión, el backend valida y bloquea las operaciones críticas, el contrato comunica el requisito y el panel maneja los conflictos sin perder cambios. La solución mantiene los historiales existentes y ofrece una respuesta clara cuando una pantalla quedó desactualizada.",
    )

    doc.core_properties.title = "Control de concurrencia en reportes"
    doc.core_properties.subject = "Documentación técnica del punto 2 de prioridad alta de City Care"
    doc.core_properties.author = "Proyecto City Care"
    doc.core_properties.keywords = "City Care, concurrencia, reportes, MySQL, OpenAPI, Orval"

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build_document()
