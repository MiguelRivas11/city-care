from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(r"C:\Users\migue\medula")
OUTPUT = ROOT / "city-care" / "docs" / "Documentacion_Completa_2_6_Frontend.docx"

doc = Document()
doc.settings.odd_and_even_pages_header_footer = False
section = doc.sections[0]
section.page_width = Cm(21)
section.page_height = Cm(29.7)
section.top_margin = Cm(2.0)
section.bottom_margin = Cm(1.8)
section.left_margin = Cm(2.1)
section.right_margin = Cm(2.1)

props = doc.core_properties
props.title = "Documentación completa 2.6 Frontend"
props.subject = "Integración del frontend administrativo de City Care"
props.author = "Proyecto City Care"
props.keywords = "City Care, Nuxt, Orval, autenticación, administración de usuarios"

BLACK = "000000"
NAVY = "17365D"
PALE = "EAF2F8"
PALE_GREEN = "EAF6EF"
LINE = "D9D9D9"
WHITE = "FFFFFF"


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
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_border(cell, color=LINE, size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = f"w:{edge}"
        el = borders.find(qn(tag))
        if el is None:
            el = OxmlElement(tag)
            borders.append(el)
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), size)
        el.set(qn("w:color"), color)


def configure_styles():
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

    for name, size, before, after in (
        ("Heading 1", 18, 14, 8),
        ("Heading 2", 14, 12, 6),
        ("Heading 3", 11.5, 9, 4),
    ):
        style = doc.styles[name]
        style.font.name = "Aptos Display"
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(BLACK)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    field = OxmlElement("w:fldSimple")
    field.set(qn("w:instr"), "PAGE")
    paragraph._p.append(field)


def add_bullet(text):
    p = doc.add_paragraph(style="List Bullet")
    p.add_run(text)
    return p


