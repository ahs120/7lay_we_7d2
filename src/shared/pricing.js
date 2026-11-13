/**
 * Safe money arithmetic in integer piasters (1 EGP = 100 piasters).
 * Never uses floating-point math, parseFloat, toFixed, or Math.round on money paths.
 */

export function toPiasters(input) {
  if (input === null || input === undefined || typeof input === 'boolean' || typeof input === 'object') {
    throw new RangeError('Invalid money input');
  }

  let str;
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) {
      throw new RangeError('Money input must be a non-negative finite number');
    }
    str = String(input);
  } else if (typeof input === 'string') {
    str = input.trim().replace(',', '.');
  } else {
    throw new RangeError('Invalid money input');
  }

  if (!/^\d+(\.\d+)?$/.test(str)) {
    throw new RangeError(`Invalid money format: "${input}"`);
  }

  const [intPart, decPart = ''] = str.split('.');
  const intVal = BigInt(intPart);
  let piasters = intVal * 100n;

  if (decPart.length === 1) {
    piasters += BigInt(decPart) * 10n;
  } else if (decPart.length === 2) {
    piasters += BigInt(decPart);
  } else if (decPart.length >= 3) {
    let cents = BigInt(decPart.slice(0, 2));
    const thirdDigit = Number(decPart[2]);
    if (thirdDigit >= 5) {
      cents += 1n;
    }
    piasters += cents;
  }

  const result = Number(piasters);
  if (!Number.isSafeInteger(result)) {
    throw new RangeError('Money value exceeds safe integer limit');
  }
  return result;
}

export function fromPiasters(n) {
  if (!Number.isInteger(n)) {
    throw new RangeError('Expected integer for piasters');
  }
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const pounds = Math.trunc(abs / 100);
  const cents = abs % 100;
  return `${sign}${pounds}.${String(cents).padStart(2, '0')}`;
}

export function percentOf(amount, bps) {
  if (!Number.isInteger(amount) || !Number.isInteger(bps)) {
    throw new RangeError('Expected integer arguments for percentOf');
  }
  if (amount < 0 || bps < 0) {
    throw new RangeError('Expected non-negative integer arguments for percentOf');
  }
  const prod = BigInt(amount) * BigInt(bps);
  const result = (prod + 5000n) / 10000n;
  return Number(result);
}

export function calcLineTotal({ unitPrice, qty, addons = [] }) {
  if (!Number.isInteger(unitPrice) || unitPrice < 0) {
    throw new RangeError('unitPrice must be a non-negative integer');
  }
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new RangeError('qty must be a positive integer');
  }

  let addonsTotal = 0;
  if (addons && Array.isArray(addons)) {
    for (const addon of addons) {
      if (!addon || typeof addon !== 'object') {
        throw new RangeError('addon must be an object');
      }
      if (!Number.isInteger(addon.price) || addon.price < 0) {
        throw new RangeError('addon price must be a non-negative integer');
      }
      const addonQty = addon.qty ?? 1;
      if (!Number.isInteger(addonQty) || addonQty <= 0) {
        throw new RangeError('addon qty must be a positive integer');
      }
      addonsTotal += addon.price * addonQty;
    }
  }

  return unitPrice * qty + addonsTotal;
}

export function calcOrderTotals({
  lines = [],
  discount = null,
  serviceBps = 0,
  taxBps = 0,
  taxOnService = true,
  deliveryFee = 0
}) {
  if (!Array.isArray(lines)) {
    throw new RangeError('lines must be an array');
  }
  if (!Number.isInteger(serviceBps) || serviceBps < 0) {
    throw new RangeError('serviceBps must be a non-negative integer');
  }
  if (!Number.isInteger(taxBps) || taxBps < 0) {
    throw new RangeError('taxBps must be a non-negative integer');
  }
  if (!Number.isInteger(deliveryFee) || deliveryFee < 0) {
    throw new RangeError('deliveryFee must be a non-negative integer');
  }

  let subtotal = 0;
  for (const line of lines) {
    if (typeof line === 'number') {
      if (!Number.isInteger(line) || line < 0) {
        throw new RangeError('line total must be a non-negative integer');
      }
      subtotal += line;
    } else if (line && typeof line === 'object') {
      const lineTotal = line.total !== undefined ? line.total : calcLineTotal(line);
      if (!Number.isInteger(lineTotal) || lineTotal < 0) {
        throw new RangeError('line total must be a non-negative integer');
      }
      subtotal += lineTotal;
    } else {
      throw new RangeError('Invalid line item');
    }
  }

  let discountAmount = 0;
  if (discount !== null && discount !== undefined) {
    if (typeof discount !== 'object') {
      throw new RangeError('discount must be an object or null');
    }
    if (!Number.isInteger(discount.value) || discount.value < 0) {
      throw new RangeError('discount.value must be a non-negative integer');
    }
    if (discount.type === 'percent') {
      discountAmount = percentOf(subtotal, discount.value);
    } else if (discount.type === 'fixed') {
      discountAmount = discount.value;
    } else {
      throw new RangeError(`Invalid discount type: ${discount.type}`);
    }

    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
    if (discountAmount < 0) {
      discountAmount = 0;
    }
  }

  const net = subtotal - discountAmount;
  const service = percentOf(net, serviceBps);
  const taxBase = net + (taxOnService ? service : 0);
  const tax = percentOf(taxBase, taxBps);
  const total = net + service + tax + deliveryFee;

  return {
    subtotal,
    discount: discountAmount,
    net,
    service,
    tax,
    deliveryFee,
    total
  };
}

