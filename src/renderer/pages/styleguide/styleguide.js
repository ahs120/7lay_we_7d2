// src/renderer/pages/styleguide/styleguide.js
// Styleguide page interactive demo and automated diagnostics suite.

import { h, qs, clear } from '../../utils/dom.js';
import { icon } from '../../components/icon.js';
import { button } from '../../components/button.js';
import { input } from '../../components/input.js';
import { select } from '../../components/select.js';
import { numpad } from '../../components/numpad.js';
import { numpadDialog } from '../../components/numpad-dialog.js';
import { badge } from '../../components/badge.js';
import { card } from '../../components/card.js';
import { modal } from '../../components/modal.js';
import { confirm } from '../../components/confirm.js';
import { toast } from '../../components/toast.js';
import { table } from '../../components/table.js';
import { tabs } from '../../components/tabs.js';
import { formatMoney } from '../../utils/format.js';
import { CONTRACT_COLORS, SAMPLE_PRODUCTS, SAMPLE_CATEGORIES, SG_TEXT } from './sample-data.js';

export async function init(container, ctx) {
  // ── 1. Colors ───────────────────────────────────────────────────────────────
  const colorsList = qs('#sg-colors-list', container);
  if (colorsList) {
    CONTRACT_COLORS.forEach(c => {
      const swatchBox = h('div', { class: 'sg-color-card card' },
        h('div', {
          class: 'sg-color-swatch',
          style: { 'background-color': `var(${c.name})` }
        }),
        h('div', { class: 'sg-color-meta stack' },
          h('span', { class: 'sg-color-name num ltr' }, c.name),
          h('span', { class: 'sg-color-hex num ltr' }, c.value),
          h('span', { class: 'sg-color-desc' }, c.desc)
        )
      );
      colorsList.appendChild(swatchBox);
    });
  }

  // ── 2. Typography ───────────────────────────────────────────────────────────
  const typoWrap = qs('#sg-typography-showcase', container);
  if (typoWrap) {
    typoWrap.appendChild(h('div', { class: 'sg-typo-item' },
      h('span', { class: 'sg-typo-label' }, 'Font Display (Aref Ruqaa 700)'),
      h('h1', { style: { 'font-family': 'var(--font-display)', 'color': 'var(--primary)', 'font-size': 'var(--text-3xl)' } }, SG_TEXT.brand_slogan)
    ));

    const scales = [
      { tag: 'h1', size: 'var(--text-3xl)', label: 'Heading 1 (30px)' },
      { tag: 'h2', size: 'var(--text-2xl)', label: 'Heading 2 (24px)' },
      { tag: 'h3', size: 'var(--text-xl)', label: 'Heading 3 (20px)' },
      { tag: 'h4', size: 'var(--text-lg)', label: 'Heading 4 (18px)' },
      { tag: 'p', size: 'var(--text-base)', label: 'Body Base (16px)' },
      { tag: 'small', size: 'var(--text-sm)', label: 'Caption Small (14px)' }
    ];

    scales.forEach(s => {
      const row = h('div', { class: 'sg-typo-item' },
        h('span', { class: 'sg-typo-label' }, s.label),
        h(s.tag, { style: { 'font-size': s.size } }, SG_TEXT.cairo_sample)
      );
      typoWrap.appendChild(row);
    });
  }

  // ── 3. Spacing & Radius ─────────────────────────────────────────────────────
  const spacingWrap = qs('#sg-spacing-showcase', container);
  if (spacingWrap) {
    const spaceLevels = [1, 2, 3, 4, 6, 8, 12];
    const spaceRow = h('div', { class: 'row', style: { 'gap': 'var(--space-2)', 'flex-wrap': 'wrap' } });
    spaceLevels.forEach(lvl => {
      const box = h('div', {
        class: 'sg-space-box',
        style: { 'inline-size': `var(--space-${lvl})`, 'block-size': '2rem', 'background-color': 'var(--gold)' },
        title: `--space-${lvl}`
      });
      spaceRow.appendChild(box);
    });
    spacingWrap.appendChild(spaceRow);
  }

  // ── 4. Icons ────────────────────────────────────────────────────────────────
  const iconsWrap = qs('#sg-icons-showcase', container);
  if (iconsWrap) {
    const sampleIcons = [
      'shopping-cart', 'table-2', 'chef-hat', 'book-open', 'box', 'truck',
      'wallet', 'clock', 'chart-bar', 'settings', 'users', 'archive',
      'check', 'x', 'triangle-exclamation-point', 'info', 'printer', 'lock',
      'user', 'coffee', 'calendar', 'mail', 'map-pin', 'search'
    ];
    sampleIcons.forEach(name => {
      const item = h('div', { class: 'sg-icon-item stack' },
        icon(name, { size: '1.75rem', className: 'sg-icon-preview' }),
        h('span', { class: 'sg-icon-name num ltr' }, name)
      );
      iconsWrap.appendChild(item);
    });
  }

  // ── 5. Buttons ──────────────────────────────────────────────────────────────
  const btnsWrap = qs('#sg-buttons-showcase', container);
  if (btnsWrap) {
    const variants = ['primary', 'secondary', 'ghost', 'danger', 'gold', 'outline'];
    const rowVariants = h('div', { class: 'row', style: { 'gap': 'var(--space-3)', 'flex-wrap': 'wrap' } });

    variants.forEach(v => {
      const b = button({
        text: v,
        variant: v,
        onClick: () => toast.info(`${SG_TEXT.btn_pressed} ${v}`)
      });
      rowVariants.appendChild(b.el);
    });
    btnsWrap.appendChild(rowVariants);

    // States & Sizes
    const rowStates = h('div', { class: 'row', style: { 'gap': 'var(--space-3)', 'flex-wrap': 'wrap', 'margin-block-start': 'var(--space-3)' } });
    const bLoading = button({ text: SG_TEXT.btn_loading, variant: 'primary' });
    bLoading.setLoading(true);
    rowStates.appendChild(bLoading.el);

    const bDisabled = button({ text: SG_TEXT.btn_disabled, variant: 'secondary', disabled: true });
    rowStates.appendChild(bDisabled.el);

    const bBadge = button({ text: SG_TEXT.btn_badge, icon: 'bell', badge: 3, variant: 'secondary' });
    rowStates.appendChild(bBadge.el);

    const bIconOnly = button({ icon: 'settings', variant: 'ghost', ariaLabel: 'settings' });
    rowStates.appendChild(bIconOnly.el);

    btnsWrap.appendChild(rowStates);
  }

  // ── 6. Form Inputs ──────────────────────────────────────────────────────────
  const inputsWrap = qs('#sg-inputs-showcase', container);
  if (inputsWrap) {
    const inp1 = input({ label: SG_TEXT.inp_cust_label, placeholder: SG_TEXT.inp_cust_ph, icon: 'user' });
    const inp2 = input({ label: SG_TEXT.inp_phone_label, placeholder: '010XXXXXXXX', dir: 'ltr', prefix: '+20' });
    const inp3 = input({ label: SG_TEXT.inp_email_label, value: 'invalid-email', error: SG_TEXT.inp_email_err });

    inputsWrap.appendChild(inp1.el);
    inputsWrap.appendChild(inp2.el);
    inputsWrap.appendChild(inp3.el);
  }

  // ── 7. Select ───────────────────────────────────────────────────────────────
  const selectWrap = qs('#sg-select-showcase', container);
  if (selectWrap) {
    const sel = select({
      label: SG_TEXT.sel_category_label,
      options: SAMPLE_CATEGORIES,
      value: 'all',
      onChange: (val) => toast.info(`${SG_TEXT.sel_category_chosen}: ${val}`)
    });
    selectWrap.appendChild(sel.el);
  }

  // ── 8. Numpad ───────────────────────────────────────────────────────────────
  const numpadWrap = qs('#sg-numpad-showcase', container);
  if (numpadWrap) {
    const pad = numpad({
      label: SG_TEXT.num_input_label,
      mode: 'decimal',
      initialValue: '15.5',
      showActions: true,
      onConfirm: (val) => toast.success(`${SG_TEXT.num_confirmed}: ${val}`),
      onCancel: () => toast.warning(SG_TEXT.num_cancelled)
    });
    numpadWrap.appendChild(pad.el);
  }

  // ── 9. Badges & Cards ───────────────────────────────────────────────────────
  const badgesWrap = qs('#sg-badges-showcase', container);
  if (badgesWrap) {
    const bRow = h('div', { class: 'row', style: { 'gap': 'var(--space-2)', 'flex-wrap': 'wrap' } },
      badge({ text: SG_TEXT.badge_neutral, variant: 'neutral' }),
      badge({ text: SG_TEXT.badge_active, variant: 'success', icon: 'circle-check' }),
      badge({ text: SG_TEXT.badge_cancelled, variant: 'danger', icon: 'ban' }),
      badge({ text: SG_TEXT.badge_pending, variant: 'warning', icon: 'clock' }),
      badge({ text: SG_TEXT.badge_primary, variant: 'primary' }),
      badge({ text: SG_TEXT.badge_featured, variant: 'gold', icon: 'star' })
    );
    badgesWrap.appendChild(bRow);
  }

  // ── 10. Toasts ──────────────────────────────────────────────────────────────
  const toastsWrap = qs('#sg-toasts-showcase', container);
  if (toastsWrap) {
    const tRow = h('div', { class: 'row', style: { 'gap': 'var(--space-3)', 'flex-wrap': 'wrap' } },
      button({ text: SG_TEXT.toast_success_btn, variant: 'secondary', onClick: () => toast.success(SG_TEXT.toast_success_msg) }).el,
      button({ text: SG_TEXT.toast_error_btn, variant: 'secondary', onClick: () => toast.error(SG_TEXT.toast_error_msg) }).el,
      button({ text: SG_TEXT.toast_warn_btn, variant: 'secondary', onClick: () => toast.warning(SG_TEXT.toast_warn_msg) }).el,
      button({ text: SG_TEXT.toast_info_btn, variant: 'secondary', onClick: () => toast.info(SG_TEXT.toast_info_msg) }).el
    );
    toastsWrap.appendChild(tRow);
  }

  // ── 11. Modals & Dialogs ────────────────────────────────────────────────────
  const modalsWrap = qs('#sg-modals-showcase', container);
  if (modalsWrap) {
    const mRow = h('div', { class: 'row', style: { 'gap': 'var(--space-3)', 'flex-wrap': 'wrap' } });

    // Simple modal
    const openModalBtn = button({
      text: SG_TEXT.modal_open_btn,
      variant: 'secondary',
      onClick: () => {
        const m = modal({
          title: SG_TEXT.modal_test_title,
          content: h('p', {}, SG_TEXT.modal_test_body),
          footer: [
            button({ text: 'OK', variant: 'primary', onClick: () => m.close() }).el
          ]
        });
        m.open();
      }
    });
    mRow.appendChild(openModalBtn.el);

    // Confirm dialog
    const confirmBtn = button({
      text: SG_TEXT.confirm_btn_text,
      variant: 'secondary',
      onClick: async () => {
        const ok = await confirm({
          title: SG_TEXT.confirm_title,
          message: SG_TEXT.confirm_msg
        });
        toast.info(ok ? SG_TEXT.confirm_ok_toast : SG_TEXT.confirm_cancel_toast);
      }
    });
    mRow.appendChild(confirmBtn.el);

    // Danger confirm dialog
    const dangerConfirmBtn = button({
      text: SG_TEXT.danger_btn_text,
      variant: 'danger',
      onClick: async () => {
        const ok = await confirm({
          title: SG_TEXT.danger_title,
          message: SG_TEXT.danger_msg,
          danger: true,
          confirmText: SG_TEXT.danger_confirm_text
        });
        toast.info(ok ? SG_TEXT.danger_deleted_toast : SG_TEXT.confirm_cancel_toast);
      }
    });
    mRow.appendChild(dangerConfirmBtn.el);

    // Numpad dialog
    const numDialogBtn = button({
      text: SG_TEXT.numpad_dialog_btn,
      variant: 'gold',
      onClick: async () => {
        const val = await numpadDialog({
          title: SG_TEXT.numpad_dialog_title,
          mode: 'decimal',
          initialValue: '50.00'
        });
        if (val !== null) toast.success(`${SG_TEXT.price_chosen_toast}: ${val}`);
        else toast.warning(SG_TEXT.price_cancel_toast);
      }
    });
    mRow.appendChild(numDialogBtn.el);

    modalsWrap.appendChild(mRow);
  }

  // ── 12. Tables ──────────────────────────────────────────────────────────────
  const tablesWrap = qs('#sg-tables-showcase', container);
  if (tablesWrap) {
    const tableInstance = table({
      columns: [
        { key: 'id', label: SG_TEXT.col_id, width: '4rem', num: true, sortable: true },
        { key: 'name', label: SG_TEXT.col_name, sortable: true },
        { key: 'category', label: SG_TEXT.col_cat, sortable: true },
        {
          key: 'price',
          label: SG_TEXT.col_price,
          sortable: true,
          num: true,
          render: (val) => formatMoney(val)
        },
        { key: 'stock', label: SG_TEXT.col_stock, num: true, sortable: true },
        {
          key: 'status',
          label: SG_TEXT.col_status,
          render: (val) => badge({ text: val, variant: val === SG_TEXT.badge_active ? 'success' : 'neutral', size: 'sm' })
        }
      ],
      rows: SAMPLE_PRODUCTS,
      pageSize: 5,
      pageSizeOptions: [5, 10],
      selectable: true,
      onRowClick: (row) => toast.info(`${SG_TEXT.item_clicked}: ${row.name}`)
    });
    tablesWrap.appendChild(tableInstance.el);
  }

  // ── 13. Tabs ────────────────────────────────────────────────────────────────
  const tabsWrap = qs('#sg-tabs-showcase', container);
  if (tabsWrap) {
    const tabsInstance = tabs({
      items: [
        { id: 'tab1', label: SG_TEXT.tab1_title, badge: 5, content: SG_TEXT.tab1_body },
        { id: 'tab2', label: SG_TEXT.tab2_title, content: SG_TEXT.tab2_body },
        { id: 'tab3', label: SG_TEXT.tab3_title, badge: 1, content: SG_TEXT.tab3_body }
      ]
    });
    tabsWrap.appendChild(tabsInstance.el);
  }

  // ── 14. Self-Diagnostics Panel ──────────────────────────────────────────────
  const diagWrap = qs('#sg-diagnostics-showcase', container);
  if (diagWrap) {
    runDiagnostics(diagWrap, container);
  }

  return {
    destroy() {}
  };
}

