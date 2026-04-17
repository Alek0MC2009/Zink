import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// 1. Agrupamos todas tus funciones en un solo objeto
const customAPI = {
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveToHistory: (entry: { name: string; path: string }) =>
    ipcRenderer.invoke('save-to-history', entry),
  openFile: (path: string) => ipcRenderer.invoke('dialog:open-file', path),
  selectFile: () => ipcRenderer.invoke('dialog:select-file'),
  saveFile: (path: string, content: string) => ipcRenderer.invoke('save-file', path, content),
  saveAs: () => ipcRenderer.invoke('dialog:save-as')
}

// 2. Exponemos de forma segura
if (process.contextIsolated) {
  try {
    // Exponemos las utilidades por defecto del toolkit (opcional)
    contextBridge.exposeInMainWorld('electron', electronAPI)

    // Exponemos TU API personalizada bajo el nombre 'api' o 'electronAPI'
    // Para que coincida con tu App.tsx actual, lo llamaremos 'electron'
    // Pero como ya existe uno arriba, mejor lo unificamos:
    contextBridge.exposeInMainWorld('api', customAPI)
  } catch (error) {
    console.error('Error en el Preload:', error)
  }
} else {
  // @ts-ignore (fallback para cuando no hay aislamiento)
  window.electron = electronAPI
  // @ts-ignore nose
  window.api = customAPI
}
