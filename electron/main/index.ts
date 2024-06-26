import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { release } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { update } from './update'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import { spawn } from 'child_process';
const pythonScript = join(__dirname, '..', 'node-tsc', 'app.py');

// Spawn a new process with the Python interpreter and script
const backendProcess = spawn('bash', ['-c', `source ${__dirname}/../node-tsc/venv/bin/activate && python ${pythonScript}`]);

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.mjs')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload: preload
    },
    width: 1600,
    height: 950,
    resizable: false,
    backgroundColor: "#ffffff"
  })

  ipcMain.handle('showOpenDialog', async () => {
    if (win) {
      return await dialog.showOpenDialog(win);
    } else {
        // Handle the case where win is null or undefined
        throw new Error('Main window is not initialized.');
    }
  });

  if (url) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Apply electron-updater
  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

ipcMain.on('upload-file', (event, filePath) => {
  // Handle the file upload logic here
  console.log(`Received file path: ${filePath}`);
  // Add your file upload logic here
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

async function createVizWindow() {
  let win = new BrowserWindow({
    width: 1200, // specify your desired width
    height: 800, // specify your desired height
    resizable: false
  });
  win.loadURL('http://localhost:5173/visualize');
}

ipcMain.handle('showOpenWindow', async () => {
  return await createVizWindow();
});

async function createTutorialWindow() {
  let win = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: false
  });
  win.loadURL('http://localhost:5173/tutorial');
}

ipcMain.handle('showtTutorialWindow', async () => {
  return await createTutorialWindow();
});