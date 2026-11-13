// src/main/services/validate.js
// Lightweight schema validation for IPC payloads.
// Returns a cleaned, coerced value on success; throws AppError VALIDATION on failure.

import { AppError } from './errors.js';

// ── Primitive validators ────────────────────────────────────────────────────

/**
 * String validator.
 * @param {{ min?: number, max?: number, trim?: boolean, optional?: boolean }} opts
 */
function string({ min = 0, max = 1000, trim = true, optional = false } = {}) {
  return function validateString(value, path) {
    if (value === undefined || value === null) {
      if (optional) return undefined;
      throw AppError.validation(`${path} is required`);
    }
    if (typeof value !== 'string') {
      throw AppError.validation(`${path} must be a string`);
    }
    const v = trim ? value.trim() : value;
    if (v.length < min) throw AppError.validation(`${path} must be at least ${min} characters`);
    if (v.length > max) throw AppError.validation(`${path} must be at most ${max} characters`);
    return v;
  };
}

/**
 * Integer validator.
 * @param {{ min?: number, max?: number, optional?: boolean }} opts
 */
function int({ min = -Infinity, max = Infinity, optional = false } = {}) {
  return function validateInt(value, path) {
    if (value === undefined || value === null) {
      if (optional) return undefined;
      throw AppError.validation(`${path} is required`);
    }
    if (!Number.isInteger(value)) {
      throw AppError.validation(`${path} must be an integer`);
    }
    if (value < min) throw AppError.validation(`${path} must be >= ${min}`);
    if (value > max) throw AppError.validation(`${path} must be <= ${max}`);
    return value;
  };
}

/**
 * Boolean validator.
 * @param {{ optional?: boolean }} opts
 */
function bool({ optional = false } = {}) {
  return function validateBool(value, path) {
    if (value === undefined || value === null) {
      if (optional) return undefined;
      throw AppError.validation(`${path} is required`);
    }
    if (typeof value !== 'boolean') {
      throw AppError.validation(`${path} must be a boolean`);
    }
    return value;
  };
}

/**
 * Enum validator — value must be one of the given options.
 * @param {readonly unknown[]} options
 * @param {{ optional?: boolean }} opts
 */
function oneOf(options, { optional = false } = {}) {
  return function validateOneOf(value, path) {
    if (value === undefined || value === null) {
      if (optional) return undefined;
      throw AppError.validation(`${path} is required`);
    }
    if (!options.includes(value)) {
      throw AppError.validation(`${path} must be one of: ${options.join(', ')}`);
    }
    return value;
  };
}

/**
 * Object validator. Rejects unknown keys.
 * @param {Record<string, Function>} shape  - Map of key → validator function
 * @param {{ optional?: boolean }} opts
 */
function object(shape, { optional = false } = {}) {
  return function validateObject(value, path) {
    if (value === undefined || value === null) {
      if (optional) return undefined;
      throw AppError.validation(`${path} is required`);
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw AppError.validation(`${path} must be an object`);
    }

    // Reject unknown keys
    const knownKeys = new Set(Object.keys(shape));
    for (const key of Object.keys(value)) {
      if (!knownKeys.has(key)) {
        throw AppError.validation(`${path}.${key} is not an allowed field`);
      }
    }

    const cleaned = {};
    for (const [key, validator] of Object.entries(shape)) {
      const result = validator(value[key], `${path}.${key}`);
      if (result !== undefined) cleaned[key] = result;
    }
    return cleaned;
  };
}

/**
 * Array validator.
 * @param {Function} itemValidator - Validator for each element
 * @param {{ max?: number, optional?: boolean }} opts
 */
function array(itemValidator, { max = 1000, optional = false } = {}) {
  return function validateArray(value, path) {
    if (value === undefined || value === null) {
      if (optional) return optional ? undefined : [];
      throw AppError.validation(`${path} is required`);
    }
    if (!Array.isArray(value)) {
      throw AppError.validation(`${path} must be an array`);
    }
    if (value.length > max) {
      throw AppError.validation(`${path} must have at most ${max} items`);
    }
    return value.map((item, i) => itemValidator(item, `${path}[${i}]`));
  };
}

// ── Main validate function ──────────────────────────────────────────────────

/**
 * Validate `value` against `schema` (a validator function from `v.*`).
 * Returns the cleaned value or throws AppError VALIDATION.
 *
 * @param {Function} schema  - A validator produced by v.*
 * @param {unknown}  value   - The raw input (from IPC)
 * @returns {unknown}        - Cleaned, coerced value
 */
export function validate(schema, value) {
  return schema(value, 'payload');
}

/** Validator builder namespace. */
export const v = { string, int, bool, oneOf, object, array };

