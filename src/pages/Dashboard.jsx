import { useAuth } from '../contexts/AuthContext'

function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-nav">
          <h1>Activities Dashboard</h1>
          <div className="user-menu">
            <span>Welcome, {user?.firstName || user?.username}!</span>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>My Activities</h3>
            <p>Create and manage your HTML activities</p>
            <div className="card-stats">
              <span className="stat-number">0</span>
              <span className="stat-label">Activities Created</span>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Activity Templates</h3>
            <p>Browse and use pre-built activity templates</p>
            <div className="card-stats">
              <span className="stat-number">3</span>
              <span className="stat-label">Templates Available</span>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Public Activities</h3>
            <p>View publicly shared activities from the community</p>
            <div className="card-stats">
              <span className="stat-number">0</span>
              <span className="stat-label">Public Activities</span>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-button primary">
              <span className="action-icon">+</span>
              Create New Activity
            </button>
            <button className="action-button">
              <span className="action-icon">📋</span>
              Browse Templates
            </button>
            <button className="action-button">
              <span className="action-icon">🌐</span>
              View Public Activities
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard