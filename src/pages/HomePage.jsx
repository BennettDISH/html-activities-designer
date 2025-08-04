import { useState, useEffect } from 'react'

function HomePage() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    setMessage('Hello World!')
  }, [])

  return (
    <div className="home-page">
      <header className="hero-section">
        <h1 className="hero-title">{message}</h1>
        <p className="hero-subtitle">Welcome to HTML Activities Designer</p>
        <div className="hero-description">
          <p>A powerful tool for creating interactive HTML-based educational activities and learning experiences.</p>
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