// src/main/db/seed/index.js
// Idempotent seed runner.
// Checks for settings['system.seeded_at'] — if already set, skips.
// Pass --force to re-add demo data even if main seed has run.

import { DEFAULT_SETTINGS } from './settings.js';
import {
  DEMO_CATEGORIES, DEMO_ITEMS, DEMO_SIZES,
  DEMO_MODIFIER_GROUPS, DEMO_TABLES
} from './menu.demo.js';
import { nowUtc } from '../repositories/_base.js';
import { createRepos } from '../repositories/index.js';

function _seedSettings(repos) {
  repos.settings.setMany(DEFAULT_SETTINGS);
}

function _seedDemo(repos) {
  // Seed categories
  const catMap = {}; // name_ar → id
  for (const cat of DEMO_CATEGORIES) {
    const created = repos.categories.create({ ...cat, is_demo: 1 });
    catMap[cat.name_ar] = created.id;
  }

  // Seed modifier groups first (collect name → id)
  const groupMap = {}; // name_ar → group object
  for (const grp of DEMO_MODIFIER_GROUPS) {
    const created = repos.modifiers.createGroup({
      name_ar: grp.name_ar,
      min_select: grp.min_select,
      max_select: grp.max_select,
      is_required: grp.is_required
    });
    groupMap[grp.name_ar] = created;
    for (const opt of grp.options) {
      repos.modifiers.addOption(created.id, opt);
    }
  }

  // Build itemName → modifierGroupNames map
  const itemModMap = {}; // item name_ar → [group name_ar]
  for (const grp of DEMO_MODIFIER_GROUPS) {
    for (const itemName of grp.items) {
      if (!itemModMap[itemName]) itemModMap[itemName] = [];
      itemModMap[itemName].push(grp.name_ar);
    }
  }

  // Seed items
  for (const [catName, items] of Object.entries(DEMO_ITEMS)) {
    const catId = catMap[catName];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const created = repos.items.create({
        category_id: catId,
        sort_order: i,
        is_demo: 1,
        ...item
      });

      // Sizes
      const sizes = DEMO_SIZES[item.name_ar];
      if (sizes) {
        for (const size of sizes) {
          repos.items.addSize(created.id, size);
        }
      }

      // Modifiers
      const mods = itemModMap[item.name_ar] ?? [];
      for (let j = 0; j < mods.length; j++) {
        const grp = groupMap[mods[j]];
        if (grp) repos.modifiers.linkGroupToItem(created.id, grp.id, j);
      }
    }
  }

  // Seed dining tables
  for (const tbl of DEMO_TABLES) {
    repos.tables.create({ ...tbl, is_demo: 1 });
  }
}

/**
 * Idempotent seed.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {object} [opts]
 * @param {boolean} [opts.force=false]
 * @param {object} [opts.repos]
 * @returns {{ seeded: boolean, demo: boolean }}
 */
export function runSeed(db, { force = false, repos = null } = {}) {
  const r = repos || createRepos(db);
  const already = r.settings.get('system.seeded_at');

  if (!already) {
    db.transaction(() => {
      _seedSettings(r);
      _seedDemo(r);
      r.settings.set('system.seeded_at', nowUtc());
    })();
    return { seeded: true, demo: true };
  }

  if (force) {
    db.transaction(() => {
      _seedDemo(r);
      r.settings.set('system.demo_seeded_at', nowUtc());
    })();
    return { seeded: false, demo: true };
  }

  return { seeded: false, demo: false };
}

export const runSeedWithRepos = (db, repos, opts = {}) => runSeed(db, { ...opts, repos });
