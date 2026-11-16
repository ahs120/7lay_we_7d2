// src/renderer/components/table.logic.js
// Pure table sorting, pagination, and page window algorithms.

/**
 * Sort rows by key and direction.
 * @template T
 * @param {T[]} rows
 * @param {string} [sortKey]
 * @param {'asc'|'desc'|'none'} [sortDir]
 * @param {(a: any, b: any) => number} [customSortFn]
 * @returns {T[]}
 */
export function sortRows(rows, sortKey, sortDir = 'none', customSortFn = null) {
  if (!sortKey || sortDir === 'none' || !Array.isArray(rows)) {
    return [...rows];
  }

  const copy = [...rows];

  if (customSortFn) {
    copy.sort((a, b) => {
      const res = customSortFn(a[sortKey], b[sortKey], a, b);
      return sortDir === 'desc' ? -res : res;
    });
    return copy;
  }

  copy.sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    let res = 0;
    if (typeof valA === 'number' && typeof valB === 'number') {
      res = valA - valB;
    } else {
      res = String(valA).localeCompare(String(valB), 'ar-EG');
    }

    return sortDir === 'desc' ? -res : res;
  });

  return copy;
}

/**
 * Return paginated slice of rows.
 * @template T
 * @param {T[]} rows
 * @param {number} page - 1-based page number
 * @param {number} pageSize - rows per page
 * @returns {T[]}
 */
export function paginate(rows, page = 1, pageSize = 10) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const p = Math.max(1, Math.floor(page));
  const ps = Math.max(1, Math.floor(pageSize));
  const start = (p - 1) * ps;
  return rows.slice(start, start + ps);
}

/**
 * Compute page window pagination array (e.g. [1, 2, 3, '...', 10]).
 * @param {number} currentPage - 1-based
 * @param {number} totalPages
 * @param {number} [maxVisible] - max number of buttons to display (excluding ellipses)
 * @returns {Array<number|'...'>}
 */
export function pageWindow(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= 1) return [1];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const current = Math.min(Math.max(1, currentPage), totalPages);
  const pages = [];

  // Always show first page
  pages.push(1);

  let left = Math.max(2, current - 1);
  let right = Math.min(totalPages - 1, current + 1);

  if (current <= 2) {
    right = 3;
  } else if (current >= totalPages - 1) {
    left = totalPages - 2;
  }

  if (left > 2) {
    pages.push('...');
  }

  for (let i = left; i <= right; i++) {
    pages.push(i);
  }

  if (right < totalPages - 1) {
    pages.push('...');
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}
