import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/engine.js';
const calc = (expression, extra={}) => calculate({expression,...extra});
test('arithmetic respects precedence, parentheses and percentages',()=>{
  assert.equal(calc('2+3*4').text,'14');assert.equal(calc('(2+3)*4').text,'20');assert.equal(calc('200 * 10%').text,'20');assert.equal(calc('2^3^2').text,'512');assert.equal(calc('5!').text,'120');
});
test('degree, radian, inverse and hyperbolic trigonometry',()=>{
  assert.equal(calc('sin(30)').text,'0.5');assert.equal(calc('sin(pi/2)',{angle:'RAD'}).text,'1');assert.equal(calc('asin(0.5)').text,'30');assert.equal(calc('cos(60 deg)').text,'0.5');assert.equal(calc('sinh(0)').text,'0');
});
test('complex numbers, matrices, statistics and units',()=>{
  assert.equal(calc('sqrt(-1)').text,'i');assert.equal(calc('(2+3i)*(1-i)').text,'5 + i');assert.equal(calc('det([1,2;3,4])').text,'-2');assert.equal(calc('mean([2,4,6])').text,'4');assert.match(calc('5 cm to inch').text,/1\.9685039370079 inch/);
});
test('symbolic operations and substitution',()=>{
  assert.equal(calc('2x + 3x',{operation:'simplify'}).text,'5 * x');assert.equal(calc('x^3',{operation:'derivative'}).text,'3 * x ^ 2');assert.equal(calc('(x+1)^3',{operation:'expand'}).text,'x ^ 3 + 3 * x ^ 2 + 3 * x + 1');assert.equal(calc('x^2 + 1',{operation:'substitute',value:'3'}).text,'10');assert.equal(calc('sin(x)',{operation:'substitute',value:'pi/2'}).text,'1');
});
test('answer chaining retains internal precision',()=>{
  const first=calc('1/3');assert.equal(calc('ans * 3',{ans:first.raw}).text,'1');
});
test('malformed and undefined expressions produce errors',()=>{
  for(const expression of ['', '2 +', '1/0','0/0','unknown(2)'])assert.throws(()=>calc(expression));assert.throws(()=>calc('x',{variable:'x;bad'}));assert.throws(()=>calc('1'.repeat(2001)));
});
