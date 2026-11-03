/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'reports.store': {
    methods: ["POST"]
    pattern: '/api/v1/reports'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/report').createReportValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/report').createReportValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reports_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reports_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'report_categories.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/report-categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/report_categories_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/report_categories_controller').default['index']>>>
    }
  }
  'reports.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/report').listReportsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['mine']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['mine']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'reports.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/reports/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['showMine']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['showMine']>>>
    }
  }
  'admin.report_queries.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/report').listReportsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.report_queries.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/reports/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['show']>>>
    }
  }
  'admin.report_queries.possible_duplicates': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/reports/:id/possible-duplicates'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['possibleDuplicates']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['possibleDuplicates']>>>
    }
  }
  'admin.report_queries.review_possible_duplicate': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/reports/:id/possible-duplicates/:reviewId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/report').reviewReportDuplicateValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; reviewId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/report').reviewReportDuplicateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['reviewPossibleDuplicate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['reviewPossibleDuplicate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.report_queries.update_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/reports/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/report').updateReportStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/report').updateReportStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/report_queries_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.work_teams.assign_report': {
    methods: ["POST"]
    pattern: '/api/v1/admin/reports/:id/assignments'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/work_team').assignReportValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/work_team').assignReportValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['assignReport']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['assignReport']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.work_teams.assignment_history': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/reports/:id/assignments'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['assignmentHistory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['assignmentHistory']>>>
    }
  }
  'admin.work_teams.unassign_report': {
    methods: ["DELETE"]
    pattern: '/api/v1/admin/reports/:id/assignment'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/work_team').unassignReportValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/work_team').unassignReportValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['unassignReport']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['unassignReport']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.work_teams.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/teams'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/work_team').listWorkTeamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.work_teams.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/teams'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/work_team').createWorkTeamValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/work_team').createWorkTeamValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.work_teams.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/teams/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['show']>>>
    }
  }
  'admin.work_teams.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/teams/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/work_team').updateWorkTeamValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/work_team').updateWorkTeamValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.work_teams.update_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/teams/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/work_team').updateWorkTeamStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/work_team').updateWorkTeamStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.work_teams.update_members': {
    methods: ["PUT"]
    pattern: '/api/v1/admin/teams/:id/members'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/work_team').updateWorkTeamMembersValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/work_team').updateWorkTeamMembersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['updateMembers']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/work_teams_controller').default['updateMembers']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.dependencies.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/dependencies'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/dependency').listDependenciesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.dependencies.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/dependencies'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/dependency').createDependencyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/dependency').createDependencyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.dependencies.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/dependencies/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['show']>>>
    }
  }
  'admin.dependencies.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/dependencies/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/dependency').updateDependencyValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/dependency').updateDependencyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.dependencies.update_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/dependencies/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/dependency').updateDependencyStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/dependency').updateDependencyStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.dependencies.update_managers': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/dependencies/:id/managers'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/dependency').updateDependencyManagersValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/dependency').updateDependencyManagersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['updateManagers']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dependencies_controller').default['updateManagers']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.roles.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['index']>>>
    }
  }
  'admin.admin_users.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/user').listUsersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.new_account.store': {
    methods: ["POST"]
    pattern: '/api/v1/admin/users'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').createUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').createUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_users.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/admin/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['show']>>>
    }
  }
  'admin.admin_users.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/users/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_users.update_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/users/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateUserStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateUserStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.admin_users.reset_password': {
    methods: ["PATCH"]
    pattern: '/api/v1/admin/users/:id/password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').resetUserPasswordValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user').resetUserPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['resetPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin_users_controller').default['resetPassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
