const { app, BrowserWindow, Menu, session, dialog } = require('electron');
const path = require('node:path');

const smokeTest = process.argv.includes('--smoke-test');
// Tests get a disposable profile; the installed application always uses its own
// stable Electron userData directory so history survives app upgrades.
if (smokeTest) {
  const fs = require('node:fs');
  const os = require('node:os');
  app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'calc-studio-test-')));
}

app.setName('Calc Studio');
app.setAppUserModelId('com.calcstudio.desktop');
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Calc Studio',
    width: 1260,
    height: 1040,
    minWidth: 420,
    minHeight: 600,
    backgroundColor: '#f5f6f8',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    show: !smokeTest,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.webContents.on('page-title-updated', event => event.preventDefault());
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  if (!smokeTest) {
    mainWindow.webContents.on('did-fail-load', (_event, code, description) => {
      if (code !== -3) dialog.showErrorBox('Calc Studio could not open', description);
    });
  }
  return mainWindow;
}

const hasLock = smokeTest || app.requestSingleInstanceLock();
if (!hasLock) app.quit();
else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    // The packaged calculator has no network dependencies.
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
    const window = createWindow();
    if (smokeTest) {
      try {
        await require('./smoke-test.cjs')(window);
        process.stdout.write('PASS: Desktop arithmetic, algebra, offline operation, history persistence, and renderer isolation.\n');
        app.exit(0);
      } catch (error) {
        process.stderr.write(`${error.stack || error}\n`);
        app.exit(1);
      }
    }
  });
  app.on('window-all-closed', () => app.quit());
}