function runDiagnostics(diagWrap, container) {
  clear(diagWrap);
  const dl = h('dl', { class: 'sg-diag-grid' });

  function addCheck(name, pass, detail = '') {
    dl.appendChild(h('dt', {}, name));
    const mark = pass
      ? badge({ text: 'PASS', variant: 'success', icon: 'check' })
      : badge({ text: 'FAIL', variant: 'danger', icon: 'x' });
    dl.appendChild(h('dd', { class: 'row', style: { 'gap': 'var(--space-2)' } }, mark, h('span', { class: 'num ltr' }, detail)));
  }

  // 1. Context Isolation
  const isoPass = typeof window.require === 'undefined' && typeof window.api !== 'undefined';
  addCheck(SG_TEXT.diag_iso_title, isoPass, isoPass ? 'window.require is undefined' : 'LEAK');

  // 2. Offline / No External URLs
  const resources = window.performance?.getEntriesByType('resource') || [];
  const externalUrls = resources.filter(r => r.name.startsWith('http:') || r.name.startsWith('https:'));
  const offlinePass = externalUrls.length === 0;
  addCheck(SG_TEXT.diag_offline_title, offlinePass, `${externalUrls.length} external calls`);

  // 3. Fonts Cairo & Aref Ruqaa
  const fontCairo = document.fonts ? document.fonts.check('16px Cairo') : true;
  const fontAref = document.fonts ? document.fonts.check('16px "Aref Ruqaa"') : true;
  addCheck(SG_TEXT.diag_fonts_title, fontCairo && fontAref, `Cairo: ${fontCairo ? 'OK' : 'FAIL'}, Ruqaa: ${fontAref ? 'OK' : 'FAIL'}`);

  // 4. Viewport Dimensions
  const vpPass = window.innerWidth >= 1280 && window.innerHeight >= 720;
  addCheck(SG_TEXT.diag_viewport_title, vpPass, `${window.innerWidth}x${window.innerHeight}px`);

  // 5. Interactive Targets Hit Size (>= 48px)
  const buttons = Array.from(container.querySelectorAll('button:not([hidden])'));
  let smallCount = 0;
  buttons.forEach(b => {
    const rect = b.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
      smallCount++;
    }
  });
  const touchPass = smallCount === 0;
  addCheck(SG_TEXT.diag_touch_title, touchPass, `${smallCount} small targets`);

  diagWrap.appendChild(dl);
}
