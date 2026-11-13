import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES } from '../../src/shared/constants.js';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  can,
  permissionsForRole
} from '../../src/shared/permissions.js';

test('permissions and roles integrity', () => {
  // can(null, ...) is false
  assert.equal(can(null, PERMISSIONS.ORDERS_CREATE), false);
  assert.equal(can(undefined, PERMISSIONS.ORDERS_CREATE), false);
  assert.equal(can({}, PERMISSIONS.ORDERS_CREATE), false);
  assert.equal(can({ role: 'unknown_role' }, PERMISSIONS.ORDERS_CREATE), false);

  // Owner has all permissions
  const ownerUser = { id: 1, role: ROLES.OWNER };
  for (const perm of Object.values(PERMISSIONS)) {
    assert.equal(can(ownerUser, perm), true, `Owner should have ${perm}`);
  }

  // Manager has all except users.manage, backup.manage, settings.edit; keeps settings.view
  const managerUser = { id: 2, role: ROLES.MANAGER };
  assert.equal(can(managerUser, PERMISSIONS.USERS_MANAGE), false);
  assert.equal(can(managerUser, PERMISSIONS.BACKUP_MANAGE), false);
  assert.equal(can(managerUser, PERMISSIONS.SETTINGS_EDIT), false);
  assert.equal(can(managerUser, PERMISSIONS.SETTINGS_VIEW), true);
  assert.equal(can(managerUser, PERMISSIONS.REPORTS_FINANCIAL), true);
  assert.equal(can(managerUser, PERMISSIONS.ORDERS_CREATE), true);

  // Cashier has specific subset
  const cashierUser = { id: 3, role: ROLES.CASHIER };
  assert.equal(can(cashierUser, PERMISSIONS.ORDERS_CREATE), true);
  assert.equal(can(cashierUser, PERMISSIONS.PAYMENTS_TAKE), true);
  assert.equal(can(cashierUser, PERMISSIONS.SHIFTS_OPEN), true);
  assert.equal(can(cashierUser, PERMISSIONS.CASH_MOVE), true);
  assert.equal(can(cashierUser, PERMISSIONS.EXPENSES_CREATE), true);
  assert.equal(can(cashierUser, PERMISSIONS.REPORTS_VIEW), false);
  assert.equal(can(cashierUser, PERMISSIONS.USERS_MANAGE), false);
  assert.equal(can(cashierUser, PERMISSIONS.TABLES_MANAGE), false);

  // Waiter has kitchen.view and orders.create/view/edit, products.view, customers.view
  const waiterUser = { id: 4, role: ROLES.WAITER };
  assert.equal(can(waiterUser, PERMISSIONS.ORDERS_CREATE), true);
  assert.equal(can(waiterUser, PERMISSIONS.ORDERS_VIEW), true);
  assert.equal(can(waiterUser, PERMISSIONS.ORDERS_EDIT), true);
  assert.equal(can(waiterUser, PERMISSIONS.PRODUCTS_VIEW), true);
  assert.equal(can(waiterUser, PERMISSIONS.CUSTOMERS_VIEW), true);
  assert.equal(can(waiterUser, PERMISSIONS.KITCHEN_VIEW), true);
  assert.equal(can(waiterUser, PERMISSIONS.TABLES_MANAGE), false);
  assert.equal(can(waiterUser, PERMISSIONS.PAYMENTS_TAKE), false);
  assert.equal(can(waiterUser, PERMISSIONS.REPORTS_VIEW), false);

  // permissionsForRole returns list
  assert.ok(permissionsForRole(ROLES.OWNER).length > 25);
  assert.deepEqual(permissionsForRole('nonexistent'), []);
});

