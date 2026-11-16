// src/renderer/components/select.js
// Custom accessible Select/Combobox component rendering its menu in #overlay-root.

import { h, uid, clear } from '../utils/dom.js';
import { getOverlayRoot } from '../utils/overlay.js';
import { icon } from './icon.js';
import { t } from '../i18n/t.js';

/**
 * @typedef {object} SelectOption
 * @property {string|number} value
 * @property {string} label
 * @property {string} [icon]
 */

/**
 * @typedef {object} SelectOpts
 * @property {string} [label]
 * @property {SelectOption[]} [options]
 * @property {string|number|null} [value]
 * @property {(val: any, option: SelectOption) => void} [onChange]
 * @property {string} [placeholder]
 * @property {boolean} [disabled]
 * @property {string} [className]
 */

export function select(opts = {}) {
  const {
    label = '',
    options: initialOptions = [],
    value: initialValue = null,
    onChange = null,
    placeholder = t('placeholder.select_option'),
    disabled = false,
    className = ''
  } = opts;

  let currentOptions = [...initialOptions];
  let currentValue = initialValue;
  let isOpen = false;
  let focusedIndex = -1;

  const id = uid('select');
  const triggerId = `${id}-trigger`;
  const listboxId = `${id}-listbox`;

  const wrapperClasses = ['form-field', 'form-select-wrap'];
  if (className) wrapperClasses.push(className);
  if (disabled) wrapperClasses.push('form-field--disabled');

  const wrapper = h('div', { class: wrapperClasses.join(' ') });

  if (label) {
    wrapper.appendChild(h('label', { for: triggerId, class: 'form-label' }, label));
  }

  const trigger = h('button', {
    id: triggerId,
    type: 'button',
    class: 'form-select-trigger',
    role: 'combobox',
    'aria-expanded': 'false',
    'aria-haspopup': 'listbox',
    'aria-controls': listboxId
  });
  if (disabled) trigger.setAttribute('disabled', '');

  const labelSpan = h('span', { class: 'form-select-trigger__text' });
  const chevron = icon('chevron-down', { className: 'form-select-trigger__chevron', size: '1.25rem' });

  trigger.appendChild(labelSpan);
  trigger.appendChild(chevron);
  wrapper.appendChild(trigger);

  // Floating menu in overlay-root
  const menu = h('div', {
    id: listboxId,
    class: 'form-select-menu',
    role: 'listbox',
    'aria-label': label || placeholder
  });
  menu.style.setProperty('display', 'none');

  function updateTriggerLabel() {
    const selected = currentOptions.find(o => String(o.value) === String(currentValue));
    if (selected) {
      labelSpan.textContent = selected.label;
      trigger.classList.remove('form-select-trigger--placeholder');
    } else {
      labelSpan.textContent = placeholder;
      trigger.classList.add('form-select-trigger--placeholder');
    }
  }

  function renderMenuOptions() {
    clear(menu);
    currentOptions.forEach((opt, idx) => {
      const isSelected = String(opt.value) === String(currentValue);
      const isFocused = idx === focusedIndex;

      const itemClasses = ['form-select-option'];
      if (isSelected) itemClasses.push('form-select-option--selected');
      if (isFocused) itemClasses.push('form-select-option--focused');

      const optEl = h('div', {
        class: itemClasses.join(' '),
        role: 'option',
        'aria-selected': isSelected ? 'true' : 'false',
        'data-index': String(idx)
      });

      if (opt.icon) {
        optEl.appendChild(icon(opt.icon, { size: '1.125rem', className: 'form-select-option__icon' }));
      }

      optEl.appendChild(h('span', { class: 'form-select-option__text' }, opt.label));

      if (isSelected) {
        optEl.appendChild(icon('check', { size: '1.125rem', className: 'form-select-option__check' }));
      }

      optEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectValue(opt.value);
        closeMenu();
      });

      menu.appendChild(optEl);
    });
  }

  function positionMenu() {
    const rect = trigger.getBoundingClientRect();
    const overlay = getOverlayRoot();

    // Position directly below trigger
    menu.style.setProperty('position', 'absolute');
    menu.style.setProperty('top', `${rect.bottom + 4}px`);
    menu.style.setProperty('left', `${rect.left}px`);
    menu.style.setProperty('inline-size', `${rect.width}px`);
    menu.style.setProperty('z-index', 'var(--z-dropdown)');
  }

  function openMenu() {
    if (disabled || isOpen) return;
    isOpen = true;
    trigger.setAttribute('aria-expanded', 'true');
    const overlay = getOverlayRoot();
    if (!overlay.contains(menu)) overlay.appendChild(menu);

    focusedIndex = currentOptions.findIndex(o => String(o.value) === String(currentValue));
    if (focusedIndex === -1 && currentOptions.length > 0) focusedIndex = 0;

    renderMenuOptions();
    positionMenu();
    menu.style.setProperty('display', 'block');

    window.addEventListener('click', onOutsideClick, true);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    trigger.setAttribute('aria-expanded', 'false');
    menu.style.setProperty('display', 'none');

    window.removeEventListener('click', onOutsideClick, true);
    window.removeEventListener('resize', closeMenu);
    window.removeEventListener('scroll', closeMenu, true);
  }

  function onOutsideClick(e) {
    if (!trigger.contains(e.target) && !menu.contains(e.target)) {
      closeMenu();
    }
  }

  function selectValue(val) {
    currentValue = val;
    updateTriggerLabel();
    const opt = currentOptions.find(o => String(o.value) === String(val));
    if (onChange) onChange(val, opt);
  }

  // Trigger events
  trigger.addEventListener('click', () => {
    if (isOpen) closeMenu();
    else openMenu();
  });

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        openMenu();
      } else if (focusedIndex < currentOptions.length - 1) {
        focusedIndex++;
        renderMenuOptions();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && focusedIndex > 0) {
        focusedIndex--;
        renderMenuOptions();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        openMenu();
      } else if (focusedIndex >= 0 && focusedIndex < currentOptions.length) {
        selectValue(currentOptions[focusedIndex].value);
        closeMenu();
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        closeMenu();
      }
    }
  });

  updateTriggerLabel();

  return {
    el: wrapper,
    getValue() {
      return currentValue;
    },
    setValue(val) {
      currentValue = val;
      updateTriggerLabel();
    },
    setOptions(newOpts) {
      currentOptions = [...newOpts];
      updateTriggerLabel();
      if (isOpen) renderMenuOptions();
    },
    destroy() {
      closeMenu();
      if (menu.parentNode) menu.parentNode.removeChild(menu);
    }
  };
}
