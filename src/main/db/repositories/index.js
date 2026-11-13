// src/main/db/repositories/index.js
// Creates all repository instances from a single db connection.
// All repos use the factory pattern: createXRepo(db) so tests can inject any db.

import { createSystemRepo }        from './system.repo.js';
import { createSettingsRepo }      from './settings.repo.js';
import { createAuditRepo }         from './audit.repo.js';
import { createOrderCountersRepo } from './order-counters.repo.js';
import { createUsersRepo }         from './users.repo.js';
import { createCategoriesRepo }    from './categories.repo.js';
import { createItemsRepo }         from './items.repo.js';
import { createModifiersRepo }     from './modifiers.repo.js';
import { createDiningTablesRepo }  from './dining-tables.repo.js';
import { createCustomersRepo }     from './customers.repo.js';
import { createDeliveryRepo }      from './delivery.repo.js';
import { createShiftsRepo }        from './shifts.repo.js';
import { createOrdersRepo }        from './orders.repo.js';
import { createPaymentsRepo }      from './payments.repo.js';
import { createDiscountsRepo }     from './discounts.repo.js';
import { createCashMovementsRepo } from './cash-movements.repo.js';
import { createInventoryRepo }     from './inventory.repo.js';
import { createExpensesRepo }      from './expenses.repo.js';

/**
 * Create all repositories bound to a single database connection.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {Repos}
 */
export function createRepos(db) {
  const counters = createOrderCountersRepo(db);
  const orders   = createOrdersRepo(db, { counters });

  return {
    system:        createSystemRepo(db),
    settings:      createSettingsRepo(db),
    audit:         createAuditRepo(db),
    counters,
    users:         createUsersRepo(db),
    categories:    createCategoriesRepo(db),
    items:         createItemsRepo(db),
    modifiers:     createModifiersRepo(db),
    tables:        createDiningTablesRepo(db),
    customers:     createCustomersRepo(db),
    delivery:      createDeliveryRepo(db),
    shifts:        createShiftsRepo(db),
    orders,
    payments:      createPaymentsRepo(db),
    discounts:     createDiscountsRepo(db),
    cashMovements: createCashMovementsRepo(db),
    inventory:     createInventoryRepo(db),
    expenses:      createExpensesRepo(db)
  };
}

