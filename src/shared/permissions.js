import { ROLES } from './constants.js';

export const PERMISSIONS = Object.freeze({
  ORDERS_CREATE: 'orders.create',
  ORDERS_VIEW: 'orders.view',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_DISCOUNT: 'orders.discount',
  ORDERS_VOID: 'orders.void',
  ORDERS_REFUND: 'orders.refund',
  PAYMENTS_TAKE: 'payments.take',
  SHIFTS_OPEN: 'shifts.open',
  SHIFTS_CLOSE: 'shifts.close',
  SHIFTS_VIEW_ALL: 'shifts.viewAll',
  CASH_MOVE: 'cash.move',
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_EDIT: 'products.edit',
  CATEGORIES_EDIT: 'categories.edit',
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_EDIT: 'customers.edit',
  TABLES_MANAGE: 'tables.manage',
  DELIVERY_MANAGE: 'delivery.manage',
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  SUPPLIERS_MANAGE: 'suppliers.manage',
  PURCHASES_MANAGE: 'purchases.manage',
  REPORTS_VIEW: 'reports.view',
  REPORTS_FINANCIAL: 'reports.financial',
  USERS_MANAGE: 'users.manage',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  AUDIT_VIEW: 'audit.view',
  BACKUP_MANAGE: 'backup.manage',
  KITCHEN_VIEW: 'kitchen.view',
  KITCHEN_UPDATE: 'kitchen.update'
});

const ALL_PERMISSIONS = Object.freeze(Object.values(PERMISSIONS));

const MANAGER_EXCLUDED = new Set([
  PERMISSIONS.USERS_MANAGE,
  PERMISSIONS.BACKUP_MANAGE,
  PERMISSIONS.SETTINGS_EDIT
]);

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.OWNER]: ALL_PERMISSIONS,
  [ROLES.MANAGER]: Object.freeze(ALL_PERMISSIONS.filter(p => !MANAGER_EXCLUDED.has(p))),
  [ROLES.CASHIER]: Object.freeze([
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.PAYMENTS_TAKE,
    PERMISSIONS.SHIFTS_OPEN,
    PERMISSIONS.SHIFTS_CLOSE,
    PERMISSIONS.CASH_MOVE,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.KITCHEN_VIEW,
    PERMISSIONS.EXPENSES_CREATE
  ]),
  [ROLES.WAITER]: Object.freeze([
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.KITCHEN_VIEW
  ])
});

export function can(user, permission) {
  if (!user || typeof user !== 'object' || !user.role) {
    return false;
  }
  const perms = ROLE_PERMISSIONS[user.role];
  if (!perms) {
    return false;
  }
  return perms.includes(permission);
}

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ? [...ROLE_PERMISSIONS[role]] : [];
}

