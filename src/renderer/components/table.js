// src/renderer/components/table.js
// Accessible, responsive data table with sticky header, sorting, pagination, and skeleton loading.

import { h, clear } from '../utils/dom.js';
import { icon } from './icon.js';
import { button } from './button.js';
import { select } from './select.js';
import { skeleton } from './loading.js';
import { emptyState } from './empty-state.js';
import { sortRows, paginate, pageWindow } from './table.logic.js';
import { t } from '../i18n/t.js';

/**
 * @typedef {object} TableColumn
 * @property {string} key
 * @property {string} label
 * @property {boolean} [sortable]
 * @property {(val: any, row: any) => Node|string} [render]
 * @property {string} [width]
 * @property {'start'|'center'|'end'} [align]
 * @property {boolean} [num] - tabular numeric styling
 * @property {(a: any, b: any) => number} [sortFn]
 */

/**
 * @typedef {object} TableOpts
 * @property {TableColumn[]} columns
 * @property {any[]} [rows]
 * @property {number} [pageSize] - default 10
 * @property {number[]} [pageSizeOptions] - default [10, 25, 50]
 * @property {boolean} [selectable]
 * @property {(row: any) => void} [onRowClick]
 * @property {(selected: any[]) => void} [onSelectionChange]
 * @property {string} [emptyMessage]
 * @property {boolean} [loading]
 * @property {string} [className]
 */

