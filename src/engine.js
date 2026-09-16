import { all, create } from 'mathjs';

const math = create(all);
export function normalize(expression) {
  return expression.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-').replaceAll('π', 'pi').replaceAll('√', 'sqrt');
}

export function calculate({ expression, operation = 'evaluate', angle = 'DEG', variable = 'x', value = '0', ans = '0' }) {
  if (!expression.trim()) throw new Error('Enter an expression first.');
  if (expression.length > 2000) throw new Error('Please use an expression shorter than 2,000 characters.');
  const source = normalize(expression);
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable)) throw new Error('Use a valid variable name, such as x.');
  const scope = new Map();
  scope.set('ans', math.evaluate(ans));
  if (operation === 'evaluate' && angle === 'DEG') {
    for (const name of ['sin', 'cos', 'tan', 'sec', 'csc', 'cot']) {
      scope.set(name, x => math[name](math.isUnit(x) ? x : math.multiply(x, Math.PI / 180)));
    }
    for (const name of ['asin', 'acos', 'atan', 'asec', 'acsc', 'acot']) {
      scope.set(name, x => math.multiply(math[name](x), 180 / Math.PI));
    }
  }
  let result;
  if (operation === 'simplify') result = math.simplify(source).toString();
  else if (operation === 'expand') result = math.rationalize(source).toString();
  else if (operation === 'derivative') result = math.derivative(source, variable).toString();
  else if (operation === 'substitute') {
    scope.set(variable, math.evaluate(normalize(value)));
    result = math.evaluate(source, scope);
  } else result = math.evaluate(source, scope);
  const symbolic = ['simplify', 'expand', 'derivative'].includes(operation);
  if (!symbolic && (typeof result === 'function' || result === undefined || result?.isResultSet)) {
    throw new Error('Enter one mathematical expression at a time.');
  }
  if (!symbolic && typeof result === 'number' && !Number.isFinite(result)) throw new Error('The result is undefined or outside the numeric range.');
  return { text: symbolic ? result : math.format(result, { precision: 14 }), raw: symbolic ? null : math.format(result, { precision: 17 }), symbolic };
}
