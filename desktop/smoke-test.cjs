const assert = require('node:assert/strict');
const { once } = require('node:events');

async function waitUntil(window, condition) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await window.webContents.executeJavaScript(condition)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const error = await window.webContents.executeJavaScript('document.querySelector("#error")?.textContent');
  throw new Error(`Desktop calculation timed out: ${error}`);
}

module.exports = async function smokeTest(window) {
  if (window.webContents.isLoading()) await once(window.webContents, 'did-finish-load');
  const preferences = window.webContents.getLastWebPreferences();
  assert.equal(preferences.nodeIntegration, false);
  assert.equal(preferences.contextIsolation, true);
  assert.equal(preferences.sandbox, true);
  assert.equal(await window.webContents.executeJavaScript('typeof require'), 'undefined');
  const input = expression => window.webContents.executeJavaScript(`
    document.querySelector('#expression').value = ${JSON.stringify(expression)};
    document.querySelector('#expression').dispatchEvent(new KeyboardEvent('keydown', {key:'Enter',bubbles:true}));
  `);
  await input('sin(30) + 2^3');
  await waitUntil(window, 'document.querySelector("#result").textContent === "8.5"');
  await window.webContents.executeJavaScript(`
    document.querySelector('[data-mode="algebra"]').click();
    document.querySelector('#operation').value='derivative';
    document.querySelector('#operation').dispatchEvent(new Event('change'));
  `);
  await input('x^3');
  await waitUntil(window, 'document.querySelector("#result").textContent === "3 * x ^ 2"');
  assert.equal(await window.webContents.executeJavaScript('document.querySelectorAll(".history-item").length'), 2);
  const loaded = once(window.webContents, 'did-finish-load');
  window.webContents.reload();
  await loaded;
  await waitUntil(window, 'document.querySelectorAll(".history-item").length === 2');
  await window.webContents.executeJavaScript('document.querySelector(".history-item").click()');
  assert.equal(await window.webContents.executeJavaScript('document.querySelector("#operation").value'), 'derivative');
  const networkBlocked = await window.webContents.executeJavaScript('fetch("https://example.com").then(() => false).catch(() => true)');
  assert.equal(networkBlocked, true);
};
