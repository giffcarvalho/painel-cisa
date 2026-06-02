import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Image as ImageIcon, FileSpreadsheet } from 'lucide-react'

export default function ExportMenu({ onExportPng, onExportExcel }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)


  useEffect(() => {    // Fecha o dropdown ao clicar fora
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        title="Opções de Exportação"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-xl z-50 py-1">
          <button 
            onClick={() => { setOpen(false); onExportPng(); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-blue-600" />
            Baixar Gráfico (PNG)
          </button>
          <button 
            onClick={() => { setOpen(false); onExportExcel(); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Exportar Dados (Excel)
          </button>
        </div>
      )}
    </div>
  )
}