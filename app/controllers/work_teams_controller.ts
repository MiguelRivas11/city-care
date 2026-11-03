import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

import Dependency from '#models/dependency'
import Report from '#models/report'
import ReportAssignment from '#models/report_assignment'
import User from '#models/user'
import WorkTeam from '#models/work_team'
import { assertDependencyAccess, isGlobalAdministrator } from '#services/authorization_service'
import { assertReportVersion, incrementReportVersion } from '#services/report_concurrency_service'
import {
  assignReportValidator,
  createWorkTeamValidator,
  listWorkTeamsValidator,
  unassignReportValidator,
  updateWorkTeamMembersValidator,
  updateWorkTeamStatusValidator,
  updateWorkTeamValidator,
} from '#validators/work_team'
import { DateTime } from 'luxon'

function resourceNotFound(resource: 'team' | 'report') {
  return new Exception(
    resource === 'team' ? 'Equipo de trabajo no encontrado' : 'Reporte no encontrado',
    {
      status: 404,
      code: resource === 'team' ? 'E_WORK_TEAM_NOT_FOUND' : 'E_REPORT_NOT_FOUND',
    }
  )
}

function parseId(value: string, resource: 'team' | 'report'): number {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id < 1) throw resourceNotFound(resource)
  return id
}

async function loadTeam(team: WorkTeam): Promise<void> {
  await team.load((preloader) => {
    preloader
      .load('dependency')
      .load('leader')
      .load('members', (query) => query.orderBy('first_name', 'asc').orderBy('last_name', 'asc'))
  })
}

function publicUser(user: User) {
  return {
    id: user.id,
    nombre: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    ...(user.jobTitle ? { puesto: user.jobTitle } : {}),
  }
}

function publicTeam(team: WorkTeam) {
  return {
    id: team.id,
    dependencia: { id: team.dependency.id, nombre: team.dependency.name },
    nombre: team.name,
    ...(team.description ? { descripcion: team.description } : {}),
    activo: Boolean(team.isActive),
    ...(team.leader ? { lider: publicUser(team.leader) } : {}),
    integrantes: team.members.map(publicUser),
    creadoEn: team.createdAt.toUTC().toISO(),
    actualizadoEn: team.updatedAt.toUTC().toISO(),
  }
}

async function validateUsers(dependencyId: number, leaderUserId: number, memberUserIds: number[]) {
  const uniqueIds = [...new Set([...memberUserIds, leaderUserId])]
  if (new Set(memberUserIds).size !== memberUserIds.length) {
    throw new Exception('Los integrantes del equipo no pueden estar duplicados', {
      status: 422,
      code: 'E_WORK_TEAM_MEMBERS_INVALID',
    })
  }

  const users = await User.query()
    .whereIn('id', uniqueIds)
    .where('dependency_id', dependencyId)
    .where('is_active', true)

  if (users.length !== uniqueIds.length) {
    throw new Exception('El líder y los integrantes deben ser usuarios activos de la dependencia', {
      status: 422,
      code: 'E_WORK_TEAM_MEMBERS_INVALID',
    })
  }

  return uniqueIds
}

async function replaceMembers(team: WorkTeam, userIds: number[]) {
  await db.transaction(async (trx) => {
    await trx.from('work_team_members').where('work_team_id', team.id).delete()
    await trx
      .table('work_team_members')
      .multiInsert(userIds.map((userId) => ({ work_team_id: team.id, user_id: userId })))
  })
}

function assignmentQuery(reportId: number) {
  return ReportAssignment.query()
    .where('report_id', reportId)
    .preload('workTeam', (teamQuery) => {
      teamQuery
        .preload('dependency')
        .preload('leader')
        .preload('members', (memberQuery) => memberQuery.orderBy('first_name', 'asc'))
    })
    .preload('assignedBy')
    .preload('unassignedBy')
    .orderBy('id', 'desc')
}

