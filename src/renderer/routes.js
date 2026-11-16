// src/renderer/routes.js
// Route table definition mapped to views and shared permissions.

import { PERMISSIONS } from '../shared/permissions.js';

export const ROUTES = [
  {
    path: '/',
    page: 'home',
    titleKey: 'nav.home',
    icon: 'house'
  },
  {
    path: '/cashier',
    page: '_placeholder',
    titleKey: 'nav.cashier',
    icon: 'shopping-cart',
    permission: PERMISSIONS.ORDERS_CREATE
  },
  {
    path: '/kitchen',
    page: '_placeholder',
    titleKey: 'nav.kitchen',
    icon: 'chef-hat',
    permission: PERMISSIONS.KITCHEN_VIEW
  },
  {
    path: '/tables',
    page: '_placeholder',
    titleKey: 'nav.tables',
    icon: 'table-2',
    permission: PERMISSIONS.TABLES_MANAGE
  },
  {
    path: '/delivery',
    page: '_placeholder',
    titleKey: 'nav.delivery',
    icon: 'truck',
    permission: PERMISSIONS.DELIVERY_MANAGE
  },
  {
    path: '/menu',
    page: '_placeholder',
    titleKey: 'nav.menu',
    icon: 'book-open',
    permission: PERMISSIONS.PRODUCTS_VIEW
  },
  {
    path: '/inventory',
    page: '_placeholder',
    titleKey: 'nav.inventory',
    icon: 'box',
    permission: PERMISSIONS.INVENTORY_VIEW
  },
  {
    path: '/shifts',
    page: '_placeholder',
    titleKey: 'nav.shifts',
    icon: 'clock',
    permission: PERMISSIONS.SHIFTS_OPEN
  },
  {
    path: '/expenses',
    page: '_placeholder',
    titleKey: 'nav.expenses',
    icon: 'wallet',
    permission: PERMISSIONS.EXPENSES_VIEW
  },
  {
    path: '/reports',
    page: '_placeholder',
    titleKey: 'nav.reports',
    icon: 'chart-bar',
    permission: PERMISSIONS.REPORTS_VIEW
  },
  {
    path: '/settings',
    page: '_placeholder',
    titleKey: 'nav.settings',
    icon: 'settings',
    permission: PERMISSIONS.SETTINGS_VIEW
  },
  {
    path: '/users',
    page: '_placeholder',
    titleKey: 'nav.users',
    icon: 'users',
    permission: PERMISSIONS.USERS_MANAGE
  },
  {
    path: '/backup',
    page: '_placeholder',
    titleKey: 'nav.backup',
    icon: 'archive',
    permission: PERMISSIONS.BACKUP_MANAGE
  },
  {
    path: '/styleguide',
    page: 'styleguide',
    titleKey: 'styleguide.title',
    icon: 'sliders-horizontal',
    devOnly: true
  },
  {
    path: '/not-found',
    page: 'not-found',
    titleKey: 'notFound.title'
  },
  {
    path: '/forbidden',
    page: 'forbidden',
    titleKey: 'forbidden.title'
  }
];
