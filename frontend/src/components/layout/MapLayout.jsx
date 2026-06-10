import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export default function MapLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8f7f5]">
      <Sidebar openOnClick />

      <main className="flex-1 min-w-0 h-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}