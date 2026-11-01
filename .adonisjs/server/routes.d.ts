import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'reports.store': { paramsTuple?: []; params?: {} }
    'admin.dependencies.index': { paramsTuple?: []; params?: {} }
    'admin.dependencies.store': { paramsTuple?: []; params?: {} }
    'admin.dependencies.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dependencies.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dependencies.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dependencies.update_managers': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.index': { paramsTuple?: []; params?: {} }
    'admin.new_account.store': { paramsTuple?: []; params?: {} }
    'admin.admin_users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'admin.dependencies.index': { paramsTuple?: []; params?: {} }
    'admin.dependencies.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'admin.dependencies.index': { paramsTuple?: []; params?: {} }
    'admin.dependencies.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'reports.store': { paramsTuple?: []; params?: {} }
    'admin.dependencies.store': { paramsTuple?: []; params?: {} }
    'admin.new_account.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'admin.dependencies.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dependencies.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dependencies.update_managers': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}