function publicAssignment(assignment: ReportAssignment) {
  return {
    id: assignment.id,
    reporteId: assignment.reportId,
    equipo: publicTeam(assignment.workTeam),
    prioridad: assignment.priority,
    ...(assignment.observations ? { observaciones: assignment.observations } : {}),
    asignadoEn: assignment.assignedAt.toUTC().toISO(),
    ...(assignment.dueAt ? { fechaLimite: assignment.dueAt.toUTC().toISO() } : {}),
    ...(assignment.assignedBy ? { asignadoPor: publicUser(assignment.assignedBy) } : {}),
    activa: assignment.unassignedAt === null,
    ...(assignment.unassignedAt ? { retiradaEn: assignment.unassignedAt.toUTC().toISO() } : {}),
    ...(assignment.unassignmentNote ? { motivoRetiro: assignment.unassignmentNote } : {}),
    ...(assignment.unassignedBy ? { retiradaPor: publicUser(assignment.unassignedBy) } : {}),
  }
}

function parseDueAt(value: string | null | undefined): DateTime | null {
  if (!value) return null
  const date = DateTime.fromISO(value, { setZone: true }).toUTC()
  if (!date.isValid || date <= DateTime.utc()) {
    throw new Exception('La fecha límite debe ser una fecha ISO válida y futura', {
      status: 422,
      code: 'E_ASSIGNMENT_DUE_DATE_INVALID',
    })
  }
  return date
}

function currentDatabaseDateTime(): string {
  return DateTime.utc().toFormat('yyyy-LL-dd HH:mm:ss')
}

function parsePriority(value: string): 'low' | 'medium' | 'high' | 'urgent' {
  if (!['low', 'medium', 'high', 'urgent'].includes(value)) {
    throw new Exception('La prioridad debe ser low, medium, high o urgent', {
      status: 422,
      code: 'E_ASSIGNMENT_PRIORITY_INVALID',
    })
  }
  return value as 'low' | 'medium' | 'high' | 'urgent'
}

async function getScopedReport(actor: User, id: number) {
  await actor.load((preloader) => preloader.load('role'))
  const report = await Report.find(id)
  if (!report) throw resourceNotFound('report')
  if (report.dependencyId === null) {
    throw new Exception('El reporte todavía no tiene una dependencia asignada', {
      status: 409,
      code: 'E_REPORT_DEPENDENCY_REQUIRED',
    })
  }
  assertDependencyAccess(actor, report.dependencyId)
  return report
}

export default class WorkTeamsController {
  /**
   * @index
   * @operationId listWorkTeams
   * @summary Listar equipos de trabajo
   * @paramQuery page - Número de página - @type(number)
   * @paramQuery perPage - Registros por página - @type(number)
   * @paramQuery search - Nombre o descripción - @type(string)
   * @paramQuery dependencyId - Dependencia - @type(number)
   * @paramQuery isActive - Estado del equipo - @type(boolean)
   * @responseBody 200 - <WorkTeamsListApiResponse>
   * @responseBody 403 - <ApiErrorResponse>
   */
  async index({ auth, request }: HttpContext) {
    const actor = auth.getUserOrFail()
    await actor.load((preloader) => preloader.load('role'))
    const filters = await request.validateUsing(listWorkTeamsValidator)
    const query = WorkTeam.query()
      .preload('dependency')
      .preload('leader')
      .preload('members', (memberQuery) => memberQuery.orderBy('first_name', 'asc'))
      .orderBy('name', 'asc')

    if (!isGlobalAdministrator(actor)) query.where('dependency_id', actor.dependencyId)
    else if (filters.dependencyId) query.where('dependency_id', filters.dependencyId)
    if (filters.isActive !== undefined) query.where('is_active', filters.isActive)
    if (filters.search) {
      query.where((builder) => {
        const search = `%${filters.search}%`
        builder.whereILike('name', search).orWhereILike('description', search)
      })
    }

    const teams = await query.paginate(filters.page ?? 1, filters.perPage ?? 20)
    return { data: teams.all().map(publicTeam), meta: teams.getMeta() }
  }

