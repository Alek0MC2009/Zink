import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import fs from 'fs'

// Escuchamos la petición del túnel

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('dialog:open-file', async (_event, filePath) => {
  try {
    // Leemos el archivo real con encoding UTF-8
    const content = fs.readFileSync(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error('Error leyendo el archivo:', error)
    return 'Error al leer el archivo'
  }
})

const historyPath = path.join(app.getPath('userData'), 'history.json')

// 1. Escuchar petición para CARGAR el historial
ipcMain.handle('get-history', () => {
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify([])) // Crea archivo vacío si no existe
    return []
  }
  const data = fs.readFileSync(historyPath, 'utf-8')
  return JSON.parse(data)
})

// 2. Escuchar petición para GUARDAR en el historial
ipcMain.handle('save-to-history', (_event, newEntry) => {
  const data = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf-8')) : []

  // Evitar duplicados: si la ruta ya existe, no la añadimos
  if (!data.find((item) => item.path === newEntry.path)) {
    data.unshift(newEntry) // Añade al principio de la lista
    fs.writeFileSync(historyPath, JSON.stringify(data.slice(0, 10))) // Guardamos solo los últimos 10
  }
  return data
})

ipcMain.handle('dialog:select-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Documentos de texto', extensions: ['txt', 'cpp', 'js', 'json', 'md'] }]
  })

  if (canceled) {
    return null
  } else {
    return filePaths[0] // Devolvemos la ruta del archivo seleccionado
  }
})

// En src/main/index.ts
ipcMain.handle('save-file', async (_event, filePath, content) => {
  try {
    if (!filePath) throw new Error('Ruta no definida')

    fs.writeFileSync(filePath, content, { encoding: 'utf-8' })

    // Devolvemos un OBJETO, no solo un booleano
    return { success: true }
  } catch (error) {
    // Si no le pones tipo, TS por defecto lo trata como 'unknown'
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error al guardar:', errorMessage)

    return { success: false, error: errorMessage }
  }
})

ipcMain.handle('dialog:save-as', async () => {
  // El método correcto es showSaveDialog
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Guardar nuevo archivo',
    defaultPath: path.join(app.getPath('documents'), 'archivo_nuevo.txt'),
    buttonLabel: 'Guardar',
    filters: [
      { name: 'Documentos de texto', extensions: ['txt'] },
      { name: 'Código C++', extensions: ['cpp', 'h'] },
      { name: 'JavaScript', extensions: ['js', 'json'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  })

  return canceled ? null : filePath
})