def add_table(headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    header = table.rows[0].cells
    for i, label in enumerate(headers):
        header[i].text = label
        set_cell_shading(header[i], NAVY)
        header[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_margins(header[i], 120, 130, 120, 130)
        set_cell_border(header[i])
        for run in header[i].paragraphs[0].runs:
            run.font.bold = True
            run.font.color.rgb = RGBColor.from_string(WHITE)
            run.font.size = Pt(9)
    for r_index, row in enumerate(rows):
        cells = table.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = str(value)
            cells[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_margins(cells[i])
            set_cell_border(cells[i])
            set_cell_shading(cells[i], PALE if r_index % 2 else WHITE)
            for p in cells[i].paragraphs:
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.05
                for run in p.runs:
                    run.font.size = Pt(8.8)
        if widths:
            for i, width in enumerate(widths):
                cells[i].width = Cm(width)
    table.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


configure_styles()

footer = section.footer.paragraphs[0]
footer.text = "City Care  |  Documentación del frontend administrativo 2.6"
footer.runs[0].font.name = "Aptos"
footer.runs[0].font.size = Pt(8)
footer.runs[0].font.color.rgb = RGBColor(95, 95, 95)
add_page_number(section.footer.add_paragraph())

# Portada
doc.add_paragraph("CITY CARE").runs[0].font.bold = True
doc.add_paragraph("Documentación completa 2.6 Frontend", style="Title")
subtitle = doc.add_paragraph()
subtitle.add_run("Integración del panel administrativo con el backend y el cliente Orval").bold = True
doc.add_paragraph(
    "Este documento explica qué se implementó en el frontend definitivo de City Care, cómo funciona la sesión, "
    "cómo se protegen las rutas por rol y cómo el panel de usuarios consume las operaciones del backend. "
    "El resultado es un apartado 2.6 cerrado y verificable, sin modificar el alcance futuro de incidencias y equipos."
)

add_table(
    ["Dato", "Resultado"],
    [
        ("Proyecto frontend", r"C:\Users\migue\OneDrive\Desktop\front-medular\mi-proyecto"),
        ("Backend", r"C:\Users\migue\medula\city-care"),
        ("Estado del apartado", "Completo 9 de 9"),
        ("Fecha de corte", "31 de octubre de 2026"),
    ],
    [4.3, 11.8],
)

doc.add_heading("Conclusión", level=1)
doc.add_paragraph(
    "El frontend ya no es solamente una maqueta. El administrador puede consultar, filtrar, paginar, crear y editar "
    "usuarios, cambiar su estado y restablecer contraseñas. Las rutas están protegidas por sesión y rol, el token se "
    "adjunta de forma centralizada y la interfaz comunica carga, resultados vacíos, éxito, error y confirmaciones."
)
doc.add_page_break()

# Alcance
doc.add_heading("1 Alcance y estado final", level=1)
doc.add_paragraph(
    "El apartado 2.6 se limita al frontend administrativo disponible en esta etapa. La vista de administración de "
    "dependencia conserva su diseño, navegación protegida y datos de sesión reales; la conexión de incidencias y equipos "
    "se realizará cuando existan los módulos de backend correspondientes."
)
add_table(
    ["Punto", "Estado", "Evidencia"],
    [
        ("Vista del panel administrador", "Completo", "Página /admin/users integrada en Nuxt."),
        ("Vista de alumbrado público", "Completo", "Página visual protegida para administrador de dependencia."),
        ("Manuales visuales", "Completo", "Documentación de ambas vistas disponible."),
        ("Frontend definitivo localizado", "Completo", "Proyecto original front-medular/mi-proyecto."),
        ("Vistas integradas", "Completo", "Layouts, barras, tablas y componentes forman parte del proyecto."),
        ("Panel de usuarios conectado", "Completo", "Consume las funciones tipadas generadas por Orval."),
        ("Rutas protegidas por rol", "Completo", "Middlewares admin, dependency-admin y guest."),
        ("Sesión administrada", "Completo", "Login, restauración, Bearer y logout centralizados."),
        ("Estados de interfaz", "Completo", "Carga, vacío, éxito, error, reintento y confirmación."),
    ],
    [5.1, 2.5, 8.5],
)

doc.add_heading("2 Arquitectura de integración", level=1)
doc.add_paragraph(
    "La interfaz no construye solicitudes HTTP manuales en cada componente. Las operaciones OpenAPI generadas se "
    "concentran en servicios de dominio y todas pasan por un cliente común que configura la URL y el encabezado Bearer."
)
add_table(
    ["Capa", "Responsabilidad", "Ubicación principal"],
    [
        ("Página", "Coordina filtros, paginación, modales, avisos y actualización de datos.", "app/pages/admin/users.vue"),
        ("Componentes", "Presentan formulario, tabla, barra de herramientas, navegación y encabezado.", "app/components/admin"),
        ("Servicio", "Expone operaciones de usuarios, roles y dependencias con nombres de dominio.", "app/services/users/users.service.ts"),
        ("SDK Orval", "Contiene tipos y funciones generadas desde OpenAPI.", "app/generated/api/city-care.ts"),
        ("Cliente HTTP", "Resuelve la URL del backend, agrega Bearer y normaliza errores.", "app/services/api/api.client.ts"),
        ("Sesión", "Guarda token, restaura perfil y ejecuta logout.", "app/composables/useAuth.ts"),
        ("Middleware", "Autoriza la navegación según sesión y rol.", "app/middleware"),
    ],
    [3.1, 7.6, 5.4],
)
doc.add_page_break()

# Panel
doc.add_heading("3 Panel administrativo de usuarios", level=1)
doc.add_heading("3.1 Consulta y filtros", level=2)
doc.add_paragraph(
    "Al abrir el panel se solicitan los usuarios, roles y dependencias activas. La búsqueda por texto utiliza un retraso "
    "breve para evitar consultas por cada tecla. Los filtros de rol y estado reinician la paginación y vuelven a cargar "
    "los datos. El resumen superior muestra totales, cuentas activas y administradores."
)
add_bullet("La tabla usa el tipo UserPublic generado por el contrato OpenAPI.")
add_bullet("La paginación usa la metadata entregada por el backend.")
add_bullet("El estado vacío distingue entre falta de registros y filtros sin resultados.")

doc.add_heading("3.2 Alta de usuario", level=2)
doc.add_paragraph(
    "El botón Nuevo usuario abre un formulario con nombre, apellido, correo, dependencia, rol, teléfono, cargo y "
    "contraseña. Antes de enviar se validan los campos obligatorios y la coincidencia de contraseña. El backend conserva "
    "la validación definitiva y la transacción entre users y credentials."
)

doc.add_heading("3.3 Edición", level=2)
doc.add_paragraph(
    "La acción Editar reutiliza el formulario y precarga los datos disponibles. En este modo no se solicita contraseña; "
    "el cambio de contraseña se mantiene como una operación separada para conservar una intención clara y revocar sesiones."
)

doc.add_heading("3.4 Activación y baja lógica", level=2)
doc.add_paragraph(
    "La interfaz nunca ofrece eliminación física. Activar o desactivar requiere confirmación, llama al endpoint de estado y "
    "actualiza el listado. Al desactivar, el backend revoca las sesiones del usuario; la interfaz informa esta consecuencia."
)

doc.add_heading("3.5 Restablecimiento de contraseña", level=2)
doc.add_paragraph(
    "La acción solicita una nueva contraseña y confirmación. Después de una respuesta satisfactoria, se muestra un aviso "
    "y el backend invalida las sesiones anteriores para que el usuario vuelva a autenticarse."
)

add_table(
    ["Acción visual", "Operación del SDK", "Ruta del backend"],
    [
        ("Cargar tabla", "listUsers", "GET /api/v1/admin/users"),
        ("Crear", "createUser", "POST /api/v1/admin/users"),
        ("Editar", "updateUser", "PUT /api/v1/admin/users/{id}"),
        ("Activar o desactivar", "updateUserStatus", "PATCH /api/v1/admin/users/{id}/status"),
        ("Nueva contraseña", "resetUserPassword", "PATCH /api/v1/admin/users/{id}/password"),
        ("Catálogo de roles", "listRoles", "GET /api/v1/admin/roles"),
        ("Catálogo de dependencias", "listDependencies", "GET /api/v1/admin/dependencies"),
    ],
    [4.6, 4.7, 6.8],
)
doc.add_page_break()

# Seguridad y sesión
doc.add_heading("4 Sesión y seguridad de navegación", level=1)
doc.add_heading("4.1 Token y Bearer", level=2)
doc.add_paragraph(
    "El token se conserva en la cookie city-care-token y no se replica en componentes. El cliente HTTP central consulta "
    "la cookie y agrega Authorization Bearer automáticamente. Esto reduce omisiones y mantiene las funciones generadas sin "
    "lógica repetida."
)

doc.add_heading("4.2 Restauración de perfil", level=2)
doc.add_paragraph(
    "Cuando existe token pero todavía no hay usuario en memoria, restoreSession consulta el perfil. Si la sesión dejó de ser "
    "válida, el estado local se limpia. Las barras superiores muestran el nombre, rol e iniciales del usuario autenticado."
)

doc.add_heading("4.3 Matriz de navegación", level=2)
add_table(
    ["Ruta o escenario", "Sin sesión", "admin", "dependency_admin", "Otros roles"],
    [
        ("/", "Permanece en login", "Redirige a /admin/users", "Redirige al panel de dependencia", "Permanece en login"),
        ("/admin/users", "Redirige a /", "Acceso permitido", "Redirige al panel de dependencia", "Redirige a /"),
        ("/dependencia/alumbrado-publico", "Redirige a /", "Acceso permitido", "Acceso permitido", "Redirige a /"),
    ],
    [3.5, 3.0, 3.2, 3.9, 3.2],
)

doc.add_heading("4.4 Cierre de sesión", level=2)
doc.add_paragraph(
    "Los menús administrativos incluyen un botón de salida con estado de carga. Primero se solicita al backend eliminar el "
    "token actual; después se limpia el token y el perfil local y se navega al login."
)

doc.add_heading("5 Estados y comunicación con el usuario", level=1)
add_table(
    ["Estado", "Comportamiento"],
    [
        ("Carga", "Desactiva controles relevantes y muestra que la información está en proceso."),
        ("Vacío", "Explica que no hay usuarios o que los filtros no produjeron resultados."),
        ("Éxito", "Confirma altas, ediciones, cambios de estado y contraseña."),
        ("Error", "Muestra un mensaje comprensible y conserva la oportunidad de reintentar."),
        ("Confirmación", "Solicita aprobación antes de activar o desactivar una cuenta."),
        ("Operación ocupada", "Impide dobles envíos mientras una mutación está en curso."),
    ],
    [4.1, 12.0],
)
doc.add_page_break()

# Dependencia y archivos
doc.add_heading("6 Vista de administración de dependencia", level=1)
doc.add_paragraph(
    "La vista de Alumbrado Público conserva el esqueleto visual aprobado: resumen, equipos e incidencias. En el 2.6 se "
    "integró al proyecto definitivo, se protegió su navegación y se conectaron los datos de sesión y el logout. Los datos "
    "operativos siguen siendo demostrativos porque los módulos de incidencias y equipos pertenecen a los apartados 3.1 y 3.2."
)

doc.add_heading("7 Archivos implementados o actualizados", level=1)
add_table(
    ["Archivo", "Función"],
    [
        ("app/pages/admin/users.vue", "Orquesta el panel conectado."),
        ("app/components/admin/AdminUserToolbar.vue", "Búsqueda y filtros controlados."),
        ("app/components/admin/AdminUserTable.vue", "Tabla real, estados y paginación."),
        ("app/components/admin/AdminUserFormModal.vue", "Formulario de alta y edición."),
        ("app/services/users/users.service.ts", "Servicio sobre las funciones Orval."),
        ("app/middleware/admin.ts", "Protección de administrador general."),
        ("app/middleware/dependency-admin.ts", "Protección del panel de dependencia."),
        ("app/middleware/guest.ts", "Evita mostrar el login a una sesión ya iniciada."),
        ("app/composables/useAuth.ts", "Estado de sesión compartido."),
        ("app/components/admin/AdminSidebar.vue", "Logout administrativo."),
        ("app/components/dependency/DependencySidebar.vue", "Logout de dependencia."),
        ("app/components/admin/AdminTopbar.vue", "Identidad real del administrador."),
        ("app/components/dependency/DependencyTopbar.vue", "Identidad real del usuario de dependencia."),
        ("app/assets/css/admin.css", "Estados, modal y adaptación responsive."),
        ("app/assets/css/dependency-admin.css", "Estado visual del logout."),
    ],
    [9.4, 6.7],
)

doc.add_page_break()
doc.add_heading("8 Verificación realizada", level=1)
add_table(
    ["Prueba", "Resultado", "Evidencia"],
    [
        ("Formato", "Aprobado", "Prettier aplicado a los archivos modificados."),
        ("Tipos", "Aprobado", "npm run typecheck sin errores."),
        ("Compilación", "Aprobado", "npm run build genera el cliente y servidor Nuxt."),
        ("API con administrador", "Aprobado", "Login 200; perfil, usuarios, roles y dependencias accesibles."),
        ("Ruta sin sesión", "Aprobado", "/admin/users redirige al login."),
        ("Ruta con sesión", "Aprobado", "/admin/users responde 200 y presenta el panel."),
    ],
    [4.1, 2.8, 9.2],
)

doc.add_heading("9 Operación y mantenimiento", level=1)
doc.add_paragraph("Para ejecutar el frontend durante desarrollo:")
add_bullet("Iniciar el backend city-care en http://localhost:3333.")
add_bullet("En el proyecto mi-proyecto ejecutar npm run dev.")
add_bullet("Verificar NUXT_PUBLIC_API_BASE_URL cuando el backend use otra dirección.")
add_bullet("Después de cambiar OpenAPI, regenerar el SDK con el comando configurado y ejecutar typecheck y build.")

doc.add_heading("10 Criterio de cierre", level=1)
doc.add_paragraph(
    "El apartado 2.6 se considera terminado porque sus nueve criterios están implementados y comprobados. El siguiente "
    "trabajo técnico no es completar este frontend, sino formalizar el cierre del repositorio y después diseñar los modelos, "
    "migraciones y endpoints de incidencias y equipos."
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUTPUT)
print(OUTPUT)
