const { app, BrowserWindow, ipcMain, shell, dialog, screen, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { pathToFileURL } = require('url');

// Register custom local-media scheme as privileged (must be before app is ready)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let pendingGenieRestore = null;

// Data persistence
const dataPath = path.join(app.getPath('userData'), 'shortcuts.json');

function loadShortcuts() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load shortcuts:', e);
  }
  return [];
}

function saveShortcuts(shortcuts) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(shortcuts, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save shortcuts:', e);
  }
}

function restoreWindowAfterGenie() {
  if (!mainWindow || mainWindow.isDestroyed() || !pendingGenieRestore) return;

  const { bounds, minimumSize, wasMaximized } = pendingGenieRestore;
  pendingGenieRestore = null;
  mainWindow.setMinimumSize(minimumSize[0], minimumSize[1]);
  mainWindow.setOpacity(1);
  mainWindow.setBounds(bounds, false);
  if (wasMaximized) mainWindow.maximize();
}

function animateWindowToTaskbar() {
  if (!mainWindow || mainWindow.isMinimized()) return;

  const wasMaximized = mainWindow.isMaximized();
  if (wasMaximized) mainWindow.unmaximize();

  const startBounds = mainWindow.getBounds();
  const minimumSize = mainWindow.getMinimumSize();
  mainWindow.setMinimumSize(1, 1);

  const display = screen.getDisplayMatching(startBounds);
  const workArea = display.workArea;
  const endBounds = {
    x: Math.round(workArea.x + workArea.width / 2 - 30),
    y: Math.round(workArea.y + workArea.height - 18),
    width: 60,
    height: 18,
  };

  const duration = 520;
  const start = Date.now();

  const easeInCubic = (t) => t * t * t;
  const timer = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      clearInterval(timer);
      return;
    }

    const progress = Math.min((Date.now() - start) / duration, 1);
    const eased = easeInCubic(progress);
    const nextBounds = {
      x: Math.round(startBounds.x + (endBounds.x - startBounds.x) * eased),
      y: Math.round(startBounds.y + (endBounds.y - startBounds.y) * eased),
      width: Math.max(1, Math.round(startBounds.width + (endBounds.width - startBounds.width) * eased)),
      height: Math.max(1, Math.round(startBounds.height + (endBounds.height - startBounds.height) * eased)),
    };

    mainWindow.setBounds(nextBounds, false);
    mainWindow.setOpacity(Math.max(0.15, 1 - eased * 0.85));

    if (progress >= 1) {
      clearInterval(timer);
      pendingGenieRestore = { bounds: startBounds, minimumSize, wasMaximized };
      mainWindow.minimize();
    }
  }, 16);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
  });

  mainWindow.on('restore', restoreWindowAfterGenie);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  // Register local-media protocol handler to serve local images
  protocol.handle('local-media', (request) => {
    let filePath = request.url.slice('local-media://'.length);
    filePath = decodeURIComponent(filePath);
    // On Windows, strip leading slash if URL normalized to "local-media:///C:/..."
    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.slice(1);
    }
    try {
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (err) {
      console.error('local-media protocol error:', err);
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-shortcuts', () => {
  return loadShortcuts();
});

ipcMain.handle('save-shortcuts', (_, shortcuts) => {
  saveShortcuts(shortcuts);
  return true;
});

ipcMain.handle('launch-shortcut', (_, shortcut) => {
  try {
    if (shortcut.type === 'steam') {
      shell.openExternal(`steam://rungameid/${shortcut.steamId}`);
    } else if (shortcut.type === 'web') {
      if (process.platform === 'win32') {
        exec(`start chrome "${shortcut.url}"`, (error) => {
          if (error) {
            console.error('Failed to launch Chrome, falling back to default browser:', error);
            shell.openExternal(shortcut.url);
          }
        });
      } else if (process.platform === 'darwin') {
        exec(`open -a "Google Chrome" "${shortcut.url}"`, (error) => {
          if (error) {
            shell.openExternal(shortcut.url);
          }
        });
      } else {
        shell.openExternal(shortcut.url);
      }
    } else if (shortcut.type === 'app' || shortcut.type === 'folder') {
      shell.openPath(shortcut.path);
    }
    return true;
  } catch (e) {
    console.error('Failed to launch shortcut:', e);
    return false;
  }
});

// Window controls
ipcMain.handle('window-minimize', () => {
  animateWindowToTaskbar();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Executables', extensions: ['exe', 'bat', 'cmd'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const srcPath = result.filePaths[0];
    const iconsDir = path.join(app.getPath('userData'), 'icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }
    const ext = path.extname(srcPath);
    const destName = `icon-${Date.now()}${ext}`;
    const destPath = path.join(iconsDir, destName);
    fs.copyFileSync(srcPath, destPath);
    return destPath;
  }
  return null;
});
