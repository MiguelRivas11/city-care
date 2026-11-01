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
  }
  admin: {
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
