/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [{"old":"/api/v1/account/logout","type":0,"val":"api","end":""},{"old":"/api/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/account/logout","type":0,"val":"account","end":""},{"old":"/api/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'reports.store': {
    methods: ["POST"],
    pattern: '/api/v1/reports',
    tokens: [{"old":"/api/v1/reports","type":0,"val":"api","end":""},{"old":"/api/v1/reports","type":0,"val":"v1","end":""},{"old":"/api/v1/reports","type":0,"val":"reports","end":""}],
    types: placeholder as Registry['reports.store']['types'],
  },
  'report_categories.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/report-categories',
    tokens: [{"old":"/api/v1/report-categories","type":0,"val":"api","end":""},{"old":"/api/v1/report-categories","type":0,"val":"v1","end":""},{"old":"/api/v1/report-categories","type":0,"val":"report-categories","end":""}],
    types: placeholder as Registry['report_categories.index']['types'],
  },
  'reports.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/reports',
    tokens: [{"old":"/api/v1/reports","type":0,"val":"api","end":""},{"old":"/api/v1/reports","type":0,"val":"v1","end":""},{"old":"/api/v1/reports","type":0,"val":"reports","end":""}],
    types: placeholder as Registry['reports.index']['types'],
  },
  'reports.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/reports/:id',
    tokens: [{"old":"/api/v1/reports/:id","type":0,"val":"api","end":""},{"old":"/api/v1/reports/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/reports/:id","type":0,"val":"reports","end":""},{"old":"/api/v1/reports/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['reports.show']['types'],
  },
  'admin.report_queries.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/reports',
    tokens: [{"old":"/api/v1/admin/reports","type":0,"val":"api","end":""},{"old":"/api/v1/admin/reports","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/reports","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/reports","type":0,"val":"reports","end":""}],
    types: placeholder as Registry['admin.report_queries.index']['types'],
  },
  'admin.report_queries.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/reports/:id',
    tokens: [{"old":"/api/v1/admin/reports/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/reports/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/reports/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/reports/:id","type":0,"val":"reports","end":""},{"old":"/api/v1/admin/reports/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.report_queries.show']['types'],
  },
  'admin.report_queries.possible_duplicates': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/reports/:id/possible-duplicates',
    tokens: [{"old":"/api/v1/admin/reports/:id/possible-duplicates","type":0,"val":"api","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates","type":0,"val":"reports","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates","type":1,"val":"id","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates","type":0,"val":"possible-duplicates","end":""}],
    types: placeholder as Registry['admin.report_queries.possible_duplicates']['types'],
  },
  'admin.report_queries.review_possible_duplicate': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/reports/:id/possible-duplicates/:reviewId',
    tokens: [{"old":"/api/v1/admin/reports/:id/possible-duplicates/:reviewId","type":0,"val":"api","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates/:reviewId","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates/:reviewId","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates/:reviewId","type":0,"val":"reports","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates/:reviewId","type":1,"val":"id","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates/:reviewId","type":0,"val":"possible-duplicates","end":""},{"old":"/api/v1/admin/reports/:id/possible-duplicates/:reviewId","type":1,"val":"reviewId","end":""}],
    types: placeholder as Registry['admin.report_queries.review_possible_duplicate']['types'],
  },
  'admin.report_queries.update_status': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/reports/:id/status',
    tokens: [{"old":"/api/v1/admin/reports/:id/status","type":0,"val":"api","end":""},{"old":"/api/v1/admin/reports/:id/status","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/reports/:id/status","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/reports/:id/status","type":0,"val":"reports","end":""},{"old":"/api/v1/admin/reports/:id/status","type":1,"val":"id","end":""},{"old":"/api/v1/admin/reports/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['admin.report_queries.update_status']['types'],
  },
  'admin.work_teams.assign_report': {
    methods: ["POST"],
    pattern: '/api/v1/admin/reports/:id/assignments',
    tokens: [{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"api","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"reports","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":1,"val":"id","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"assignments","end":""}],
    types: placeholder as Registry['admin.work_teams.assign_report']['types'],
  },
  'admin.work_teams.assignment_history': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/reports/:id/assignments',
    tokens: [{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"api","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"reports","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":1,"val":"id","end":""},{"old":"/api/v1/admin/reports/:id/assignments","type":0,"val":"assignments","end":""}],
    types: placeholder as Registry['admin.work_teams.assignment_history']['types'],
  },
  'admin.work_teams.unassign_report': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/reports/:id/assignment',
    tokens: [{"old":"/api/v1/admin/reports/:id/assignment","type":0,"val":"api","end":""},{"old":"/api/v1/admin/reports/:id/assignment","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/reports/:id/assignment","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/reports/:id/assignment","type":0,"val":"reports","end":""},{"old":"/api/v1/admin/reports/:id/assignment","type":1,"val":"id","end":""},{"old":"/api/v1/admin/reports/:id/assignment","type":0,"val":"assignment","end":""}],
    types: placeholder as Registry['admin.work_teams.unassign_report']['types'],
  },
  'admin.work_teams.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/teams',
    tokens: [{"old":"/api/v1/admin/teams","type":0,"val":"api","end":""},{"old":"/api/v1/admin/teams","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/teams","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/teams","type":0,"val":"teams","end":""}],
    types: placeholder as Registry['admin.work_teams.index']['types'],
  },
  'admin.work_teams.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/teams',
    tokens: [{"old":"/api/v1/admin/teams","type":0,"val":"api","end":""},{"old":"/api/v1/admin/teams","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/teams","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/teams","type":0,"val":"teams","end":""}],
    types: placeholder as Registry['admin.work_teams.store']['types'],
  },
  'admin.work_teams.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/teams/:id',
    tokens: [{"old":"/api/v1/admin/teams/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/teams/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/teams/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/teams/:id","type":0,"val":"teams","end":""},{"old":"/api/v1/admin/teams/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.work_teams.show']['types'],
  },
  'admin.work_teams.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/teams/:id',
    tokens: [{"old":"/api/v1/admin/teams/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/teams/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/teams/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/teams/:id","type":0,"val":"teams","end":""},{"old":"/api/v1/admin/teams/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.work_teams.update']['types'],
  },
  'admin.work_teams.update_status': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/teams/:id/status',
    tokens: [{"old":"/api/v1/admin/teams/:id/status","type":0,"val":"api","end":""},{"old":"/api/v1/admin/teams/:id/status","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/teams/:id/status","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/teams/:id/status","type":0,"val":"teams","end":""},{"old":"/api/v1/admin/teams/:id/status","type":1,"val":"id","end":""},{"old":"/api/v1/admin/teams/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['admin.work_teams.update_status']['types'],
  },
  'admin.work_teams.update_members': {
    methods: ["PUT"],
    pattern: '/api/v1/admin/teams/:id/members',
    tokens: [{"old":"/api/v1/admin/teams/:id/members","type":0,"val":"api","end":""},{"old":"/api/v1/admin/teams/:id/members","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/teams/:id/members","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/teams/:id/members","type":0,"val":"teams","end":""},{"old":"/api/v1/admin/teams/:id/members","type":1,"val":"id","end":""},{"old":"/api/v1/admin/teams/:id/members","type":0,"val":"members","end":""}],
    types: placeholder as Registry['admin.work_teams.update_members']['types'],
  },
  'admin.dependencies.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/dependencies',
    tokens: [{"old":"/api/v1/admin/dependencies","type":0,"val":"api","end":""},{"old":"/api/v1/admin/dependencies","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/dependencies","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/dependencies","type":0,"val":"dependencies","end":""}],
    types: placeholder as Registry['admin.dependencies.index']['types'],
  },
  'admin.dependencies.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/dependencies',
    tokens: [{"old":"/api/v1/admin/dependencies","type":0,"val":"api","end":""},{"old":"/api/v1/admin/dependencies","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/dependencies","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/dependencies","type":0,"val":"dependencies","end":""}],
    types: placeholder as Registry['admin.dependencies.store']['types'],
  },
  'admin.dependencies.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/dependencies/:id',
    tokens: [{"old":"/api/v1/admin/dependencies/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/dependencies/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/dependencies/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/dependencies/:id","type":0,"val":"dependencies","end":""},{"old":"/api/v1/admin/dependencies/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.dependencies.show']['types'],
  },
  'admin.dependencies.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/dependencies/:id',
    tokens: [{"old":"/api/v1/admin/dependencies/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/dependencies/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/dependencies/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/dependencies/:id","type":0,"val":"dependencies","end":""},{"old":"/api/v1/admin/dependencies/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.dependencies.update']['types'],
  },
  'admin.dependencies.update_status': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/dependencies/:id/status',
    tokens: [{"old":"/api/v1/admin/dependencies/:id/status","type":0,"val":"api","end":""},{"old":"/api/v1/admin/dependencies/:id/status","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/dependencies/:id/status","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/dependencies/:id/status","type":0,"val":"dependencies","end":""},{"old":"/api/v1/admin/dependencies/:id/status","type":1,"val":"id","end":""},{"old":"/api/v1/admin/dependencies/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['admin.dependencies.update_status']['types'],
  },
  'admin.dependencies.update_managers': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/dependencies/:id/managers',
    tokens: [{"old":"/api/v1/admin/dependencies/:id/managers","type":0,"val":"api","end":""},{"old":"/api/v1/admin/dependencies/:id/managers","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/dependencies/:id/managers","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/dependencies/:id/managers","type":0,"val":"dependencies","end":""},{"old":"/api/v1/admin/dependencies/:id/managers","type":1,"val":"id","end":""},{"old":"/api/v1/admin/dependencies/:id/managers","type":0,"val":"managers","end":""}],
    types: placeholder as Registry['admin.dependencies.update_managers']['types'],
  },
  'admin.roles.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/roles',
    tokens: [{"old":"/api/v1/admin/roles","type":0,"val":"api","end":""},{"old":"/api/v1/admin/roles","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/roles","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/roles","type":0,"val":"roles","end":""}],
    types: placeholder as Registry['admin.roles.index']['types'],
  },
  'admin.admin_users.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/users',
    tokens: [{"old":"/api/v1/admin/users","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['admin.admin_users.index']['types'],
  },
  'admin.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/users',
    tokens: [{"old":"/api/v1/admin/users","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['admin.new_account.store']['types'],
  },
  'admin.admin_users.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/users/:id',
    tokens: [{"old":"/api/v1/admin/users/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users/:id","type":0,"val":"users","end":""},{"old":"/api/v1/admin/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.admin_users.show']['types'],
  },
  'admin.admin_users.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/users/:id',
    tokens: [{"old":"/api/v1/admin/users/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users/:id","type":0,"val":"users","end":""},{"old":"/api/v1/admin/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.admin_users.update']['types'],
  },
  'admin.admin_users.update_status': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/users/:id/status',
    tokens: [{"old":"/api/v1/admin/users/:id/status","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users/:id/status","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users/:id/status","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users/:id/status","type":0,"val":"users","end":""},{"old":"/api/v1/admin/users/:id/status","type":1,"val":"id","end":""},{"old":"/api/v1/admin/users/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['admin.admin_users.update_status']['types'],
  },
  'admin.admin_users.reset_password': {
    methods: ["PATCH"],
    pattern: '/api/v1/admin/users/:id/password',
    tokens: [{"old":"/api/v1/admin/users/:id/password","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users/:id/password","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users/:id/password","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users/:id/password","type":0,"val":"users","end":""},{"old":"/api/v1/admin/users/:id/password","type":1,"val":"id","end":""},{"old":"/api/v1/admin/users/:id/password","type":0,"val":"password","end":""}],
    types: placeholder as Registry['admin.admin_users.reset_password']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
