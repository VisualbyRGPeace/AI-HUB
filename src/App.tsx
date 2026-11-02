import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Toasts from './components/Toasts'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Projects from './pages/Projects'
import Settings from './pages/Settings'
import Activity from './pages/Activity'
import Workspace from './pages/Workspace'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="projects" element={<Projects />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="workspace/:id" element={<Workspace />} />
          <Route path="files" element={<Placeholder title="File Manager" phase={3} />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Placeholder title="Không tìm thấy trang" phase={1} />} />
        </Route>
      </Routes>
      <Toasts />
    </>
  )
}
