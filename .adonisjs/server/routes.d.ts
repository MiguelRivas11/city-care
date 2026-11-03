import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'reports.store': { paramsTuple?: []; params?: {} }
    'report_categories.index': { paramsTuple?: []; params?: {} }
    'reports.index': { paramsTuple?: []; params?: {} }
    'reports.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report_queries.index': { paramsTuple?: []; params?: {} }
    'admin.report_queries.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report_queries.possible_duplicates': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report_queries.review_possible_duplicate': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'reviewId': ParamValue} }
    'admin.report_queries.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.assign_report': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.assignment_history': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.unassign_report': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.index': { paramsTuple?: []; params?: {} }
    'admin.work_teams.store': { paramsTuple?: []; params?: {} }
    'admin.work_teams.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.update_members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'report_categories.index': { paramsTuple?: []; params?: {} }
    'reports.index': { paramsTuple?: []; params?: {} }
    'reports.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report_queries.index': { paramsTuple?: []; params?: {} }
    'admin.report_queries.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report_queries.possible_duplicates': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.assignment_history': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.index': { paramsTuple?: []; params?: {} }
    'admin.work_teams.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dependencies.index': { paramsTuple?: []; params?: {} }
    'admin.dependencies.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.index': { paramsTuple?: []; params?: {} }
    'admin.admin_users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'report_categories.index': { paramsTuple?: []; params?: {} }
    'reports.index': { paramsTuple?: []; params?: {} }
    'reports.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report_queries.index': { paramsTuple?: []; params?: {} }
    'admin.report_queries.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.report_queries.possible_duplicates': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.assignment_history': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.index': { paramsTuple?: []; params?: {} }
    'admin.work_teams.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'admin.work_teams.assign_report': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.store': { paramsTuple?: []; params?: {} }
    'admin.dependencies.store': { paramsTuple?: []; params?: {} }
    'admin.new_account.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'admin.report_queries.review_possible_duplicate': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'reviewId': ParamValue} }
    'admin.report_queries.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.work_teams.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dependencies.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dependencies.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.dependencies.update_managers': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.admin_users.reset_password': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'admin.work_teams.unassign_report': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'admin.work_teams.update_members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}