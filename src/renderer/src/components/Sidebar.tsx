import { FileText, Plus, History } from 'lucide-react'
import { JSX } from 'react'

interface FileEntry {
  name: string
  path: string
}

interface SideBarProps {
  files: FileEntry[]
  onFileClick: (path: string) => void
  onNewFileClick: () => void // Nueva funcion
}

export function SideBar({ files, onFileClick, onNewFileClick }: SideBarProps): JSX.Element {
  return (
    <aside className="w-72 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/*Creamos la cabecera de la SideBar*/}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <History size={14} /> Historial
        </h2>
        <button
          onClick={onNewFileClick}
          className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-blue-400 transition"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Lista de archivos (Tu Array) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.length === 0 ? (
          <p className="text-zinc-600 text-xs p-4 italic text-center">No hay archivos recientes</p>
        ) : (
          files.map((file) => (
            <button
              key={file.path}
              onClick={() => onFileClick(file.path)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 group transition text-left"
            >
              <FileText size={16} className="text-zinc-500 group-hover:text-blue-400" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm text-zinc-300 truncate font-medium">{file.name}</span>
                <span className="text-[10px] text-zinc-600 truncate italic">{file.path}</span>
              </div>
            </button>
          ))
        )}
      </div>
      <footer className="w-full, flex items-center p-3 justify-center">
        <p>Version beta 0.1</p>
      </footer>
    </aside>
  )
}
