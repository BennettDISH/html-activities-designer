import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import activityService from '../services/activityService'

function Dashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({
    myActivities: 0,
    publicActivities: 0,
    totalViews: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    activityService.setAuthService({ getAuthHeaders: () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }) })
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const activities = await activityService.getActivities()
      
      // Calculate stats
      const myActivities = activities.filter(a => a.user_id === user.id)
      const publicActivities = activities.filter(a => a.is_public)
      
      setStats({
        myActivities: myActivities.length,
        publicActivities: publicActivities.length,
        totalViews: 0 // TODO: Add views tracking
      })
      
      // Get recent activities (last 5)
      setRecentActivities(myActivities.slice(0, 5))
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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
              <span className="stat-number">{loading ? '...' : stats.myActivities}</span>
              <span className="stat-label">Activities Created</span>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Public Activities</h3>
            <p>View publicly shared activities from the community</p>
            <div className="card-stats">
              <span className="stat-number">{loading ? '...' : stats.publicActivities}</span>
              <span className="stat-label">Public Activities</span>
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
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/activities/new" className="action-button primary">
              <span className="action-icon">+</span>
              Create New Activity
            </Link>
            <Link to="/activities" className="action-button">
              <span className="action-icon">📋</span>
              Manage Activities
            </Link>
            <Link to="/templates" className="action-button">
              <span className="action-icon">🎨</span>
              Browse Templates
            </Link>
          </div>
        </div>

        {recentActivities.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Activities</h2>
              <Link to="/activities" className="view-all-link">View All</Link>
            </div>
            <div className="recent-activities">
              {recentActivities.map(activity => (
                <div key={activity.id} className="recent-activity">
                  <div className="activity-info">
                    <h4>{activity.title}</h4>
                    <p>{activity.description || 'No description'}</p>
                    <div className="activity-meta">
                      <span className={`status-badge ${activity.is_public ? 'public' : 'private'}`}>
                        {activity.is_public ? 'Public' : 'Private'}
                      </span>
                      <span className="activity-slug">/{activity.slug}</span>
                    </div>
                  </div>
                  <div className="activity-actions">
                    <Link to={`/activities/edit/${activity.id}`} className="edit-link">
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard