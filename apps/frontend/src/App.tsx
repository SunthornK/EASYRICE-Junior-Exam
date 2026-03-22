import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HistoryPage from './pages/HistoryPage'
import CreatePage from './pages/CreatePage'
import ViewPage from './pages/ViewPage'
import EditPage from './pages/EditPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/history" replace />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/history/:id" element={<ViewPage />} />
        <Route path="/history/:id/edit" element={<EditPage />} />
      </Route>
    </Routes>
  )
}