  /** @show @operationId getWorkTeam @summary Consultar un equipo @paramPath id - Equipo - @type(number) @required @responseBody 200 - <WorkTeamDetailApiResponse> */
  async show({ auth, params }: HttpContext) {
    const team = await WorkTeam.find(parseId(params.id, 'team'))
    if (!team) throw resourceNotFound('team')
    const actor = auth.getUserOrFail()
    await actor.load((preloader) => preloader.load('role'))
    assertDependencyAccess(actor, team.dependencyId)
    await loadTeam(team)
    return { data: publicTeam(team) }
  }

  /** @store @operationId createWorkTeam @summary Crear un equipo @requestBody <CreateWorkTeamRequest> @responseBody 201 - <WorkTeamDetailApiResponse> */
  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(createWorkTeamValidator)
    const actor = auth.getUserOrFail()
    await actor.load((preloader) => preloader.load('role'))
    assertDependencyAccess(actor, payload.dependencyId)
    const dependency = await Dependency.find(payload.dependencyId)
    if (!dependency?.isActive) {
      throw new Exception('La dependencia seleccionada está inactiva', {
        status: 409,
        code: 'E_DEPENDENCY_INACTIVE',
      })
    }
    const duplicate = await WorkTeam.query()
      .where('dependency_id', payload.dependencyId)
      .where('name', payload.name)
      .first()
    if (duplicate)
      throw new Exception('Ya existe un equipo con ese nombre en la dependencia', {
        status: 409,
        code: 'E_WORK_TEAM_DUPLICATE',
      })
    const memberIds = await validateUsers(
      payload.dependencyId,
      payload.leaderUserId,
      payload.memberUserIds
    )

