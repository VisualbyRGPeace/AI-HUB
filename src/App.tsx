import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Toasts from './components/Toasts'
import Dialogs from './components/Dialogs'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Projects from './pages/Projects'
import Settings from './pages/Settings'
import Activity from './pages/Activity'
import Files from './pages/Files'
import Workspace from './pages/Workspace'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="projects" element={<Projects />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="workspace/:id" element={<Workspace />} />
          <Route path="files" element={<Files />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Dialogs />
      <Toasts />
    </ErrorBoundary>
  )
}
