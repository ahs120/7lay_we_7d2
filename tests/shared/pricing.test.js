import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toPiasters,
  fromPiasters,
  percentOf,
  calcLineTotal,
  calcOrderTotals
} from '../../src/shared/pricing.js';

test('toPiasters decimal strings parsing and rounding', () => {
  assert.equal(toPiasters('12'), 1200);
  assert.equal(toPiasters('12.5'), 1250);
  assert.equal(toPiasters('12.50'), 1250);
  assert.equal(toPiasters('12,5'), 1250);
  assert.equal(toPiasters('12,50'), 1250);
  assert.equal(toPiasters(12), 1200);
  assert.equal(toPiasters(0), 0);
  assert.equal(toPiasters('0'), 0);
  assert.equal(toPiasters('0.05'), 5);

  // Rounding half-up at 3rd decimal
  assert.equal(toPiasters('12.345'), 1235);
  assert.equal(toPiasters('12.344'), 1234);
  assert.equal(toPiasters('12.346'), 1235);
  assert.equal(toPiasters('0.005'), 1);
  assert.equal(toPiasters('0.004'), 0);

  // Float traps: 0.1 + 0.2
  const p1 = toPiasters('0.1');
  const p2 = toPiasters('0.2');
  assert.equal(p1 + p2, 30);
  assert.equal(fromPiasters(p1 + p2), '0.30');

  // Invalid inputs throw RangeError
  assert.throws(() => toPiasters('abc'), RangeError);
  assert.throws(() => toPiasters('-5'), RangeError);
  assert.throws(() => toPiasters('12.34.56'), RangeError);
  assert.throws(() => toPiasters(NaN), RangeError);
  assert.throws(() => toPiasters(null), RangeError);
  assert.throws(() => toPiasters(undefined), RangeError);
  assert.throws(() => toPiasters({}), RangeError);
  assert.throws(() => toPiasters(true), RangeError);
});

test('fromPiasters formatting', () => {
  assert.equal(fromPiasters(1250), '12.50');
  assert.equal(fromPiasters(0), '0.00');
  assert.equal(fromPiasters(5), '0.05');
  assert.equal(fromPiasters(100), '1.00');
  assert.equal(fromPiasters(-1250), '-12.50');
  assert.throws(() => fromPiasters(12.5), RangeError);
  assert.throws(() => fromPiasters('1250'), RangeError);
});

test('percentOf calculation with half-up rounding', () => {
  assert.equal(percentOf(10000, 1400), 1400); // 14% of 10000
  assert.equal(percentOf(1000, 1200), 120);   // 12% of 1000
  // Rounding half-up: 35 * 1400 = 49000 -> (49000 + 5000) / 10000 = 54000 / 10000 = 5
  assert.equal(percentOf(35, 1400), 5);
  // 32 * 1400 = 44800 -> (44800 + 5000) / 10000 = 49800 / 10000 = 4
  assert.equal(percentOf(32, 1400), 4);
  assert.throws(() => percentOf(100.5, 1000), RangeError);
});

test('calcLineTotal calculation', () => {
  // Simple item without addons
  assert.equal(calcLineTotal({ unitPrice: 2500, qty: 2 }), 5000);

  // Item with addons
  const line = {
    unitPrice: 2000,
    qty: 2,
    addons: [
      { price: 300, qty: 2 },
      { price: 150, qty: 1 }
    ]
  };
  // 2000 * 2 + (300*2 + 150*1) = 4000 + 750 = 4750
  assert.equal(calcLineTotal(line), 4750);

  assert.throws(() => calcLineTotal({ unitPrice: 2000, qty: 0 }), RangeError);
  assert.throws(() => calcLineTotal({ unitPrice: -10, qty: 1 }), RangeError);
  assert.throws(() => calcLineTotal({ unitPrice: 2000, qty: 1, addons: [{ price: -5, qty: 1 }] }), RangeError);
});

test('calcOrderTotals with taxes, service, discount and empty lines', () => {
  // 14% tax with service 12% on 10000 piasters (100 EGP)
  const result = calcOrderTotals({
    lines: [10000],
    discount: null,
    serviceBps: 1200,
    taxBps: 1400,
    taxOnService: true,
    deliveryFee: 0
  });

  // subtotal = 10000
  // discount = 0
  // net = 10000
  // service = 12% of 10000 = 1200
  // tax = 14% of (10000 + 1200) = 14% of 11200 = 1568
  // total = 10000 + 1200 + 1568 = 12768
  assert.deepEqual(result, {
    subtotal: 10000,
    discount: 0,
    net: 10000,
    service: 1200,
    tax: 1568,
    deliveryFee: 0,
    total: 12768
  });

  // Discount clamp test
  const clamped = calcOrderTotals({
    lines: [5000],
    discount: { type: 'fixed', value: 8000 }
  });
  assert.equal(clamped.discount, 5000);
  assert.equal(clamped.net, 0);
  assert.equal(clamped.total, 0);

  // Percentage discount
  const pctDiscount = calcOrderTotals({
    lines: [10000],
    discount: { type: 'percent', value: 2000 }, // 20%
    serviceBps: 0,
    taxBps: 0
  });
  assert.equal(pctDiscount.discount, 2000);
  assert.equal(pctDiscount.net, 8000);
  assert.equal(pctDiscount.total, 8000);

  // Empty lines
  const empty = calcOrderTotals({ lines: [] });
  assert.deepEqual(empty, {
    subtotal: 0,
    discount: 0,
    net: 0,
    service: 0,
    tax: 0,
    deliveryFee: 0,
    total: 0
  });

  // Invalid inputs
  assert.throws(() => calcOrderTotals({ lines: null }), RangeError);
  assert.throws(() => calcOrderTotals({ lines: [-100] }), RangeError);
  assert.throws(() => calcOrderTotals({ lines: [1000], serviceBps: -1 }), RangeError);
});

