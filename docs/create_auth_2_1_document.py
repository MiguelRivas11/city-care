from __future__ import annotations

from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUTPUT = Path(__file__).with_name("Documentacion_Completa_2_1_Autenticacion.docx")

NAVY = "16324F"
BLUE = "2E5D84"
PALE_BLUE = "EAF2F8"
PALE_GRAY = "F4F6F7"
MID_GRAY = "D9D9D9"
TEXT = RGBColor(31, 41, 55)
MUTED = RGBColor(90, 99, 110)


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=120, start=140, bottom=120, end=140) -> None:
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


def set_table_borders(table, color=MID_GRAY, size="6") -> None:
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_keep_with_next(paragraph, value=True) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    keep = p_pr.find(qn("w:keepNext"))
    if keep is None:
        keep = OxmlElement("w:keepNext")
        p_pr.append(keep)
    keep.set(qn("w:val"), "1" if value else "0")


def add_page_number(paragraph) -> None:
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("Página ")
    run.font.size = Pt(9)
    run.font.color.rgb = MUTED
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    paragraph._p.append(fld)


def add_code(doc: Document, text: str) -> None:
    p = doc.add_paragraph()
    p.style = doc.styles["Code"]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.keep_together = True
    run = p.add_run(text)
    run.font.name = "Consolas"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Consolas")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Consolas")
    run.font.size = Pt(9)


def add_bullets(doc: Document, items: list[str]) -> None:
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.add_run(item)


def add_numbered(doc: Document, items: list[str]) -> None:
    for index, item in enumerate(items, start=1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.28)
        p.paragraph_format.first_line_indent = Inches(-0.22)
        p.add_run(f"{index}.  {item}")


