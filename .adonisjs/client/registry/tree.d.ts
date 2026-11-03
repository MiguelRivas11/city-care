/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  reports: {
    store: typeof routes['reports.store']
    index: typeof routes['reports.index']
    show: typeof routes['reports.show']
  }
  reportCategories: {
    index: typeof routes['report_categories.index']
  }
  admin: {
    reportQueries: {
      index: typeof routes['admin.report_queries.index']
      show: typeof routes['admin.report_queries.show']
      possibleDuplicates: typeof routes['admin.report_queries.possible_duplicates']
      reviewPossibleDuplicate: typeof routes['admin.report_queries.review_possible_duplicate']
      updateStatus: typeof routes['admin.report_queries.update_status']
    }
    workTeams: {
      assignReport: typeof routes['admin.work_teams.assign_report']
      assignmentHistory: typeof routes['admin.work_teams.assignment_history']
      unassignReport: typeof routes['admin.work_teams.unassign_report']
      index: typeof routes['admin.work_teams.index']
      store: typeof routes['admin.work_teams.store']
      show: typeof routes['admin.work_teams.show']
      update: typeof routes['admin.work_teams.update']
      updateStatus: typeof routes['admin.work_teams.update_status']
      updateMembers: typeof routes['admin.work_teams.update_members']
    }
    dependencies: {
      index: typeof routes['admin.dependencies.index']
      store: typeof routes['admin.dependencies.store']
      show: typeof routes['admin.dependencies.show']
      update: typeof routes['admin.dependencies.update']
      updateStatus: typeof routes['admin.dependencies.update_status']
      updateManagers: typeof routes['admin.dependencies.update_managers']
    }
    roles: {
      index: typeof routes['admin.roles.index']
    }
    adminUsers: {
      index: typeof routes['admin.admin_users.index']
      show: typeof routes['admin.admin_users.show']
      update: typeof routes['admin.admin_users.update']
      updateStatus: typeof routes['admin.admin_users.update_status']
      resetPassword: typeof routes['admin.admin_users.reset_password']
    }
    newAccount: {
      store: typeof routes['admin.new_account.store']
    }
  }
}
