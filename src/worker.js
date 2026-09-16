import { calculate } from './engine.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ id: data.id, result: calculate(data) }); }
  catch (error) { self.postMessage({ id: data.id, error: error.message }); }
};