def add_table(doc: Document, headers: list[str], rows: list[list[str]], widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)
    header = table.rows[0]
    set_repeat_table_header(header)
    for index, value in enumerate(headers):
        cell = header.cells[index]
        cell.text = value
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_shading(cell, NAVY)
        set_cell_margins(cell)
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.size = Pt(9.5)
    for row_index, values in enumerate(rows):
        row = table.add_row()
        for column_index, value in enumerate(values):
            cell = row.cells[column_index]
            cell.text = str(value)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_margins(cell)
            if row_index % 2:
                set_cell_shading(cell, PALE_BLUE)
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.05
                if column_index == 0 and len(headers) <= 3:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.size = Pt(9.2)
                    run.font.color.rgb = TEXT
        if widths:
            for i, width in enumerate(widths):
                row.cells[i].width = Inches(width)
    if widths:
        for i, width in enumerate(widths):
            header.cells[i].width = Inches(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return table


def add_heading(doc: Document, text: str, level=1) -> None:
    p = doc.add_heading(text, level=level)
    set_keep_with_next(p)


def build_document() -> None:
    doc = Document()
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.72)
    section.bottom_margin = Inches(0.72)
    section.left_margin = Inches(0.82)
    section.right_margin = Inches(0.82)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Aptos"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    normal.font.size = Pt(10.6)
    normal.font.color.rgb = TEXT
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.15

    title = styles["Title"]
    title.font.name = "Aptos Display"
    title._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
    title._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
    title.font.size = Pt(28)
    title.font.bold = True
    title.font.color.rgb = RGBColor(0, 0, 0)

    for style_name, size, color in (("Heading 1", 18, NAVY), ("Heading 2", 13.5, BLUE), ("Heading 3", 11.2, NAVY)):
        style = styles[style_name]
        style.font.name = "Aptos Display"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(12 if style_name == "Heading 1" else 8)
        style.paragraph_format.space_after = Pt(5)
        style.paragraph_format.keep_with_next = True

    if "Code" not in [s.name for s in styles]:
        styles.add_style("Code", 1)
    code_style = styles["Code"]
    code_style.font.name = "Consolas"
    code_style.font.size = Pt(9)
    code_style.font.color.rgb = TEXT
    code_style.paragraph_format.left_indent = Inches(0.25)
    code_style.paragraph_format.right_indent = Inches(0.15)

    header = section.header
    hp = header.paragraphs[0]
    hp.text = "CITY CARE   |   Documentación técnica"
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    for r in hp.runs:
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = MUTED
    add_page_number(section.footer.paragraphs[0])

    # Portada
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Inches(1.1)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("CITY CARE")
    r.font.name = "Aptos Display"
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = RGBColor.from_string(BLUE)

    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("Documentación completa del apartado 2 1 Autenticación")

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    r = p.add_run("Backend AdonisJS 7 con MySQL OpenAPI y Orval")
    r.font.size = Pt(13)
    r.font.color.rgb = MUTED

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Inches(0.8)
    r = p.add_run("Versión documental 2.0\n31 de octubre de 2026")
    r.font.size = Pt(11)
    r.font.color.rgb = TEXT

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Inches(0.65)
    r = p.add_run("Estado del apartado 2.1: COMPLETO Y VERIFICADO")
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = RGBColor.from_string(NAVY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Inches(0.55)
    r = p.add_run(
        "Este documento explica qué se implementó, cómo funciona, cómo se valida y cómo operar el módulo de autenticación."
    )
    r.font.size = Pt(10.5)
    r.font.color.rgb = MUTED

    doc.add_page_break()

    add_heading(doc, "Propósito y alcance", 1)
    doc.add_paragraph(
        "El apartado 2.1 cubre la autenticación y la seguridad de las sesiones de City Care. Su objetivo es permitir el acceso mediante correo y contraseña, proteger las rutas privadas, cerrar sesiones, limitar intentos repetidos, impedir el acceso de cuentas inactivas, caducar los tokens y devolver errores uniformes para el frontend."
    )
    doc.add_paragraph(
        "La implementación quedó cerrada con nueve pruebas funcionales aprobadas. También se verificaron TypeScript, ESLint, el build, las rutas registradas y las seis migraciones aplicadas en MySQL. SQLite se utiliza únicamente como base efímera en memoria durante las pruebas automatizadas; el entorno de desarrollo continúa trabajando con MySQL."
    )

    add_heading(doc, "Resumen de cumplimiento", 1)
    add_table(
        doc,
        ["Punto del 2.1", "Estado", "Evidencia principal"],
        [
            ["Login con correo y contraseña", "Completo", "Valida credentials y emite un access token."],
            ["Hash de contraseñas", "Completo", "password_hash se genera y verifica con el servicio hash de AdonisJS."],
            ["Perfil y logout", "Completo", "Rutas protegidas para consultar perfil y eliminar el token actual."],
            ["Rate limiting", "Completo", "Cinco intentos por minuto y bloqueo de quince minutos por IP y correo."],
            ["Bloqueo de usuarios inactivos", "Completo", "El login responde 403 antes de emitir un token."],
            ["Invalidación de tokens al desactivar", "Completo", "El middleware revoca todas las sesiones al detectar is_active false."],
            ["Expiración de tokens", "Completo", "ACCESS_TOKEN_EXPIRES_IN con valor predeterminado de siete días."],
            ["Credencial inicial fuera del código", "Completo", "ADMIN_INITIAL_PASSWORD se obtiene del entorno y exige doce caracteres."],
            ["Errores estandarizados", "Completo", "Estructura error code message y details para 400 401 403 422 y 429."],
        ],
        widths=[2.1, 1.0, 3.7],
    )

    add_heading(doc, "Contenido", 1)
    add_numbered(
        doc,
        [
            "Arquitectura y flujo general",
            "Modelo de datos y migraciones",
            "Implementación de cada punto del apartado 2.1",
            "Endpoints y contratos HTTP",
            "OpenAPI Swagger y Orval",
            "Pruebas y evidencia de verificación",
            "Operación del módulo",
            "Archivos principales y responsabilidades",
            "Alcance cerrado y trabajo posterior",
        ],
    )

    add_heading(doc, "1 Arquitectura y flujo general", 1)
    doc.add_paragraph(
        "El módulo separa el perfil del usuario de sus credenciales. Los controladores coordinan las solicitudes HTTP, AuthService valida identidad y estado, los middleware protegen las rutas, Lucid administra la persistencia y los transformadores limitan los datos que se exponen al cliente."
    )

    add_heading(doc, "1.1 Componentes", 2)
    add_table(
        doc,
        ["Capa", "Responsabilidad"],
        [
            ["Rutas", "Exponen login, profile, logout y alta administrativa; asignan middleware."],
            ["Validadores", "Comprueban email, contraseña y cuerpos administrativos mediante VineJS."],
            ["Controladores", "Coordinan autenticación, emisión o eliminación de tokens y serialización."],
            ["AuthService", "Busca credentials, verifica password_hash, aplica rate limiting y controla is_active."],
            ["Middleware auth", "Autentica el Bearer token, vuelve a validar is_active y revoca sesiones."],
            ["Middleware admin", "Carga role y permite operaciones administrativas únicamente al slug admin."],
            ["Modelos Lucid", "Representan users, credentials, roles, dependencies y auth_access_tokens."],
            ["Transformer", "Devuelve únicamente los campos públicos del usuario y su rol."],
            ["Exception handler", "Convierte errores en una respuesta JSON uniforme."],
        ],
        widths=[1.6, 5.2],
    )

    add_heading(doc, "1.2 Secuencia del inicio de sesión", 2)
    add_numbered(
        doc,
        [
            "El cliente envía email y password a POST /api/v1/auth/login.",
            "loginValidator valida formato, longitud del correo y presencia de la contraseña.",
            "AccessTokensController entrega email, password e IP a AuthService.login.",
            "El limitador crea una clave con IP y correo y controla los intentos fallidos.",
            "AuthService busca la credencial en credentials y verifica password_hash.",
            "El servicio recupera users mediante credentials.user_id y comprueba is_active.",
            "El controlador carga role, crea un access token con expiración y serializa la respuesta.",
            "El cliente conserva el token y lo envía como Authorization Bearer en rutas protegidas.",
        ],
    )
    add_code(doc, "Cliente -> loginValidator -> AccessTokensController -> AuthService\n        -> credentials -> users -> role -> access token -> respuesta data")

    add_heading(doc, "1.3 Autenticación y autorización", 2)
    doc.add_paragraph(
        "La autenticación determina quién es el usuario mediante un access token. La autorización determina qué puede hacer: AdminMiddleware carga la relación role y exige roles.slug igual a admin. El uso del slug evita depender de identificadores numéricos que pueden variar entre bases de datos."
    )

    add_heading(doc, "2 Modelo de datos y migraciones", 1)
    doc.add_paragraph(
        "La autenticación utiliza cinco tablas funcionales. Las seis migraciones del proyecto se encuentran en estado completed en MySQL; una de ellas agrega la relación de roles sobre users."
    )
    add_table(
        doc,
        ["Tabla", "Campos relevantes", "Propósito"],
        [
            ["users", "id dependency_id role_id email is_active", "Perfil, dependencia, rol y estado de la cuenta."],
            ["credentials", "user_id email password_hash", "Datos privados usados para iniciar sesión."],
            ["roles", "id name slug", "Nivel de autorización del usuario."],
            ["dependencies", "id name description", "Área organizacional a la que pertenece el usuario."],
            ["auth_access_tokens", "tokenable_id hash abilities expires_at", "Sesiones emitidas para cada usuario."],
        ],
        widths=[1.45, 2.35, 3.0],
    )

    add_heading(doc, "2.1 Relaciones", 2)
    add_code(doc, "dependencies 1 ----- N users N ----- 1 roles\n                         |\n                         1\n                         |\n                    credentials\n                         |\n                         +----- N auth_access_tokens")
    add_bullets(
        doc,
        [
            "Cada usuario pertenece a una dependencia y a un rol.",
            "Cada usuario tiene una credencial identificada por user_id único.",
            "Un usuario puede tener varios tokens para sesiones independientes.",
            "Al eliminar un usuario, sus credenciales y tokens se eliminan mediante cascada.",
        ],
    )

    add_heading(doc, "2.2 Migraciones verificadas", 2)
    add_table(
        doc,
        ["Orden", "Migración", "Estado"],
        [
            ["1", "create_dependencies_table", "completed lote 1"],
            ["2", "create_users_table", "completed lote 1"],
            ["3", "create_access_tokens_table", "completed lote 1"],
            ["4", "create_credentials_table", "completed lote 1"],
            ["5", "create_roles_table", "completed lote 2"],
            ["6", "alter_users_table", "completed lote 3"],
        ],
        widths=[0.8, 4.0, 2.0],
    )
    doc.add_paragraph(
        "MySQL es la base de desarrollo y conserva la información real. Durante npm test, AdonisJS cambia a SQLite en memoria, ejecuta las mismas migraciones, corre las pruebas y revierte las tablas al terminar. Este aislamiento impide que las pruebas modifiquen city-care en MySQL."
    )

    add_heading(doc, "3 Implementación de los puntos del apartado 2 1", 1)

    add_heading(doc, "3.1 Login con correo y contraseña", 2)
    doc.add_paragraph(
        "POST /api/v1/auth/login recibe email y password. El correo se normaliza con trim, debe tener formato válido y un máximo de 150 caracteres. AuthService consulta credentials por email y utiliza el servicio hash para verificar la contraseña. Si la combinación es válida, recupera users, carga role y crea el token."
    )
    doc.add_paragraph(
        "Para no revelar si un correo existe, una credencial inexistente y una contraseña incorrecta producen exactamente el mismo error E_INVALID_CREDENTIALS con estado 400."
    )

    add_heading(doc, "3.2 Hash de contraseñas", 2)
    doc.add_paragraph(
        "Las contraseñas nunca se guardan en users ni en texto plano. Al crear una cuenta o preparar el administrador inicial, hash.make genera password_hash. Durante el login, hash.verify compara la contraseña recibida con ese hash. La base no permite recuperar la contraseña original; si se pierde, debe restablecerse."
    )

    add_heading(doc, "3.3 Perfil y logout", 2)
    doc.add_paragraph(
        "GET /api/v1/account/profile requiere un Bearer token válido, carga el rol y devuelve UserTransformer. POST /api/v1/account/logout elimina solamente el token usado en esa solicitud. Otros tokens del mismo usuario permanecen activos, salvo que la cuenta sea desactivada o se ejecute una revocación global."
    )

    add_heading(doc, "3.4 Rate limiting", 2)
    doc.add_paragraph(
        "AuthService usa el limitador con cinco solicitudes durante un minuto y blockDuration de quince minutos. La clave login_IP_email separa los intentos por dirección y cuenta. El sexto intento repetido devuelve 429 E_TOO_MANY_REQUESTS. El almacén actual es memory, adecuado para una sola instancia de desarrollo; un despliegue con varias instancias requerirá un almacén compartido."
    )

    add_heading(doc, "3.5 Bloqueo de usuarios inactivos", 2)
    doc.add_paragraph(
        "Después de validar el hash y antes de emitir el token, AuthService comprueba users.is_active. Cuando el valor es false, elimina todos los tokens del usuario y responde 403 E_ACCOUNT_INACTIVE. Por lo tanto, una cuenta desactivada no recibe una nueva sesión."
    )

    add_heading(doc, "3.6 Invalidación de tokens al desactivar", 2)
    doc.add_paragraph(
        "El control también se ejecuta en AuthMiddleware. Si una cuenta tenía un token previo y luego se cambia a inactiva, el siguiente intento de usar una ruta protegida provoca la revocación de todas sus sesiones y devuelve 403. AuthService.revokeAllTokens centraliza esta operación."
    )

    add_heading(doc, "3.7 Expiración configurable de tokens", 2)
    doc.add_paragraph(
        "DbAccessTokensProvider configura expiresIn con ACCESS_TOKEN_EXPIRES_IN. Si la variable no existe, se utiliza 7d. La prueba funcional confirma que el campo expires_at se genera aproximadamente siete días después de la emisión."
    )
    add_code(doc, "ACCESS_TOKEN_EXPIRES_IN=7d")

    add_heading(doc, "3.8 Credencial inicial fuera del código", 2)
    doc.add_paragraph(
        "AdminSeeder ya no contiene una contraseña fija. Para crear por primera vez admin@citycare.com exige ADMIN_INITIAL_PASSWORD con al menos doce caracteres. Si el administrador y su credencial ya existen, ejecutar nuevamente el seeder no reemplaza la contraseña. El valor real debe permanecer solamente en el archivo .env local o en el gestor de secretos del entorno."
    )
    add_code(doc, "ADMIN_INITIAL_PASSWORD=<secreto de al menos 12 caracteres>\nnode ace db:seed")

    add_heading(doc, "3.9 Errores estandarizados", 2)
    doc.add_paragraph(
        "HttpExceptionHandler transforma los errores conocidos en un objeto uniforme. Los errores de validación incluyen details; los errores internos ocultan información sensible."
    )
    add_code(doc, '{\n  "error": {\n    "code": "E_INVALID_CREDENTIALS",\n    "message": "Credenciales inválidas"\n  }\n}')
    add_table(
        doc,
        ["HTTP", "Código", "Situación"],
        [
            ["400", "E_INVALID_CREDENTIALS", "Correo inexistente o contraseña incorrecta."],
            ["401", "E_UNAUTHORIZED_ACCESS", "Token ausente, inválido, vencido o eliminado."],
            ["403", "E_ACCOUNT_INACTIVE", "Cuenta desactivada."],
            ["403", "Autorización administrativa", "Usuario autenticado sin rol admin."],
            ["422", "E_VALIDATION_ERROR", "Cuerpo incompleto o con formato inválido."],
            ["429", "E_TOO_MANY_REQUESTS", "Límite de intentos superado."],
        ],
        widths=[0.75, 2.25, 3.8],
    )

    add_heading(doc, "4 Endpoints y contratos HTTP", 1)
    add_table(
        doc,
        ["Método", "Ruta", "Acceso", "Resultado"],
        [
            ["POST", "/api/v1/auth/login", "Público", "Usuario público y token."],
            ["GET", "/api/v1/account/profile", "Bearer", "Perfil del usuario y rol."],
            ["POST", "/api/v1/account/logout", "Bearer", "Elimina el token actual."],
            ["POST", "/api/v1/admin/users", "Bearer y admin", "Crea perfil y credencial en una transacción."],
        ],
        widths=[0.7, 2.65, 1.2, 2.25],
    )

    add_heading(doc, "4.1 Iniciar sesión", 2)
    add_code(doc, 'POST /api/v1/auth/login\nContent-Type: application/json\n\n{\n  "email": "admin@citycare.com",\n  "password": "<contraseña>"\n}')
    add_code(doc, '{\n  "data": {\n    "user": {\n      "id": 1,\n      "email": "admin@citycare.com",\n      "isActive": true,\n      "role": { "id": 1, "name": "Administrador", "slug": "admin" }\n    },\n    "token": "<access_token>"\n  }\n}')

    add_heading(doc, "4.2 Consultar perfil", 2)
    add_code(doc, "GET /api/v1/account/profile\nAuthorization: Bearer <access_token>")
    doc.add_paragraph(
        "La respuesta se encuentra dentro de data e incluye id, dependencyId, roleId, nombres, correo, datos opcionales, isActive, fechas, initials y role. No incluye password_hash ni el hash del token."
    )

    add_heading(doc, "4.3 Cerrar sesión", 2)
    add_code(doc, 'POST /api/v1/account/logout\nAuthorization: Bearer <access_token>\n\n{ "message": "Logged out successfully" }')

    add_heading(doc, "4.4 Crear una cuenta administrativa", 2)
    doc.add_paragraph(
        "Aunque pertenece al apartado de administración de usuarios, esta ruta participa en el ciclo de autenticación porque crea credentials. Requiere middleware auth y admin. NewAccountController genera el hash antes de abrir la transacción y después crea users y credentials con el mismo cliente transaccional."
    )
    add_code(doc, 'POST /api/v1/admin/users\nAuthorization: Bearer <token_admin>\nContent-Type: application/json\n\n{\n  "dependencyId": 1,\n  "roleId": 2,\n  "firstName": "Ana",\n  "lastName": "López",\n  "email": "ana@ejemplo.com",\n  "isActive": true,\n  "password": "Password123!",\n  "passwordConfirmation": "Password123!"\n}')

    add_heading(doc, "4.5 Uso seguro del token", 2)
    add_bullets(
        doc,
        [
            "El valor completo del token se entrega únicamente en la respuesta de login.",
            "La base almacena el hash del token, no el valor reutilizable por el cliente.",
            "El frontend debe enviarlo en Authorization: Bearer y retirarlo al cerrar sesión.",
            "No se debe incluir el token en URLs, registros, capturas ni documentación pública.",
        ],
    )

    add_heading(doc, "5 OpenAPI Swagger y Orval", 1)
    doc.add_paragraph(
        "AutoSwagger genera el contrato desde rutas, anotaciones e interfaces. GET /swagger devuelve YAML normalizado y GET /docs presenta Swagger UI. La normalización elimina required vacíos, convierte propiedades obligatorias al formato OpenAPI, marca requestBody como requerido y agrega un ejemplo completo de login con email y password."
    )
    add_table(
        doc,
        ["Recurso", "Ubicación o comando", "Uso"],
        [
            ["Contrato vivo", "GET /swagger", "Especificación OpenAPI normalizada."],
            ["Interfaz", "GET /docs", "Exploración y prueba manual de endpoints."],
            ["Contrato versionado", "openapi/city-care.v1.yaml", "Entrada estable para Orval."],
            ["Configuración", "orval.config.ts", "Genera cliente fetch en modo single."],
            ["SDK generado", "sdk/generated/city-care.ts", "Tipos y funciones para el frontend."],
            ["Regeneración", "npm run openapi:generate", "Actualiza el SDK desde el contrato."],
        ],
        widths=[1.4, 2.7, 2.7],
    )
    add_heading(doc, "5.1 Corrección del campo password en Swagger", 2)
    doc.add_paragraph(
        "El esquema LoginRequest siempre contenía email y password, pero el ejemplo automático de AutoSwagger omitía password por tratarlo como campo sensible. Swagger UI priorizaba ese ejemplo y parecía mostrar un cuerpo incompleto. Se definió un ejemplo explícito sin credenciales reales; ahora la interfaz presenta ambos campos y Orval conserva password como obligatorio."
    )
    add_code(doc, '{\n  "email": "usuario@citycare.com",\n  "password": "TuPassword123!"\n}')
    doc.add_paragraph(
        "Los valores anteriores son únicamente ilustrativos y no deben interpretarse como una cuenta válida."
    )
    add_heading(doc, "5.2 Flujo de sincronización", 2)
    add_numbered(
        doc,
        [
            "Iniciar el backend y verificar http://localhost:3333/swagger.",
            "Actualizar openapi/city-care.v1.yaml desde el contrato vivo.",
            "Ejecutar npm run openapi:generate.",
            "Comprobar que LoginRequest contiene email y password.",
            "Ejecutar npm run typecheck y npm run lint.",
            "Copiar o consumir el SDK generado desde el frontend definitivo.",
        ],
    )

    add_heading(doc, "6 Pruebas y evidencia de verificación", 1)
    doc.add_paragraph(
        "El grupo Autenticación 2.1 contiene nueve pruebas funcionales. Cada ejecución levanta SQLite en memoria, aplica las seis migraciones y elimina la información al terminar. La evidencia del 31 de octubre de 2026 registró nueve pruebas aprobadas en aproximadamente dos segundos."
    )
    add_table(
        doc,
        ["Prueba", "Resultado esperado", "Estado"],
        [
            ["Login válido", "HTTP 200, token y expires_at cercano a siete días.", "Aprobada"],
            ["Perfil", "HTTP 200 con id y email correctos.", "Aprobada"],
            ["Logout", "El token deja de acceder y recibe 401.", "Aprobada"],
            ["Login inactivo", "HTTP 403 y ninguna sesión emitida.", "Aprobada"],
            ["Token de cuenta desactivada", "HTTP 403 y revocación de todos los tokens.", "Aprobada"],
            ["Credenciales inválidas", "HTTP 400 con respuesta uniforme.", "Aprobada"],
            ["Rate limiting", "Cinco errores y sexto intento con HTTP 429.", "Aprobada"],
            ["Validación", "HTTP 422 con error y details.", "Aprobada"],
            ["Token ausente", "HTTP 401 E_UNAUTHORIZED_ACCESS.", "Aprobada"],
        ],
        widths=[2.0, 3.8, 1.0],
    )

    add_heading(doc, "6.1 Comprobaciones técnicas", 2)
    add_table(
        doc,
        ["Comando", "Resultado verificado"],
        [
            ["npm test", "9 pruebas aprobadas"],
            ["npm run typecheck", "Sin errores TypeScript"],
            ["npm run lint", "Sin errores ESLint"],
            ["npm run build", "Compilación completada"],
            ["node ace list:routes", "Siete rutas totales y cuatro endpoints API"],
            ["node ace migration:status", "Seis migraciones completed en MySQL"],
            ["npm run openapi:generate", "Cliente Orval generado correctamente"],
        ],
        widths=[2.45, 4.35],
    )
    add_code(doc, "npm test\nnpm run typecheck\nnpm run lint\nnpm run build\nnode ace list:routes\nnode ace migration:status\nnpm run openapi:generate")

    add_heading(doc, "6.2 Prueba manual en Swagger", 2)
    add_numbered(
        doc,
        [
            "Ejecutar npm run dev y abrir http://localhost:3333/docs.",
            "Abrir POST /api/v1/auth/login y seleccionar Try it out.",
            "Introducir una cuenta válida y ejecutar la solicitud.",
            "Copiar el token devuelto sin publicarlo ni guardarlo en documentación.",
            "Usar Authorize o el encabezado Bearer para consultar profile.",
            "Ejecutar logout y comprobar que el mismo token ya responde 401.",
        ],
    )

    add_heading(doc, "7 Operación del módulo", 1)
    add_heading(doc, "7.1 Preparar una instalación", 2)
    add_numbered(
        doc,
        [
            "Copiar .env.example como .env y configurar MySQL.",
            "Generar APP_KEY según el flujo de AdonisJS.",
            "Definir ACCESS_TOKEN_EXPIRES_IN; el valor recomendado inicial es 7d.",
            "Definir ADMIN_INITIAL_PASSWORD solamente si todavía se creará el administrador inicial.",
            "Ejecutar las migraciones y después el seeder.",
            "Iniciar el servidor y verificar Swagger.",
        ],
    )
    add_code(doc, "npm ci\nnode ace migration:run\nnode ace db:seed\nnpm run dev")

    add_heading(doc, "7.2 Cuenta administrativa", 2)
    doc.add_paragraph(
        "El seeder prepara el correo admin@citycare.com, los roles admin y user y la dependencia Administración. La contraseña concreta no debe escribirse en este documento. En el entorno local actual fue restablecida directamente para permitir la prueba, pero debe tratarse como secreto y cambiarse si el archivo se comparte o el entorno se publica."
    )

    add_heading(doc, "7.3 Cambio o pérdida de contraseña", 2)
    doc.add_paragraph(
        "password_hash no puede descifrarse. Mientras no exista un endpoint de recuperación, el restablecimiento debe realizarse mediante una operación administrativa controlada que vuelva a generar el hash. No se debe escribir texto plano directamente en credentials.password_hash."
    )

    add_heading(doc, "7.4 Desactivación de cuentas", 2)
    doc.add_paragraph(
        "Cuando el CRUD administrativo implemente el cambio de estado, debe establecer users.is_active en false y llamar a AuthService.revokeAllTokens dentro del mismo caso de uso. El middleware actual actúa como segunda barrera y revoca sesiones cuando se intenta reutilizar un token."
    )

    add_heading(doc, "7.5 Consideraciones para producción", 2)
    add_bullets(
        doc,
        [
            "Sustituir el limitador memory por un almacén compartido si hay varias instancias.",
            "Guardar APP_KEY, ADMIN_INITIAL_PASSWORD y credenciales de MySQL en un gestor de secretos.",
            "Configurar CORS únicamente para los dominios permitidos y servir la API mediante HTTPS.",
            "Definir monitoreo, respaldos y auditoría de cambios administrativos.",
            "Implementar recuperación de contraseña y cierre global de sesiones como módulo posterior.",
        ],
    )

    add_heading(doc, "8 Archivos principales y responsabilidades", 1)
    add_table(
        doc,
        ["Archivo", "Responsabilidad"],
        [
            ["start/routes.ts", "Rutas de API, Swagger y normalización del contrato."],
            ["app/services/auth_service.ts", "Credenciales, limitador, inactivos y revocación global."],
            ["app/controllers/access_tokens_controller.ts", "Login, emisión de token y logout."],
            ["app/controllers/profile_controller.ts", "Perfil autenticado."],
            ["app/middleware/auth_middleware.ts", "Bearer token y segunda validación de is_active."],
            ["app/middleware/admin_middleware.ts", "Autorización por role.slug admin."],
            ["app/exceptions/handler.ts", "Formato uniforme de errores."],
            ["app/validators/user.ts", "Validación de login y alta de usuarios."],
            ["app/models/user.ts", "Relaciones y proveedor de tokens con expiración."],
            ["app/models/credential.ts", "Relación privada de credenciales con user."],
            ["app/transformers/user_transformer.ts", "Representación pública del usuario."],
            ["database/seeders/admin_seeder.ts", "Roles, dependencia y administrador inicial seguros."],
            ["config/database.ts", "MySQL en desarrollo y SQLite en memoria para pruebas."],
            ["config/auth.ts", "Guard api basado en access tokens."],
            ["config/limiter.ts", "Almacén del limitador."],
            ["tests/functional/auth.spec.ts", "Nueve pruebas del cierre 2.1."],
            ["openapi/city-care.v1.yaml", "Contrato OpenAPI versionado."],
            ["orval.config.ts", "Configuración del generador de cliente."],
            ["sdk/generated/city-care.ts", "Tipos y funciones fetch generadas."],
        ],
        widths=[2.7, 4.1],
    )

    add_heading(doc, "9 Alcance cerrado y trabajo posterior", 1)
    doc.add_paragraph(
        "El apartado 2.1 se considera cerrado porque todos sus criterios están implementados y probados. Esto no significa que la versión 1.0 completa de City Care esté terminada. Los siguientes trabajos pertenecen a otros apartados y no bloquean el cierre técnico del login."
    )
    add_table(
        doc,
        ["Trabajo posterior", "Apartado", "Motivo"],
        [
            ["CRUD completo de usuarios", "2.2", "Faltan listado, detalle, edición y baja lógica."],
            ["Permisos granulares", "2.3", "Actualmente la autorización administrativa usa slug admin."],
            ["CRUD de dependencias", "2.4", "Se requiere para formularios y administración organizacional."],
            ["Bearer centralizado en frontend", "2.5 y 2.6", "El SDK debe adjuntar el token y manejar la URL por entorno."],
            ["Pruebas administrativas", "2.7", "Faltan pruebas específicas del CRUD y su transacción."],
            ["Recuperación de contraseña", "Etapa posterior", "Requiere tokens temporales, auditoría y política propia."],
        ],
        widths=[2.2, 1.25, 3.35],
    )

    add_heading(doc, "Conclusión", 1)
    doc.add_paragraph(
        "City Care cuenta con un módulo de autenticación funcional y verificable: valida credenciales separadas del perfil, protege rutas mediante tokens, controla cuentas inactivas, revoca sesiones, limita intentos, aplica expiración configurable, evita contraseñas fijas en el código y entrega errores compatibles con el frontend. El contrato OpenAPI y el SDK Orval reflejan el cuerpo completo de login. Con esta base, el desarrollo puede continuar hacia el CRUD administrativo y la integración integral del frontend sin reabrir el apartado 2.1."
    )

    # Keep tables from looking cramped and set document metadata.
    doc.core_properties.title = "Documentación completa del apartado 2.1 Autenticación"
    doc.core_properties.subject = "City Care backend AdonisJS autenticación"
    doc.core_properties.author = "Proyecto City Care"
    doc.core_properties.keywords = "City Care, autenticación, AdonisJS, MySQL, OpenAPI, Orval"
    doc.core_properties.comments = "Estado verificado al 31 de octubre de 2026"
    doc.save(OUTPUT)


if __name__ == "__main__":
    build_document()
    print(OUTPUT)
