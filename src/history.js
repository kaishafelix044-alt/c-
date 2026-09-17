const operations = new Set(['evaluate', 'simplify', 'expand', 'derivative', 'substitute']);

// Storage from older versions or manual edits must not break the workspace.
export function restoreHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => item && typeof item.expression === 'string' && typeof item.text === 'string')
    .slice(0, 50)
    .map(item => {
      const operation = operations.has(item.operation) ? item.operation : 'evaluate';
      return {
        expression: item.expression,
        text: item.text,
        raw: typeof item.raw === 'string' ? item.raw : null,
        ans: typeof item.ans === 'string' && item.ans.trim() ? item.ans : '0',
        operation,
        mode: operation === 'evaluate' ? (item.mode === 'standard' ? 'standard' : 'scientific') : 'algebra',
        angle: item.angle === 'RAD' ? 'RAD' : 'DEG',
        variable: typeof item.variable === 'string' && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(item.variable) ? item.variable : 'x',
        value: typeof item.value === 'string' ? item.value : '0',
        time: typeof item.time === 'string' ? item.time : '',
      };
    });
}
