import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Toasts from './components/Toasts'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="projects" element={<Placeholder title="Projects" phase={3} />} />
          <Route path="workspace" element={<Placeholder title="Workspace" phase={3} />} />
          <Route path="files" element={<Placeholder title="File Manager" phase={3} />} />
          <Route path="activity" element={<Placeholder title="Activity History" phase={3} />} />
          <Route path="settings" element={<Placeholder title="Settings" phase={5} />} />
          <Route path="*" element={<Placeholder title="Không tìm thấy trang" phase={1} />} />
        </Route>
      </Routes>
      <Toasts />
    </>
  )
}
