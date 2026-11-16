// src/renderer/state/session.js
// Session state store — stub user for Part 3 UI development.
// TODO(login-part): Replace stub session with real authentication IPC in Part 4.

import { createStore } from '../utils/store.js';
import { can as canPermission } from '../../shared/permissions.js';
import { ROLES, APP_NAME_AR } from '../../shared/constants.js';

export const sessionStore = createStore({
  user: {
    id: 1,
    name: APP_NAME_AR,
    role: ROLES.OWNER
  },
  authenticated: true
});

/**
 * Get current session user.
 * @returns {{ id: number, name: string, role: string } | null}
 */
export function currentUser() {
  return sessionStore.get().user;
}

/**
 * Check if current user has permission.
 * @param {string} permission
 * @returns {boolean}
 */
export function can(permission) {
  const user = currentUser();
  return canPermission(user, permission);
}

/**
 * Update session user.
 * @param {any} user
 */
export function setSessionUser(user) {
  sessionStore.set({
    user,
    authenticated: Boolean(user)
  });
}
