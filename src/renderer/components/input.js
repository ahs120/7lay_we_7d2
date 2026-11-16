// src/renderer/components/input.js
// Accessible form input component with label, error display, prefix/suffix and icons.

import { h, uid, clear } from '../utils/dom.js';
import { icon } from './icon.js';

/**
 * @typedef {object} InputOpts
 * @property {string} [label]
 * @property {string} [value]
 * @property {string} [placeholder]
 * @property {string} [type] - default 'text'
 * @property {(val: string, e: Event) => void} [onInput]
 * @property {(val: string, e: Event) => void} [onChange]
 * @property {string|null} [error]
 * @property {string} [icon]
 * @property {string} [prefix]
 * @property {string} [suffix]
 * @property {'rtl'|'ltr'} [dir]
 * @property {string} [inputmode]
 * @property {boolean} [disabled]
 * @property {boolean} [readonly]
 * @property {boolean} [required]
 * @property {boolean} [autoFocus]
 * @property {string} [className]
 */

export function input(opts = {}) {
  const {
    label = '',
    value = '',
    placeholder = '',
    type = 'text',
    onInput = null,
    onChange = null,
    error: initialError = null,
    icon: iconName = null,
    prefix = null,
    suffix = null,
    dir = null,
    inputmode = null,
    disabled = false,
    readonly = false,
    required = false,
    autoFocus = false,
    className = ''
  } = opts;

  const id = uid('input');
  const errorId = `${id}-error`;

  const inputProps = {
    id,
    type,
    class: 'form-input',
    placeholder,
    value: String(value ?? '')
  };
  if (disabled) inputProps.disabled = '';
  if (readonly) inputProps.readonly = '';
  if (required) inputProps.required = '';
  if (dir) inputProps.dir = dir;
  if (inputmode) inputProps.inputmode = inputmode;

  const inputEl = h('input', inputProps);

  const wrapperClasses = ['form-field'];
  if (className) wrapperClasses.push(className);
  if (disabled) wrapperClasses.push('form-field--disabled');

  const wrapper = h('div', { class: wrapperClasses.join(' ') });

  let labelEl = null;
  if (label) {
    labelEl = h('label', { for: id, class: 'form-label' }, label);
    if (required) {
      labelEl.appendChild(h('span', { class: 'form-label__required' }, ' *'));
    }
    wrapper.appendChild(labelEl);
  }

  const controlEl = h('div', { class: 'form-control' });

  if (iconName) {
    controlEl.appendChild(icon(iconName, { className: 'form-control__icon', size: '1.25rem' }));
  }

  if (prefix) {
    controlEl.appendChild(h('span', { class: 'form-control__affix form-control__prefix' }, prefix));
  }

  controlEl.appendChild(inputEl);

  if (suffix) {
    controlEl.appendChild(h('span', { class: 'form-control__affix form-control__suffix' }, suffix));
  }

  wrapper.appendChild(controlEl);

  const errorEl = h('div', { id: errorId, class: 'form-error', 'aria-live': 'polite' });
  wrapper.appendChild(errorEl);

  function setError(msg) {
    clear(errorEl);
    if (msg) {
      wrapper.classList.add('form-field--error');
      inputEl.setAttribute('aria-invalid', 'true');
      inputEl.setAttribute('aria-describedby', errorId);
      errorEl.appendChild(icon('triangle-exclamation-point', { size: '1rem', className: 'form-error__icon' }));
      errorEl.appendChild(document.createTextNode(` ${msg}`));
      errorEl.removeAttribute('hidden');
    } else {
      wrapper.classList.remove('form-field--error');
      inputEl.removeAttribute('aria-invalid');
      inputEl.removeAttribute('aria-describedby');
      errorEl.setAttribute('hidden', '');
    }
  }

  if (initialError) {
    setError(initialError);
  } else {
    errorEl.setAttribute('hidden', '');
  }

  let inputListener = null;
  if (onInput) {
    inputListener = (e) => onInput(inputEl.value, e);
    inputEl.addEventListener('input', inputListener);
  }

  let changeListener = null;
  if (onChange) {
    changeListener = (e) => onChange(inputEl.value, e);
    inputEl.addEventListener('change', changeListener);
  }

  if (autoFocus) {
    setTimeout(() => inputEl.focus(), 50);
  }

  return {
    el: wrapper,
    inputEl,
    getValue() {
      return inputEl.value;
    },
    setValue(v) {
      inputEl.value = String(v ?? '');
    },
    setError,
    focus() {
      inputEl.focus();
    },
    setDisabled(bool) {
      if (bool) {
        inputEl.setAttribute('disabled', '');
        wrapper.classList.add('form-field--disabled');
      } else {
        inputEl.removeAttribute('disabled');
        wrapper.classList.remove('form-field--disabled');
      }
    },
    destroy() {
      if (inputListener) inputEl.removeEventListener('input', inputListener);
      if (changeListener) inputEl.removeEventListener('change', changeListener);
    }
  };
}
