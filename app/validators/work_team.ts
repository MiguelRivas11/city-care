import vine from '@vinejs/vine'

const teamName = () => vine.string().trim().minLength(2).maxLength(150)
const userIds = () =>
  vine.array(vine.number().positive().withoutDecimals()).minLength(1).maxLength(100)

export const listWorkTeamsValidator = vine.create({
  page: vine.number().positive().withoutDecimals().optional(),
  perPage: vine.number().range([1, 100]).withoutDecimals().optional(),
  search: vine.string().trim().maxLength(150).optional(),
  dependencyId: vine.number().positive().withoutDecimals().optional(),
  isActive: vine.boolean().optional(),
})

export const createWorkTeamValidator = vine.create({
  dependencyId: vine.number().positive().withoutDecimals(),
  name: teamName(),
  description: vine.string().trim().maxLength(1000).nullable().optional(),
  leaderUserId: vine.number().positive().withoutDecimals(),
  memberUserIds: userIds(),
})

export const updateWorkTeamValidator = vine.create({
  name: teamName().optional(),
  description: vine.string().trim().maxLength(1000).nullable().optional(),
  leaderUserId: vine.number().positive().withoutDecimals().optional(),
})

export const updateWorkTeamStatusValidator = vine.create({
  isActive: vine.boolean(),
})

export const updateWorkTeamMembersValidator = vine.create({
  memberUserIds: userIds(),
})

export const assignReportValidator = vine.create({
  workTeamId: vine.number().positive().withoutDecimals(),
  expectedVersion: vine.number().positive().withoutDecimals(),
  priority: vine.string().trim().maxLength(20),
  dueAt: vine.string().trim().maxLength(40).nullable().optional(),
  observations: vine.string().trim().minLength(3).maxLength(2000).nullable().optional(),
})

export const unassignReportValidator = vine.create({
  expectedVersion: vine.number().positive().withoutDecimals(),
  note: vine.string().trim().minLength(3).maxLength(2000),
})