    const team = await db.transaction(async (trx) => {
      const created = await WorkTeam.create(
        {
          dependencyId: payload.dependencyId,
          name: payload.name,
          description: payload.description ?? null,
          leaderUserId: payload.leaderUserId,
          isActive: true,
        },
        { client: trx }
      )
      await trx
        .table('work_team_members')
        .multiInsert(memberIds.map((userId) => ({ work_team_id: created.id, user_id: userId })))
      return created
    })
    await loadTeam(team)
    logger.info({ actorUserId: actor.id, workTeamId: team.id }, 'work_team_created')
    return response.created({ data: publicTeam(team) })
  }

  /** @update @operationId updateWorkTeam @summary Editar un equipo @paramPath id - Equipo - @type(number) @required @requestBody <UpdateWorkTeamRequest> @responseBody 200 - <WorkTeamDetailApiResponse> */
  async update({ auth, params, request }: HttpContext) {
    const team = await WorkTeam.find(parseId(params.id, 'team'))
    if (!team) throw resourceNotFound('team')
    const actor = auth.getUserOrFail()
    await actor.load((preloader) => preloader.load('role'))
    assertDependencyAccess(actor, team.dependencyId)
    const payload = await request.validateUsing(updateWorkTeamValidator)
    if (Object.keys(payload).length === 0)
      throw new Exception('Envía al menos un campo para actualizar el equipo', {
        status: 422,
        code: 'E_EMPTY_WORK_TEAM_UPDATE',
      })
    if (payload.name && payload.name !== team.name) {
      const duplicate = await WorkTeam.query()
        .where('dependency_id', team.dependencyId)
        .where('name', payload.name)
        .whereNot('id', team.id)
        .first()
      if (duplicate)
        throw new Exception('Ya existe un equipo con ese nombre en la dependencia', {
          status: 409,
          code: 'E_WORK_TEAM_DUPLICATE',
        })
      team.name = payload.name
    }
    if (payload.description !== undefined) team.description = payload.description
    if (payload.leaderUserId !== undefined) {
      await team.load('members')
      const ids = await validateUsers(
        team.dependencyId,
        payload.leaderUserId,
        team.members.map((member) => member.id)
      )
      team.leaderUserId = payload.leaderUserId
      await replaceMembers(team, ids)
    }
    await team.save()
    await loadTeam(team)
    return { data: publicTeam(team) }
  }

  /** @updateStatus @operationId updateWorkTeamStatus @summary Activar o desactivar un equipo @paramPath id - Equipo - @type(number) @required @requestBody <UpdateWorkTeamStatusRequest> @responseBody 200 - <WorkTeamDetailApiResponse> */
  async updateStatus({ auth, params, request }: HttpContext) {
    const team = await WorkTeam.find(parseId(params.id, 'team'))
    if (!team) throw resourceNotFound('team')
    const actor = auth.getUserOrFail()
    await actor.load((preloader) => preloader.load('role'))
    assertDependencyAccess(actor, team.dependencyId)
    const payload = await request.validateUsing(updateWorkTeamStatusValidator)
    if (!payload.isActive) {
      const activeAssignment = await ReportAssignment.query()
        .where('work_team_id', team.id)
        .whereNull('unassigned_at')
        .first()
      if (activeAssignment)
        throw new Exception('No puedes desactivar un equipo con incidencias asignadas', {
          status: 409,
          code: 'E_WORK_TEAM_HAS_ACTIVE_ASSIGNMENTS',
        })
    }
    team.isActive = payload.isActive
    await team.save()
    await loadTeam(team)
    return { data: publicTeam(team) }
  }

  /** @updateMembers @operationId updateWorkTeamMembers @summary Reemplazar integrantes de un equipo @paramPath id - Equipo - @type(number) @required @requestBody <UpdateWorkTeamMembersRequest> @responseBody 200 - <WorkTeamDetailApiResponse> */
  async updateMembers({ auth, params, request }: HttpContext) {
    const team = await WorkTeam.find(parseId(params.id, 'team'))
    if (!team) throw resourceNotFound('team')
    const actor = auth.getUserOrFail()
    await actor.load((preloader) => preloader.load('role'))
    assertDependencyAccess(actor, team.dependencyId)
    const payload = await request.validateUsing(updateWorkTeamMembersValidator)
    if (team.leaderUserId === null)
      throw new Exception('El equipo debe tener un líder antes de administrar integrantes', {
        status: 409,
        code: 'E_WORK_TEAM_LEADER_REQUIRED',
      })
    const memberIds = await validateUsers(
      team.dependencyId,
      team.leaderUserId,
      payload.memberUserIds
    )
    await replaceMembers(team, memberIds)
    await loadTeam(team)
    return { data: publicTeam(team) }
  }

  /** @assignReport @operationId assignReport @summary Asignar o reasignar una incidencia @paramPath id - Reporte - @type(number) @required @requestBody <AssignReportRequest> @responseBody 201 - <ReportAssignmentApiResponse> */
  async assignReport({ auth, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(assignReportValidator)
    const actor = auth.getUserOrFail()
    const report = await getScopedReport(actor, parseId(params.id, 'report'))
    const team = await WorkTeam.find(payload.workTeamId)
    if (!team) throw resourceNotFound('team')
    if (!team.isActive)
      throw new Exception('El equipo seleccionado está inactivo', {
        status: 409,
        code: 'E_WORK_TEAM_INACTIVE',
      })
    await loadTeam(team)
    if (
      !team.leader ||
      !team.leader.isActive ||
      team.members.length === 0 ||
      team.members.some((member) => !member.isActive)
    ) {
      throw new Exception('El equipo no tiene líder e integrantes activos disponibles', {
        status: 409,
        code: 'E_WORK_TEAM_UNAVAILABLE',
      })
    }
    if (team.dependencyId !== report.dependencyId)
      throw new Exception('El equipo y el reporte deben pertenecer a la misma dependencia', {
        status: 403,
        code: 'E_ASSIGNMENT_DEPENDENCY_SCOPE',
      })
    const dueAt = parseDueAt(payload.dueAt)
    const priority = parsePriority(payload.priority)

    const assignment = await db.transaction(async (trx) => {
      const lockedReport = await Report.query({ client: trx })
        .where('id', report.id)
        .forUpdate()
        .firstOrFail()

      assertReportVersion(lockedReport, payload.expectedVersion)

      await ReportAssignment.query({ client: trx })
        .where('report_id', lockedReport.id)
        .whereNull('unassigned_at')
        .update({
          unassignedAt: currentDatabaseDateTime(),
          unassignedByUserId: actor.id,
          unassignmentNote: 'Reasignación administrativa',
        })

      const created = await ReportAssignment.create(
        {
          reportId: report.id,
          workTeamId: team.id,
          assignedByUserId: actor.id,
          priority,
          observations: payload.observations ?? null,
          assignedAt: DateTime.utc(),
          dueAt,
          unassignedAt: null,
          unassignedByUserId: null,
          unassignmentNote: null,
        },
        { client: trx }
      )
      lockedReport.useTransaction(trx)
      lockedReport.currentAssignmentId = created.id
      incrementReportVersion(lockedReport)
      await lockedReport.save()
      return created
    })
    const detailed = await assignmentQuery(report.id).where('id', assignment.id).firstOrFail()
    logger.info(
      {
        actorUserId: actor.id,
        reportId: report.id,
        workTeamId: team.id,
        assignmentId: assignment.id,
      },
      'report_assigned'
    )
    return response.created({ data: publicAssignment(detailed) })
  }

  /** @assignmentHistory @operationId listReportAssignments @summary Consultar historial de asignaciones @paramPath id - Reporte - @type(number) @required @responseBody 200 - <ReportAssignmentsListApiResponse> */
  async assignmentHistory({ auth, params }: HttpContext) {
    const report = await getScopedReport(auth.getUserOrFail(), parseId(params.id, 'report'))
    const assignments = await assignmentQuery(report.id)
    return { data: assignments.map(publicAssignment) }
  }

  /** @unassignReport @operationId unassignReport @summary Retirar la asignación actual @paramPath id - Reporte - @type(number) @required @requestBody <UnassignReportRequest> @responseBody 200 - <ReportAssignmentApiResponse> */
  async unassignReport({ auth, params, request }: HttpContext) {
    const payload = await request.validateUsing(unassignReportValidator)
    const actor = auth.getUserOrFail()
    const report = await getScopedReport(actor, parseId(params.id, 'report'))

    const assignmentId = await db.transaction(async (trx) => {
      const lockedReport = await Report.query({ client: trx })
        .where('id', report.id)
        .forUpdate()
        .firstOrFail()

      assertReportVersion(lockedReport, payload.expectedVersion)

      if (!lockedReport.currentAssignmentId) {
        throw new Exception('El reporte no tiene una asignación activa', {
          status: 409,
          code: 'E_REPORT_NOT_ASSIGNED',
        })
      }

      const currentAssignmentId = lockedReport.currentAssignmentId
      await ReportAssignment.query({ client: trx }).where('id', currentAssignmentId).update({
        unassignedAt: currentDatabaseDateTime(),
        unassignedByUserId: actor.id,
        unassignmentNote: payload.note,
      })

      lockedReport.useTransaction(trx)
      lockedReport.currentAssignmentId = null
      incrementReportVersion(lockedReport)
      await lockedReport.save()

      return currentAssignmentId
    })
    const detailed = await assignmentQuery(report.id).where('id', assignmentId).firstOrFail()
    logger.info({ actorUserId: actor.id, reportId: report.id, assignmentId }, 'report_unassigned')
    return { data: publicAssignment(detailed) }
  }
}
