import { useState, useEffect, JSX } from 'react'
import { SideBar } from './components/Sidebar'
import { Toaster, toast } from 'react-hot-toast'

interface FileEntry {
  name: string
  path: string
}

export default function App(): JSX.Element {
  const [history, setHistory] = useState<FileEntry[]>([])
  const [content, setContent] = useState<string>('')
  const [currentPath, setCurrentPath] = useState<string>('')
  const [isDirty, setIsDirty] = useState(false)
  // CARGA INICIAL
  useEffect((): void => {
    async function loadHistory(): Promise<void> {
      try {
        // @ts-ignore: Custom Electron API
        const savedHistory = await window.api.getHistory()
        if (savedHistory) setHistory(savedHistory)
      } catch (error) {
        console.error('Error cargando historial:', error)
      }
    }
    loadHistory()
  }, [])

  // FUNCIÓN GUARDAR
  const handleSave = async (): Promise<void> => {
    let path = currentPath

    // Si no hay archivo abierto, pedimos al usuario que elija dónde guardarlo
    if (!path) {
      try {
        // @ts-ignore Necesitamos un new path
        const newPath = await window.api.saveAs()
        if (!newPath) return // El usuario canceló el diálogo

        path = newPath
        setCurrentPath(newPath) // Actualizamos el estado con la nueva ruta
      } catch (error) {
        console.error('Error al elegir ruta:', error)
        return
      }
    }

    try {
      // @ts-ignore: Custom Electron API
      const result = await window.api.saveFile(path, content)

      if (result.success) {
        setIsDirty(false)

        // Extraemos el nombre para el historial
        const fileName = path.split(/[\\/]/).pop() || 'archivo'

        // @ts-ignore: Actualizamos el historial para que aparezca en la SideBar
        const updatedHistory = await window.api.saveToHistory({ name: fileName, path: path })
        setHistory(updatedHistory)

        toast.success('Archivo guardado con éxito!', {
          style: {
            background: '#18181b',
            color: '#d4d4d8',
            border: '1px solid #27272a'
          }
        })
      } else {
        toast.error('Error al guardar')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error crítico al guardar')
    }
  }

  // FUNCIÓN ABRIR
  const handleOpenFile = async (path: string): Promise<void> => {
    if (isDirty) {
      const confirm = window.confirm('Tienes cambios sin guardar. ¿Deseas descartarlos?')
      if (!confirm) return // Cancelamos la apertura
    }
    try {
      // @ts-ignore: Custom Electron API
      const fileContent = await window.api.openFile(path)
      setContent(fileContent)
      setIsDirty(false)
      setCurrentPath(path)

      const fileName = path.split(/[\\/]/).pop() || 'archivo'

      // @ts-ignore: Custom Electron API
      const updatedHistory = await window.api.saveToHistory({ name: fileName, path: path })
      setHistory(updatedHistory)
    } catch (error) {
      console.error('Error al abrir:', error)
    }
  }

  // FUNCIÓN SELECCIONAR NUEVO
  const handleSelectNewFile = async (): Promise<void> => {
    try {
      // @ts-ignore: Custom Electron API
      const path = await window.api.selectFile()
      if (path) {
        await handleOpenFile(path)
      }
    } catch (error) {
      console.error('Error al seleccionar archivo:', error)
    }
  }

  // DETECTAR CTRL + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [content, currentPath]) // Importante pasar las dependencias

  useEffect(() => {
    const fileName = currentPath ? currentPath.split(/[\\/]/).pop() : 'Sin título'
    document.title = `${fileName}${isDirty ? ' •' : ''} - Zink`
  }, [currentPath, isDirty])

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 overflow-hidden">
      {/* El Toaster debe estar aquí para que las notificaciones floten sobre la app */}
      <Toaster position="bottom-right" reverseOrder={false} />

      <SideBar files={history} onFileClick={handleOpenFile} onNewFileClick={handleSelectNewFile} />

      <main className="flex-1 flex flex-col bg-zinc-900/30">
        <header className="h-10 border-b border-zinc-800 flex items-center px-4 bg-zinc-950/50">
          <span className="text-[12px] font-mono text-zinc-500 truncate">
            {currentPath || 'Sin archivo'}
            {isDirty && <span className="ml-2 text-orange-500 font-bold">·</span>}
          </span>
        </header>

        <textarea
          className="flex-1 bg-transparent p-6 outline-none font-mono text-sm leading-relaxed resize-none text-zinc-200"
          value={content}
          onChange={(e): void => {
            setContent(e.target.value)
            if (!isDirty) {
              setIsDirty(true)
            }
          }}
          placeholder="Notepad-true++"
          spellCheck={false}
        />
      </main>
    </div>
  )
}
