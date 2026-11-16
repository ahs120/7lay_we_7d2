// tests/renderer/api.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { call, safeCall, on, ApiError } from '../../src/renderer/services/api.js';

test('api: throws when window.api is missing', async () => {
  delete globalThis.window;
  await assert.rejects(async () => call('app:ping'), /unavailable/);
});

test('api: call unwraps data and throws ApiError on failure', async () => {
  globalThis.window = {
    api: {
      async invoke(channel, payload) {
        if (channel === 'app:ping') {
          return { ok: true, data: { pong: true, received: payload } };
        }
        if (channel === 'bad:channel') {
          return { ok: false, code: 'FORBIDDEN', message: 'No access' };
        }
        return { ok: false };
      }
    }
  };

  const pingRes = await call('app:ping', { hello: 'world' });
  assert.deepEqual(pingRes, { pong: true, received: { hello: 'world' } });

  await assert.rejects(
    async () => call('bad:channel'),
    (err) => err instanceof ApiError && err.code === 'FORBIDDEN' && err.message === 'No access'
  );
});

test('api: safeCall handles both success and failure cleanly', async () => {
  globalThis.window = {
    api: {
      async invoke(channel) {
        if (channel === 'ok') return { ok: true, data: 123 };
        return { ok: false, code: 'NOT_FOUND', message: 'Missing' };
      }
    }
  };

  const resOk = await safeCall('ok');
  assert.equal(resOk.ok, true);
  assert.equal(resOk.data, 123);

  const resFail = await safeCall('fail');
  assert.equal(resFail.ok, false);
  assert.equal(resFail.error.code, 'NOT_FOUND');
});

test('api: on forwards subscription and returns unsubscribe', () => {
  let unsubscribed = false;
  let receivedListener = null;

  globalThis.window = {
    api: {
      on(channel, listener) {
        receivedListener = listener;
        return () => { unsubscribed = true; };
      }
    }
  };

  const unsub = on('test:event', () => {});
  assert.equal(typeof receivedListener, 'function');
  assert.equal(typeof unsub, 'function');
  unsub();
  assert.equal(unsubscribed, true);
});
