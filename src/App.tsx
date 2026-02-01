import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './lib/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MapPage from './pages/MapPage'
import NewListingPage from './pages/NewListingPage'
import MessagesPage from './pages/MessagesPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/listings/new" element={<NewListingPage />} />
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