export function table(opts = {}) {
  const {
    columns = [],
    rows: initialRows = [],
    pageSize: initialPageSize = 10,
    pageSizeOptions = [10, 25, 50],
    selectable = false,
    onRowClick = null,
    onSelectionChange = null,
    emptyMessage = t('table.empty'),
    loading: initialLoading = false,
    className = ''
  } = opts;

  let allRows = [...initialRows];
  let currentPage = 1;
  let pageSize = initialPageSize;
  let sortKey = null;
  let sortDir = 'none'; // 'none' | 'asc' | 'desc'
  let isLoading = initialLoading;
  const selectedRows = new Set();

  const wrapper = h('div', { class: `table-wrapper ${className}`.trim() });
  const tableEl = h('table', { class: 'data-table' });
  const thead = h('thead', { class: 'data-table__head' });
  const tbody = h('tbody', { class: 'data-table__body' });
  const tfoot = h('div', { class: 'table-pagination' });

  tableEl.appendChild(thead);
  tableEl.appendChild(tbody);
  wrapper.appendChild(tableEl);
  wrapper.appendChild(tfoot);

  // ── Render Head ─────────────────────────────────────────────────────────────
  function renderHead() {
    clear(thead);
    const tr = h('tr');

    if (selectable) {
      const thSelect = h('th', { class: 'data-table__th data-table__th--select' });
      const selectAllCheckbox = h('input', {
        type: 'checkbox',
        class: 'data-table__checkbox',
        'aria-label': t('common.all')
      });
      selectAllCheckbox.addEventListener('change', () => {
        if (selectAllCheckbox.checked) {
          allRows.forEach(r => selectedRows.add(r));
        } else {
          selectedRows.clear();
        }
        renderBody();
        if (onSelectionChange) onSelectionChange(Array.from(selectedRows));
      });
      thSelect.appendChild(selectAllCheckbox);
      tr.appendChild(thSelect);
    }

    columns.forEach(col => {
      const thClasses = ['data-table__th'];
      if (col.sortable) thClasses.push('data-table__th--sortable');
      if (col.align) thClasses.push(`data-table__cell--align-${col.align}`);

      const thProps = { class: thClasses.join(' ') };
      if (col.width) thProps.style = { 'inline-size': col.width };

      const th = h('th', thProps);
      const thContent = h('span', { class: 'data-table__th-content' }, col.label);
      th.appendChild(thContent);

      if (col.sortable) {
        let sortIconName = 'chevrons-up-down';
        if (sortKey === col.key) {
          if (sortDir === 'asc') sortIconName = 'chevron-up';
          else if (sortDir === 'desc') sortIconName = 'chevron-down';
        }
        const sortIcon = icon(sortIconName, { size: '1rem', className: 'data-table__sort-icon' });
        th.appendChild(sortIcon);

        th.setAttribute('tabindex', '0');
        th.setAttribute('role', 'columnheader');
        th.setAttribute('aria-sort', sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none');

        const toggleSort = () => {
          if (sortKey !== col.key) {
            sortKey = col.key;
            sortDir = 'asc';
          } else if (sortDir === 'asc') {
            sortDir = 'desc';
          } else {
            sortKey = null;
            sortDir = 'none';
          }
          currentPage = 1;
          renderHead();
          renderBody();
          renderPagination();
        };

        th.addEventListener('click', toggleSort);
        th.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSort();
          }
        });
      }

      tr.appendChild(th);
    });

    thead.appendChild(tr);
  }

  // ── Render Body ─────────────────────────────────────────────────────────────
  function renderBody() {
    clear(tbody);

    if (isLoading) {
      // 5 Skeleton rows
      for (let i = 0; i < 5; i++) {
        const tr = h('tr', { class: 'data-table__row' });
        if (selectable) {
          tr.appendChild(h('td', { class: 'data-table__td' }, skeleton({ width: '1.25rem', height: '1.25rem' })));
        }
        columns.forEach(col => {
          tr.appendChild(h('td', { class: 'data-table__td' }, skeleton({ width: col.width || '80%', height: '1.25rem' })));
        });
        tbody.appendChild(tr);
      }
      return;
    }

    const sorted = sortRows(allRows, sortKey, sortDir, columns.find(c => c.key === sortKey)?.sortFn);
    const paginated = paginate(sorted, currentPage, pageSize);

    if (paginated.length === 0) {
      const colSpan = columns.length + (selectable ? 1 : 0);
      const emptyRow = h('tr', { class: 'data-table__row--empty' });
      const emptyTd = h('td', { colspan: String(colSpan), class: 'data-table__td--empty' });
      emptyTd.appendChild(emptyState({ title: emptyMessage, icon: 'inbox' }));
      emptyRow.appendChild(emptyTd);
      tbody.appendChild(emptyRow);
      return;
    }

    paginated.forEach((row, rowIdx) => {
      const isSelected = selectedRows.has(row);
      const trClasses = ['data-table__row'];
      if (isSelected) trClasses.push('data-table__row--selected');
      if (onRowClick) trClasses.push('data-table__row--clickable');

      const tr = h('tr', { class: trClasses.join(' ') });

      if (selectable) {
        const tdSelect = h('td', { class: 'data-table__td data-table__td--select' });
        const cb = h('input', {
          type: 'checkbox',
          class: 'data-table__checkbox',
          checked: isSelected
        });
        cb.addEventListener('click', (e) => e.stopPropagation());
        cb.addEventListener('change', () => {
          if (cb.checked) selectedRows.add(row);
          else selectedRows.delete(row);
          tr.classList.toggle('data-table__row--selected', cb.checked);
          if (onSelectionChange) onSelectionChange(Array.from(selectedRows));
        });
        tdSelect.appendChild(cb);
        tr.appendChild(tdSelect);
      }

      columns.forEach(col => {
        const tdClasses = ['data-table__td'];
        if (col.align) tdClasses.push(`data-table__cell--align-${col.align}`);
        if (col.num) tdClasses.push('num');

        const val = row[col.key];
        const td = h('td', { class: tdClasses.join(' ') });

        if (typeof col.render === 'function') {
          const rendered = col.render(val, row);
          if (rendered instanceof Node) {
            td.appendChild(rendered);
          } else if (rendered !== null && rendered !== undefined) {
            td.appendChild(document.createTextNode(String(rendered)));
          }
        } else {
          td.appendChild(document.createTextNode(val !== null && val !== undefined ? String(val) : ''));
        }

        tr.appendChild(td);
      });

      if (onRowClick) {
        tr.addEventListener('click', () => onRowClick(row));
      }

      tbody.appendChild(tr);
    });
  }

  // ── Render Pagination ───────────────────────────────────────────────────────
  let sizeSelectComponent = null;

  function renderPagination() {
    clear(tfoot);
    if (sizeSelectComponent) {
      sizeSelectComponent.destroy();
      sizeSelectComponent = null;
    }

    const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));

    // Summary info
    const startIdx = allRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(allRows.length, currentPage * pageSize);
    const infoText = `${startIdx}-${endIdx} ${t('table.of')} ${allRows.length} ${t('table.rows')}`;
    const infoSpan = h('span', { class: 'table-pagination__info num' }, infoText);
    tfoot.appendChild(infoSpan);

    // Page navigation
    const navWrap = h('div', { class: 'table-pagination__nav' });

    // Prev button
    const prevBtn = button({
      icon: 'chevron-right', // flipped in RTL!
      variant: 'ghost',
      size: 'sm',
      disabled: currentPage <= 1,
      ariaLabel: t('table.prev'),
      onClick: () => {
        if (currentPage > 1) {
          currentPage--;
          renderBody();
          renderPagination();
        }
      }
    });
    navWrap.appendChild(prevBtn.el);

    // Page window buttons
    const windowPages = pageWindow(currentPage, totalPages);
    windowPages.forEach(p => {
      if (p === '...') {
        navWrap.appendChild(h('span', { class: 'table-pagination__ellipsis' }, '...'));
      } else {
        const isCurrent = p === currentPage;
        const pageBtn = button({
          text: String(p),
          variant: isCurrent ? 'primary' : 'ghost',
          size: 'sm',
          className: isCurrent ? 'table-pagination__page--active num' : 'num',
          onClick: () => {
            if (currentPage !== p) {
              currentPage = p;
              renderBody();
              renderPagination();
            }
          }
        });
        navWrap.appendChild(pageBtn.el);
      }
    });

    // Next button
    const nextBtn = button({
      icon: 'chevron-left', // flipped in RTL!
      variant: 'ghost',
      size: 'sm',
      disabled: currentPage >= totalPages,
      ariaLabel: t('table.next'),
      onClick: () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderBody();
          renderPagination();
        }
      }
    });
    navWrap.appendChild(nextBtn.el);
    tfoot.appendChild(navWrap);

    // Page size selector
    const sizeWrap = h('div', { class: 'table-pagination__size' });
    sizeWrap.appendChild(h('span', { class: 'table-pagination__size-label' }, t('table.rowsPerPage')));

    sizeSelectComponent = select({
      value: pageSize,
      options: pageSizeOptions.map(s => ({ value: s, label: String(s) })),
      onChange: (val) => {
        pageSize = Number(val);
        currentPage = 1;
        renderBody();
        renderPagination();
      }
    });
    sizeWrap.appendChild(sizeSelectComponent.el);
    tfoot.appendChild(sizeWrap);
  }

  // Initial render
  renderHead();
  renderBody();
  renderPagination();

  return {
    el: wrapper,
    setRows(newRows) {
      allRows = Array.isArray(newRows) ? [...newRows] : [];
      currentPage = 1;
      selectedRows.clear();
      renderBody();
      renderPagination();
    },
    setLoading(bool) {
      isLoading = Boolean(bool);
      renderBody();
    },
    getSelected() {
      return Array.from(selectedRows);
    },
    destroy() {
      if (sizeSelectComponent) sizeSelectComponent.destroy();
    }
  };
}
