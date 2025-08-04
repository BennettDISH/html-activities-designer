import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Activities from './pages/Activities'
import ActivityBuilder from './pages/ActivityBuilder'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/activities" 
              element={
                <ProtectedRoute>
                  <Activities />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/activities/new" 
              element={
                <ProtectedRoute>
                  <ActivityBuilder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/activities/edit/:id" 
              element={
                <ProtectedRoute>
                  <ActivityBuilder />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App