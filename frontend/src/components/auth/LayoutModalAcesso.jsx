import { Outlet } from 'react-router-dom'
import LoginModal from './LoginModal'

export default function LayoutModalAcesso() {
  return (
    <>
      <Outlet />
      <LoginModal />
    </>
  )
}
