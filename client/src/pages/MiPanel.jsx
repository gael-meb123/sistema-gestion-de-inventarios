import AdminPanel from './AdminPanel.jsx'
import UserPanel from './UserPanel.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function MiPanel() {
  const { user } = useAuth()

  if (user?.rol === 'admin') {
    return <AdminPanel />
  }

  return <UserPanel />
}

export default MiPanel
