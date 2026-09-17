import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreHistory } from '../src/history.js';

test('history handles malformed storage and bounds retained entries', () => {
  for (const value of [null, {}, 'invalid']) assert.deepEqual(restoreHistory(value), []);
  assert.deepEqual(restoreHistory([null, {}, { expression: 1, text: '1' }]), []);
  assert.equal(restoreHistory(Array.from({ length: 60 }, () => ({ expression: '2', text: '2' }))).length, 50);
});

test('legacy history gets safe defaults and valid algebra entries retain context', () => {
  const [legacy, algebra] = restoreHistory([
    { expression: '2', text: '2', mode: 'unknown', operation: 'unknown', variable: {}, raw: 2 },
    { expression: 'ans + t', text: '7', raw: '7', ans: '3', operation: 'substitute', mode: 'standard', variable: 't', value: '4', angle: 'RAD' },
  ]);
  assert.equal(legacy.mode, 'scientific');
  assert.equal(legacy.operation, 'evaluate');
  assert.equal(legacy.variable, 'x');
  assert.equal(legacy.raw, null);
  assert.equal(legacy.ans, '0');
  assert.equal(algebra.mode, 'algebra');
  assert.equal(algebra.ans, '3');
  assert.equal(algebra.variable, 't');
  assert.equal(algebra.value, '4');
  assert.equal(algebra.angle, 'RAD');
});
