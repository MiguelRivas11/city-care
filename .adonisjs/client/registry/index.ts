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
