import { Outlet } from 'react-router-dom'
import LoginModal from './LoginModal'

export default function AuthModalLayout() {
  return (
    <>
      <Outlet />
      <LoginModal />
    </>
  )
}
