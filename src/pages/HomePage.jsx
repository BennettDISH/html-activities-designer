import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function HomePage() {
  const [message, setMessage] = useState('Loading...')
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    setMessage('HTML Activities Designer')
  }, [])

  return (
    <div className="home-page">
      <header className="hero-section">
        <h1 className="hero-title">{message}</h1>
        <p className="hero-subtitle">Create and Host Interactive E-Learning Activities</p>
        <div className="hero-description">
          <p>Build HTML activities once, host them centrally, and let clients update content dynamically without touching code.</p>
        </div>
        
        <div className="hero-actions">
          {isAuthenticated ? (
            <div className="authenticated-actions">
              <p className="welcome-text">Welcome back, {user?.firstName || user?.username}!</p>
              <Link to="/dashboard" className="cta-button primary">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="auth-actions">
              <Link to="/register" className="cta-button primary">
                Get Started Free
              </Link>
              <Link to="/login" className="cta-button secondary">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </header>
      
      <main className="main-content">
        <section className="features">
          <div className="feature-card">
            <h3>Interactive Activities</h3>
            <p>Create engaging HTML activities with drag-and-drop functionality</p>
          </div>
          <div className="feature-card">
            <h3>Educational Tools</h3>
            <p>Build quizzes, assessments, and learning modules</p>
          </div>
          <div className="feature-card">
            <h3>Responsive Design</h3>
            <p>Activities work seamlessly across all devices</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HomePage