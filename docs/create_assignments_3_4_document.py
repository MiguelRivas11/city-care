from pathlib import Path

from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt

from create_reports_3_1_documents import (
    add_bullet,
    add_code,
    add_cover,
    add_table,
    configure_document,
)


ROOT = Path(r"C:\Users\migue\medula\city-care")
OUTPUT = ROOT / "docs" / "Documentacion_Completa_3_4_Asignacion_Dependencias_Equipos.docx"


def add_numbered_steps(doc, steps):
    for index, text in enumerate(steps, start=1):
        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.left_indent = Cm(0.72)
        paragraph.paragraph_format.first_line_indent = Cm(-0.72)
        paragraph.paragraph_format.space_after = Pt(3)
        number = paragraph.add_run(f"{index}.  ")
        number.bold = True
        paragraph.add_run(text)


def build_document():
    doc = configure_document(
        "Documentación completa de asignación a dependencias y equipos",
        "Etapa 3 4 del módulo de reportes e incidencias",
        "City Care  |  Documentación técnica 3.4 Asignación a dependencias y equipos",
    )

    section = doc.sections[0]
    section.page_width = Cm(21.59)
    section.page_height = Cm(27.94)
    section.top_margin = Cm(1.75)
    section.bottom_margin = Cm(1.65)
    section.left_margin = Cm(2.15)
    section.right_margin = Cm(2.15)

    add_cover(
        doc,
        "Documentación completa de asignación a dependencias y equipos",
        "Etapa 3 4 del módulo de reportes e incidencias",
        "La etapa 3.4 incorpora la organización operativa de las incidencias. Cada dependencia puede administrar "
        "equipos con líder e integrantes, asignar reportes con prioridad y fecha límite, reasignarlos sin perder "
        "trazabilidad y retirar una asignación con un motivo verificable.",
        [
            ("Estado", "Completo y validado"),
            ("Rutas nuevas", "9 operaciones administrativas"),
            ("Tablas nuevas", "work_teams, work_team_members y report_assignments"),
            ("Migraciones totales", "15 aplicadas en MySQL"),
            ("Endpoints totales", "31 rutas registradas"),
            ("Suite funcional", "64 de 64 pruebas aprobadas"),
            ("Contrato", "OpenAPI y cliente Orval sincronizados en el puerto 3333"),
        ],
    )
    doc.add_heading("Resultado de la etapa", level=1)
    doc.add_paragraph(
        "El backend permite crear y mantener equipos por dependencia, designar al líder, reemplazar integrantes y "
        "controlar la disponibilidad del equipo. Los reportes admiten una sola asignación activa, mientras el historial "
        "conserva cada asignación, reasignación y retiro con actor, fechas, prioridad y observaciones."
    )
    doc.add_page_break()

    doc.add_heading("1 Objetivo y alcance", level=1)
    for text in (
        "Crear equipos de trabajo asociados a una dependencia activa.",
        "Designar un líder y mantener una lista de integrantes activos sin duplicados.",
        "Restringir la administración local a la dependencia del usuario autenticado.",
        "Asignar reportes a equipos de la misma dependencia.",
        "Registrar prioridad, fecha límite y observaciones operativas.",
        "Conservar el historial al reasignar o retirar una incidencia.",
        "Impedir la baja de equipos con asignaciones activas.",
        "Impedir la baja de usuarios mientras pertenezcan a un equipo activo.",
        "Publicar las operaciones en OpenAPI y regenerar el SDK Orval.",
        "Validar permisos, integridad y transacciones mediante pruebas funcionales.",
    ):
        add_bullet(doc, text)

    doc.add_heading("2 Arquitectura funcional", level=1)
    add_table(
        doc,
        ["Componente", "Responsabilidad"],
        [
            ("Panel administrativo", "Gestiona equipos y asigna incidencias mediante el SDK Orval."),
            ("Middleware auth", "Obtiene al actor desde el token Bearer."),
            ("Middleware permission", "Autoriza teams y reports.assign según el rol."),
            ("WorkTeamsController", "Aplica alcance, validaciones, transacciones e historial."),
            ("AuthorizationService", "Define permisos para admin y dependency_admin."),
            ("Lucid", "Modela equipos, integrantes, asignaciones y relaciones."),
            ("MySQL", "Conserva el estado actual y la trazabilidad histórica."),
            ("OpenAPI y Orval", "Exponen nueve funciones tipadas para el frontend."),
        ],
        [5.0, 11.1],
        8.5,
    )
    doc.add_page_break()
    doc.add_paragraph(
        "La autorización se aplica en dos niveles. El middleware comprueba el permiso y el controlador vuelve a "
        "comprobar dependency_id. Esta segunda validación evita que una cuenta con permiso administrativo opere sobre "
        "equipos o reportes de otra dependencia."
    )

    doc.add_heading("3 Modelo de datos", level=1)
    add_table(
        doc,
        ["Tabla", "Relación", "Finalidad"],
        [
            ("work_teams", "dependency_id y leader_user_id", "Identidad, líder y estado del equipo."),
            ("work_team_members", "work_team_id y user_id", "Lista vigente de integrantes sin duplicados."),
            ("report_assignments", "report_id y work_team_id", "Historial operativo de asignaciones."),
            ("reports.current_assignment_id", "report_assignments.id", "Puntero a la única asignación activa."),
        ],
        [4.6, 5.2, 6.3],
        8.4,
    )
    doc.add_paragraph(
        "El historial no se sobrescribe. Cuando una incidencia cambia de equipo, la asignación anterior recibe "
        "unassigned_at, unassigned_by_user_id y unassignment_note; después se crea un registro nuevo y reports actualiza "
        "current_assignment_id dentro de la misma transacción."
    )

    doc.add_heading("4 Tabla work teams", level=1)
    add_table(
        doc,
        ["Campo", "Tipo", "Regla"],
        [
            ("id", "entero", "Identificador interno."),
            ("dependency_id", "entero FK", "Dependencia propietaria con eliminación restringida."),
            ("name", "texto 150", "Único dentro de la dependencia."),
            ("description", "texto nullable", "Descripción operativa opcional."),
            ("leader_user_id", "entero FK nullable", "Líder del equipo; SET NULL protege la integridad."),
            ("is_active", "booleano", "Baja lógica del equipo."),
            ("created_at y updated_at", "fecha y hora", "Auditoría temporal del registro."),
        ],
        [4.5, 3.7, 7.9],
        8.2,
    )
    doc.add_page_break()

    doc.add_heading("5 Integrantes y asignaciones", level=1)
    doc.add_heading("5 1 Tabla work team members", level=2)
    add_table(
        doc,
        ["Campo", "Uso"],
        [
            ("work_team_id", "Equipo relacionado; CASCADE elimina sus vínculos."),
            ("user_id", "Integrante activo de la misma dependencia."),
            ("created_at", "Fecha de incorporación vigente."),
            ("Índice único", "Impide repetir un usuario dentro del mismo equipo."),
        ],
        [5.0, 11.1],
        8.4,
    )
    doc.add_heading("5 2 Tabla report assignments", level=2)
    add_table(
        doc,
        ["Grupo", "Campos", "Uso"],
        [
            ("Identidad", "id, report_id, work_team_id", "Reporte y equipo de cada movimiento."),
            ("Asignación", "assigned_by_user_id, assigned_at", "Actor y momento de asignación."),
            ("Planeación", "priority, due_at, observations", "Urgencia, compromiso y notas."),
            ("Retiro", "unassigned_at, unassigned_by_user_id", "Cierre de la asignación."),
            ("Motivo", "unassignment_note", "Explicación de retiro o reasignación."),
            ("Auditoría", "created_at, updated_at", "Fechas técnicas del registro."),
        ],
        [3.2, 6.2, 6.7],
        8.1,
    )

    doc.add_heading("6 Migraciones", level=1)
    add_table(
        doc,
        ["Migración", "Resultado"],
        [
            ("1796000000500 create work teams table", "Crea equipos, líder, estado, índices y nombre único por dependencia."),
            ("1796000000600 create work team members table", "Crea integrantes y evita duplicados por equipo."),
            ("1796000000700 create report assignments table", "Crea el historial y agrega current_assignment_id a reports."),
        ],
        [7.1, 9.0],
        8.2,
    )
    doc.add_page_break()
    doc.add_paragraph(
        "Las tres migraciones se aplicaron en el lote 8 de MySQL. El proyecto registra quince migraciones completed."
    )

    doc.add_heading("7 Ciclo de vida de un equipo", level=1)
    add_numbered_steps(
        doc,
        (
            "El administrador selecciona una dependencia activa.",
            "El backend valida que el líder y los integrantes estén activos y pertenezcan a esa dependencia.",
            "El líder se incorpora automáticamente a la lista de integrantes.",
            "El equipo puede editar nombre, descripción, líder e integrantes.",
            "Para cambiar integrantes se reemplaza la lista vigente en una operación controlada.",
            "Un usuario no puede desactivarse mientras pertenezca a un equipo activo.",
            "Un equipo con incidencias activas no puede desactivarse.",
            "Después de retirar sus asignaciones puede aplicarse la baja lógica con is_active false.",
        ),
    )

    doc.add_heading("8 Flujo de asignación", level=1)
    add_numbered_steps(
        doc,
        (
            "El administrador abre un reporte que ya tiene dependency_id.",
            "Selecciona un equipo activo de la misma dependencia.",
            "Define prioridad, observaciones y una fecha límite futura opcional.",
            "El controlador bloquea el reporte durante la transacción.",
            "Si existe una asignación activa, la cierra como reasignación administrativa.",
            "Crea el nuevo registro de report_assignments.",
            "Actualiza reports.current_assignment_id con el nuevo identificador.",
            "Confirma ambos cambios juntos y devuelve el detalle de la asignación.",
        ),
    )
    doc.add_page_break()

    doc.add_heading("9 Endpoints del punto 3 4", level=1)
    add_table(
        doc,
        ["Método", "Ruta", "Permiso", "Función"],
        [
            ("GET", "/api/v1/admin/teams", "teams.list", "Lista equipos con filtros."),
            ("POST", "/api/v1/admin/teams", "teams.create", "Crea equipo y miembros."),
            ("GET", "/api/v1/admin/teams/:id", "teams.read", "Consulta el detalle."),
            ("PATCH", "/api/v1/admin/teams/:id", "teams.update", "Edita datos o líder."),
            ("PATCH", "/api/v1/admin/teams/:id/status", "teams.status", "Aplica baja lógica."),
            ("PUT", "/api/v1/admin/teams/:id/members", "teams.members", "Reemplaza integrantes."),
            ("POST", "/api/v1/admin/reports/:id/assignments", "reports.assign", "Asigna o reasigna."),
            ("GET", "/api/v1/admin/reports/:id/assignments", "reports.read", "Devuelve el historial."),
            ("DELETE", "/api/v1/admin/reports/:id/assignment", "reports.assign", "Retira la asignación."),
        ],
        [1.7, 6.2, 3.5, 4.7],
        7.5,
        [
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.LEFT,
        ],
    )

    doc.add_heading("10 Filtros de equipos", level=1)
    add_table(
        doc,
        ["Parámetro", "Regla"],
        [
            ("page", "Entero positivo; valor predeterminado 1."),
            ("perPage", "De 1 a 100; valor predeterminado 20."),
            ("search", "Busca en nombre o descripción."),
            ("dependencyId", "Solo el administrador global puede elegir otra dependencia."),
            ("isActive", "Filtra equipos activos o inactivos."),
        ],
        [4.6, 11.5],
        8.4,
    )
    doc.add_page_break()

    doc.add_heading("11 Ejemplos de peticiones", level=1)
    doc.add_heading("11 1 Crear un equipo", level=2)
    add_code(
        doc,
        'POST /api/v1/admin/teams\nAuthorization: Bearer <token>\nContent-Type: application/json\n\n'
        '{\n'
        '  "dependencyId": 4,\n'
        '  "name": "Cuadrilla nocturna",\n'
        '  "description": "Atención de luminarias",\n'
        '  "leaderUserId": 18,\n'
        '  "memberUserIds": [18, 21, 24]\n'
        '}',
    )
    doc.add_paragraph(
        "El arreglo no puede contener identificadores duplicados. Si el líder no aparece en memberUserIds, el backend "
        "lo agrega automáticamente."
    )
    doc.add_heading("11 2 Asignar una incidencia", level=2)
    add_code(
        doc,
        'POST /api/v1/admin/reports/42/assignments\nAuthorization: Bearer <token>\nContent-Type: application/json\n\n'
        '{\n'
        '  "workTeamId": 7,\n'
        '  "priority": "high",\n'
        '  "dueAt": "2026-11-05T18:00:00.000Z",\n'
        '  "observations": "Atender antes del fin de semana"\n'
        '}',
    )
    doc.add_paragraph(
        "dueAt debe ser una fecha ISO válida y futura. observations admite de 3 a 2000 caracteres cuando se envía."
    )

    doc.add_heading("12 Reasignación y retiro", level=1)
    add_code(
        doc,
        'DELETE /api/v1/admin/reports/42/assignment\nAuthorization: Bearer <token>\nContent-Type: application/json\n\n'
        '{\n  "note": "La incidencia será atendida por otra cuadrilla"\n}',
    )
    doc.add_paragraph(
        "El retiro exige un motivo de 3 a 2000 caracteres. En una reasignación, el sistema usa el motivo interno "
        "Reasignación administrativa y crea inmediatamente la nueva asignación."
    )
    doc.add_page_break()

    doc.add_heading("13 Prioridades y fechas", level=1)
    add_table(
        doc,
        ["Código", "Interpretación operativa", "Uso recomendado"],
        [
            ("low", "Baja", "Incidencia sin riesgo inmediato."),
            ("medium", "Media", "Atención dentro de la planeación normal."),
            ("high", "Alta", "Afectación relevante que requiere atención pronta."),
            ("urgent", "Urgente", "Riesgo o afectación crítica."),
        ],
        [3.0, 5.2, 7.9],
        8.3,
    )
    doc.add_paragraph(
        "La prioridad no cambia automáticamente el estado del reporte. La asignación organiza el trabajo y el flujo de "
        "estados de 3.3 sigue registrando pending, in_progress y resolved de manera independiente."
    )

    doc.add_heading("14 Permisos y alcance", level=1)
    add_table(
        doc,
        ["Operación", "admin", "dependency_admin", "user"],
        [
            ("Listar y consultar equipos", "Todas", "Su dependencia", "No"),
            ("Crear y editar equipos", "Todas", "Su dependencia", "No"),
            ("Cambiar integrantes o estado", "Todas", "Su dependencia", "No"),
            ("Asignar reportes", "Todas", "Su dependencia", "No"),
            ("Consultar historial", "Todas", "Su dependencia", "No"),
        ],
        [6.1, 3.1, 4.3, 2.6],
        8.2,
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
    )
    doc.add_paragraph(
        "Los permisos agregados son reports.assign, teams.list, teams.read, teams.create, teams.update, teams.status y "
        "teams.members. El rol user no recibe ninguno de ellos."
    )
    doc.add_page_break()

    doc.add_heading("15 Reglas de integridad", level=1)
    for text in (
        "La dependencia debe estar activa al crear el equipo.",
        "El nombre del equipo es único dentro de su dependencia.",
        "El líder y los integrantes deben estar activos y pertenecer a la misma dependencia.",
        "El líder siempre forma parte de los integrantes.",
        "El reporte debe tener una dependencia antes de asignarse.",
        "El equipo y el reporte deben compartir dependency_id.",
        "Solo puede existir una asignación activa señalada por current_assignment_id.",
        "Una fecha límite debe ser futura.",
        "Un equipo inactivo o sin personal disponible no puede recibir incidencias.",
        "Una cuenta ligada a un equipo activo no puede desactivarse hasta retirarla.",
    ):
        add_bullet(doc, text)

    doc.add_heading("16 Estructura de la respuesta", level=1)
    add_code(
        doc,
        '{\n'
        '  "data": {\n'
        '    "id": 12, "reporteId": 42, "prioridad": "high",\n'
        '    "equipo": {\n'
        '      "id": 7, "nombre": "Cuadrilla nocturna",\n'
        '      "lider": { "id": 18, "nombre": "Ana López", "email": "ana@example.com" },\n'
        '      "integrantes": []\n'
        '    },\n'
        '    "asignadoEn": "2026-11-01T18:00:00.000Z",\n'
        '    "fechaLimite": "2026-11-05T18:00:00.000Z",\n'
        '    "activa": true\n'
        '  }\n'
        '}',
    )
    doc.add_paragraph(
        "Los listados y detalles administrativos de reportes incluyen asignacionActual cuando existe. El historial de "
        "asignaciones se consulta mediante su endpoint específico y se devuelve de la más reciente a la más antigua."
    )
    doc.add_page_break()

    doc.add_heading("17 Errores controlados", level=1)
    add_table(
        doc,
        ["HTTP", "Código", "Causa"],
        [
            ("403", "E_PERMISSION_REQUIRED", "La cuenta no posee el permiso."),
            ("403", "E_DEPENDENCY_SCOPE", "Operación fuera de la dependencia."),
            ("403", "E_ASSIGNMENT_DEPENDENCY_SCOPE", "Equipo y reporte pertenecen a dependencias distintas."),
            ("404", "E_WORK_TEAM_NOT_FOUND", "Equipo inexistente."),
            ("404", "E_REPORT_NOT_FOUND", "Reporte inexistente."),
            ("409", "E_WORK_TEAM_DUPLICATE", "Nombre repetido dentro de la dependencia."),
            ("409", "E_WORK_TEAM_INACTIVE", "El equipo está inactivo."),
            ("409", "E_WORK_TEAM_UNAVAILABLE", "Falta líder o hay integrantes inactivos."),
            ("409", "E_WORK_TEAM_HAS_ACTIVE_ASSIGNMENTS", "El equipo aún tiene incidencias."),
            ("409", "E_USER_HAS_ACTIVE_TEAM", "El usuario sigue dentro de un equipo activo."),
            ("409", "E_REPORT_NOT_ASSIGNED", "No existe asignación activa para retirar."),
            ("422", "E_WORK_TEAM_MEMBERS_INVALID", "Integrantes duplicados, inactivos o externos."),
            ("422", "E_ASSIGNMENT_PRIORITY_INVALID", "Prioridad fuera del catálogo."),
            ("422", "E_ASSIGNMENT_DUE_DATE_INVALID", "Fecha inválida, vencida o actual."),
        ],
        [1.8, 6.5, 7.8],
        7.5,
    )
    doc.add_page_break()

    doc.add_heading("18 OpenAPI y Orval", level=1)
    doc.add_paragraph(
        "El contrato openapi/city-care.v1.yaml publica las nueve operaciones de 3.4 y conserva el servidor "
        "http://127.0.0.1:3333. Orval validó el contrato y regeneró sdk/generated/city-care.ts sin referencias al "
        "puerto temporal 3334."
    )
    add_table(
        doc,
        ["Operación", "Función Orval"],
        [
            ("listWorkTeams", "listWorkTeams"),
            ("createWorkTeam", "createWorkTeam"),
            ("getWorkTeam", "getWorkTeam"),
            ("updateWorkTeam", "updateWorkTeam"),
            ("updateWorkTeamStatus", "updateWorkTeamStatus"),
            ("updateWorkTeamMembers", "updateWorkTeamMembers"),
            ("assignReport", "assignReport"),
            ("listReportAssignments", "listReportAssignments"),
            ("unassignReport", "unassignReport"),
        ],
        [8.0, 8.1],
        8.3,
    )
    doc.add_paragraph(
        "El SDK es generado y no debe editarse manualmente. El flujo correcto es actualizar controladores e interfaces, "
        "exportar OpenAPI desde el backend configurado en 3333 y ejecutar npm run openapi:generate."
    )

    doc.add_heading("19 Componentes implementados", level=1)
    add_table(
        doc,
        ["Archivo", "Responsabilidad"],
        [
            ("work_teams_controller.ts", "CRUD, miembros, alcance, asignación, historial y retiro."),
            ("work_team.ts", "Relaciones de dependencia, líder, integrantes y asignaciones."),
            ("report_assignment.ts", "Relaciones del historial con reporte, equipo y actores."),
            ("work_team.ts validator", "Filtros, cuerpos, tamaños y formatos."),
            ("authorization_service.ts", "Matriz de permisos de 3.4."),
            ("admin_users_controller.ts", "Bloquea bajas de integrantes de equipos activos."),
            ("report_presenter_service.ts", "Incluye la asignación actual en reportes."),
            ("start/routes.ts", "Registra las nueve rutas y normaliza OpenAPI."),
            ("handler.ts", "Traduce errores operativos a respuestas uniformes."),
        ],
        [6.2, 9.9],
        7.8,
    )
    doc.add_page_break()

    doc.add_heading("20 Pruebas y evidencia", level=1)
    add_table(
        doc,
        ["Comprobación", "Resultado"],
        [
            ("Creación", "Líder incluido automáticamente como integrante."),
            ("Integrantes", "Duplicados, inactivos y externos rechazados."),
            ("Permisos", "El ciudadano recibe 403 en administración de equipos."),
            ("Alcance", "dependency_admin no puede salir de su dependencia."),
            ("Asignación", "Prioridad, fecha y observaciones persistidas."),
            ("Reasignación", "La anterior se cierra y el historial conserva ambas."),
            ("Bajas", "Equipos e integrantes activos quedan protegidos."),
            ("Retiro", "Exige motivo y libera current_assignment_id."),
            ("Suite completa", "64 de 64 pruebas aprobadas."),
            ("TypeScript", "npm run typecheck sin errores."),
            ("ESLint", "npm run lint sin errores."),
            ("Build", "Compilación de producción correcta."),
            ("OpenAPI y Orval", "Contrato válido y SDK regenerado en 3333."),
            ("MySQL", "15 migraciones completed."),
        ],
        [6.1, 10.0],
        8.1,
    )

    doc.add_heading("21 Guía de comprobación manual", level=1)
    add_numbered_steps(
        doc,
        (
            "Iniciar MySQL y el backend en http://127.0.0.1:3333.",
            "Iniciar sesión como admin o dependency_admin.",
            "Crear dos usuarios activos dentro de la misma dependencia.",
            "Crear un equipo con uno como líder y ambos como integrantes.",
            "Consultar el equipo y confirmar líder, integrantes y dependencia.",
            "Seleccionar un reporte de esa dependencia y asignarlo con prioridad high.",
            "Consultar el historial y confirmar que la asignación está activa.",
            "Reasignar a otro equipo y comprobar que el registro anterior queda cerrado.",
            "Retirar la asignación actual enviando una nota.",
            "Desactivar el equipo después de confirmar que no tiene incidencias activas.",
        ),
    )
    doc.add_page_break()

    doc.add_heading("22 Diagnóstico de problemas", level=1)
    add_table(
        doc,
        ["Síntoma", "Causa probable", "Revisión"],
        [
            ("403 al crear", "Dependencia fuera del alcance.", "Comparar dependency_id del token."),
            ("422 en miembros", "Usuario externo, inactivo o duplicado.", "Revisar estado, dependencia e IDs."),
            ("409 al asignar", "Equipo inactivo o sin personal disponible.", "Consultar detalle del equipo."),
            ("403 al asignar", "Equipo y reporte de dependencias distintas.", "Comparar ambas dependencias."),
            ("422 en fecha", "dueAt no es futura o no usa ISO.", "Enviar una fecha ISO posterior."),
            ("409 al desactivar equipo", "Mantiene una incidencia activa.", "Retirar o reasignar primero."),
            ("409 al desactivar usuario", "Continúa en un equipo activo.", "Actualizar integrantes primero."),
            ("Orval apunta a otro puerto", "OpenAPI se exportó con otra APP_URL.", "Confirmar PORT 3333 y regenerar."),
        ],
        [4.4, 5.7, 6.0],
        7.7,
    )

    doc.add_heading("23 Seguridad y decisiones técnicas", level=1)
    for text in (
        "El actor siempre procede del token y nunca del cuerpo de la petición.",
        "El permiso se combina con una comprobación explícita de dependencia.",
        "Las reasignaciones usan bloqueo de fila y una sola transacción.",
        "La referencia current_assignment_id evita dos asignaciones vigentes para el mismo reporte.",
        "La baja lógica conserva equipos e historial para consultas futuras.",
        "Las llaves foráneas usan RESTRICT, CASCADE o SET NULL según el valor histórico del dato.",
        "Los logs registran identificadores operativos sin tokens ni credenciales.",
    ):
        add_bullet(doc, text)

    doc.add_heading("24 Cierre de la etapa", level=1)
    doc.add_paragraph(
        "La etapa 3.4 queda concluida. City Care ya puede estructurar cuadrillas por dependencia, asignar incidencias, "
        "definir prioridad y fechas, reasignar sin perder historial y proteger la separación administrativa. La base "
        "queda preparada para el punto 3.5, donde la inteligencia artificial propondrá una clasificación y la "
        "dependencia responsable sin reemplazar la revisión administrativa."
    )

    doc.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    print(build_document())
