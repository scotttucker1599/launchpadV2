const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

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

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
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
  mainWindow?.minimize();
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
