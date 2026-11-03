import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Credential from '#models/credential'
import Dependency from '#models/dependency'
import Report from '#models/report'
import ReportAssignment from '#models/report_assignment'
import ReportCategory from '#models/report_category'
import Role from '#models/role'
import User from '#models/user'
import WorkTeam from '#models/work_team'

let sequence = 0

async function createDependency(label: string) {
  sequence += 1
  return Dependency.create({
    name: `${label} ${Date.now()}-${sequence}`,
    description: null,
    isActive: true,
  })
}

async function createUser(dependency: Dependency, roleSlug = 'user') {
  sequence += 1
  const role = await Role.firstOrCreate(
    { slug: roleSlug },
    {
      name:
        roleSlug === 'admin'
          ? 'Administrador'
          : roleSlug === 'dependency_admin'
            ? 'Administrador de dependencia'
            : 'Usuario',
      slug: roleSlug,
      description: null,
    }
  )
  const email = `team-user-${Date.now()}-${sequence}@citycare.test`
  const user = await User.create({
    dependencyId: dependency.id,
    roleId: role.id,
    firstName: 'Personal',
    lastName: `${sequence}`,
    email,
    phoneNumber: null,
    jobTitle: 'Técnico',
    isActive: true,
  })
  await Credential.create({
    userId: user.id,
    email,
    passwordHash: await hash.make('TeamPassword123!'),
  })
  const token = await User.accessTokens.create(user)
  return { user, token: token.value!.release() }
}

async function createReport(dependency: Dependency, citizen: User) {
  sequence += 1
  const category = await ReportCategory.create({
    dependencyId: dependency.id,
    code: `team-category-${Date.now()}-${sequence}`,
    name: `Categoría equipo ${sequence}`,
    description: null,
    requiresDescription: false,
    isActive: true,
  })
  return Report.create({
    folio: `CC-TEST-${Date.now()}-${sequence}`,
    userId: citizen.id,
    categoryId: category.id,
    dependencyId: dependency.id,
    currentAssignmentId: null,
    description: 'Incidencia para asignación de equipo',
    address: null,
    latitude: '20.676650',
    longitude: '-103.347510',
    locationAccuracy: null,
    locationSource: 'gps',
    status: 'pending',
  })
}

test.group('Asignación a dependencias y equipos 3.4', () => {
  test('crea un equipo y garantiza que el líder también sea integrante', async ({
    client,
    assert,
  }) => {
    const dependency = await createDependency('Alumbrado')
    const manager = await createUser(dependency, 'dependency_admin')
    const leader = await createUser(dependency)
    const technician = await createUser(dependency)

    const response = await client
      .post('/api/v1/admin/teams')
      .bearerToken(manager.token)
      .json({
        dependencyId: dependency.id,
        name: 'Cuadrilla nocturna',
        description: 'Atención de luminarias',
        leaderUserId: leader.user.id,
        memberUserIds: [technician.user.id],
      })

    response.assertStatus(201)
    const responseBody = response.body() as any
    assert.equal(responseBody.data.lider.id, leader.user.id)
    assert.deepEqual(
      responseBody.data.integrantes.map((member: { id: number }) => member.id).sort(),
      [leader.user.id, technician.user.id].sort()
    )

    const team = await WorkTeam.findOrFail(responseBody.data.id)
    await team.load('members')
    assert.lengthOf(team.members, 2)
  })

  test('rechaza líderes, integrantes y equipos de otra dependencia', async ({ client, assert }) => {
    const dependencyA = await createDependency('Parques')
    const dependencyB = await createDependency('Movilidad')
    const managerA = await createUser(dependencyA, 'dependency_admin')
    const leaderA = await createUser(dependencyA)
    const foreignMember = await createUser(dependencyB)

    const invalidTeam = await client
      .post('/api/v1/admin/teams')
      .bearerToken(managerA.token)
      .json({
        dependencyId: dependencyA.id,
        name: 'Equipo inválido',
        leaderUserId: leaderA.user.id,
        memberUserIds: [foreignMember.user.id],
      })
    invalidTeam.assertStatus(422)
    assert.equal((invalidTeam.body() as any).error.code, 'E_WORK_TEAM_MEMBERS_INVALID')

    const forbiddenDependency = await client
      .post('/api/v1/admin/teams')
      .bearerToken(managerA.token)
      .json({
        dependencyId: dependencyB.id,
        name: 'Equipo fuera de alcance',
        leaderUserId: foreignMember.user.id,
        memberUserIds: [foreignMember.user.id],
      })
    forbiddenDependency.assertStatus(403)
    assert.equal((forbiddenDependency.body() as any).error.code, 'E_DEPENDENCY_SCOPE')
  })

  test('impide desactivar integrantes de equipos activos hasta retirarlos', async ({
    client,
    assert,
  }) => {
    const dependency = await createDependency('Mantenimiento')
    const manager = await createUser(dependency, 'dependency_admin')
    const leader = await createUser(dependency)
    const technician = await createUser(dependency)
    const teamResponse = await client
      .post('/api/v1/admin/teams')
      .bearerToken(manager.token)
      .json({
        dependencyId: dependency.id,
        name: 'Equipo de mantenimiento',
        leaderUserId: leader.user.id,
        memberUserIds: [technician.user.id],
      })
    const teamId = (teamResponse.body() as any).data.id

    const blocked = await client
      .patch(`/api/v1/admin/users/${technician.user.id}/status`)
      .bearerToken(manager.token)
      .json({ isActive: false })
    blocked.assertStatus(409)
    assert.equal((blocked.body() as any).error.code, 'E_USER_HAS_ACTIVE_TEAM')

    const members = await client
      .put(`/api/v1/admin/teams/${teamId}/members`)
      .bearerToken(manager.token)
      .json({ memberUserIds: [leader.user.id] })
    members.assertStatus(200)

    const disabled = await client
      .patch(`/api/v1/admin/users/${technician.user.id}/status`)
      .bearerToken(manager.token)
      .json({ isActive: false })
    disabled.assertStatus(200)
  })

  test('rechaza la administración de equipos para ciudadanos sin permiso', async ({ client }) => {
    const dependency = await createDependency('Servicios')
    const citizen = await createUser(dependency)
    const response = await client.get('/api/v1/admin/teams').bearerToken(citizen.token)
    response.assertStatus(403)
  })

  test('asigna y reasigna una incidencia conservando todo el historial', async ({
    client,
    assert,
  }) => {
    const dependency = await createDependency('Obras públicas')
    const manager = await createUser(dependency, 'dependency_admin')
    const citizen = await createUser(dependency)
    const leaderOne = await createUser(dependency)
    const leaderTwo = await createUser(dependency)
    const report = await createReport(dependency, citizen.user)

    const createTeam = async (name: string, leaderUserId: number) => {
      const response = await client
        .post('/api/v1/admin/teams')
        .bearerToken(manager.token)
        .json({ dependencyId: dependency.id, name, leaderUserId, memberUserIds: [leaderUserId] })
      response.assertStatus(201)
      return (response.body() as any).data.id as number
    }
    const teamOneId = await createTeam('Cuadrilla uno', leaderOne.user.id)
    const teamTwoId = await createTeam('Cuadrilla dos', leaderTwo.user.id)

    const first = await client
      .post(`/api/v1/admin/reports/${report.id}/assignments`)
      .bearerToken(manager.token)
      .json({
        workTeamId: teamOneId,
        expectedVersion: 1,
        priority: 'high',
        dueAt: DateTime.utc().plus({ days: 2 }).toISO(),
        observations: 'Atender antes del fin de semana',
      })
    first.assertStatus(201)
    assert.isTrue((first.body() as any).data.activa)
    assert.equal((first.body() as any).data.prioridad, 'high')

    const stale = await client
      .post(`/api/v1/admin/reports/${report.id}/assignments`)
      .bearerToken(manager.token)
      .json({
        workTeamId: teamTwoId,
        expectedVersion: 1,
        priority: 'urgent',
        observations: 'Solicitud enviada desde una vista desactualizada',
      })
    stale.assertStatus(409)
    assert.equal((stale.body() as any).error.code, 'E_REPORT_CONCURRENCY_CONFLICT')

    const second = await client
      .post(`/api/v1/admin/reports/${report.id}/assignments`)
      .bearerToken(manager.token)
      .json({
        workTeamId: teamTwoId,
        expectedVersion: 2,
        priority: 'urgent',
        observations: 'Reasignación operativa',
      })
    second.assertStatus(201)

    const history = await client
      .get(`/api/v1/admin/reports/${report.id}/assignments`)
      .bearerToken(manager.token)
    history.assertStatus(200)
    const historyBody = history.body() as any
    assert.lengthOf(historyBody.data, 2)
    assert.isTrue(historyBody.data[0].activa)
    assert.isFalse(historyBody.data[1].activa)
    assert.equal(historyBody.data[1].motivoRetiro, 'Reasignación administrativa')

    await report.refresh()
    assert.equal(report.currentAssignmentId, (second.body() as any).data.id)
  })

  test('impide asignar reportes a equipos de otra dependencia', async ({ client, assert }) => {
    const dependencyA = await createDependency('Agua')
    const dependencyB = await createDependency('Aseo')
    const managerA = await createUser(dependencyA, 'dependency_admin')
    const admin = await createUser(dependencyB, 'admin')
    const citizenA = await createUser(dependencyA)
    const leaderB = await createUser(dependencyB)
    const report = await createReport(dependencyA, citizenA.user)
    const teamResponse = await client
      .post('/api/v1/admin/teams')
      .bearerToken(admin.token)
      .json({
        dependencyId: dependencyB.id,
        name: 'Equipo B',
        leaderUserId: leaderB.user.id,
        memberUserIds: [leaderB.user.id],
      })
    teamResponse.assertStatus(201)

    const response = await client
      .post(`/api/v1/admin/reports/${report.id}/assignments`)
      .bearerToken(managerA.token)
      .json({
        workTeamId: (teamResponse.body() as any).data.id,
        expectedVersion: 1,
        priority: 'medium',
      })
    response.assertStatus(403)
    assert.equal((response.body() as any).error.code, 'E_ASSIGNMENT_DEPENDENCY_SCOPE')
  })

  test('solo permite desactivar un equipo después de retirar su asignación activa', async ({
    client,
    assert,
  }) => {
    const dependency = await createDependency('Semáforos')
    const manager = await createUser(dependency, 'dependency_admin')
    const citizen = await createUser(dependency)
    const leader = await createUser(dependency)
    const report = await createReport(dependency, citizen.user)
    const teamResponse = await client
      .post('/api/v1/admin/teams')
      .bearerToken(manager.token)
      .json({
        dependencyId: dependency.id,
        name: 'Equipo semáforos',
        leaderUserId: leader.user.id,
        memberUserIds: [leader.user.id],
      })
    const teamId = (teamResponse.body() as any).data.id
    await client
      .post(`/api/v1/admin/reports/${report.id}/assignments`)
      .bearerToken(manager.token)
      .json({ workTeamId: teamId, expectedVersion: 1, priority: 'medium' })

    const blocked = await client
      .patch(`/api/v1/admin/teams/${teamId}/status`)
      .bearerToken(manager.token)
      .json({ isActive: false })
    blocked.assertStatus(409)
    assert.equal((blocked.body() as any).error.code, 'E_WORK_TEAM_HAS_ACTIVE_ASSIGNMENTS')

    const unassigned = await client
      .delete(`/api/v1/admin/reports/${report.id}/assignment`)
      .bearerToken(manager.token)
      .json({ note: 'Se cancela la atención de esta cuadrilla', expectedVersion: 2 })
    unassigned.assertStatus(200)
    assert.isFalse((unassigned.body() as any).data.activa)

    const disabled = await client
      .patch(`/api/v1/admin/teams/${teamId}/status`)
      .bearerToken(manager.token)
      .json({ isActive: false })
    disabled.assertStatus(200)
    assert.isFalse((disabled.body() as any).data.activo)

    const assignments = await ReportAssignment.query().where('report_id', report.id)
    assert.lengthOf(assignments, 1)
    assert.isNotNull(assignments[0].unassignedAt)
  })
})
