import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import activityService from '../services/activityService'

function Activities() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    activityService.setAuthService({ getAuthHeaders: () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }) })
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const data = await activityService.getActivities()
      setActivities(data)
    } catch (error) {
      setError('Failed to load activities')
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      await activityService.deleteActivity(id)
      setActivities(prev => prev.filter(activity => activity.id !== id))
    } catch (error) {
      setError('Failed to delete activity')
      console.error('Failed to delete activity:', error)
    }
  }

  const copyEmbedUrl = (slug) => {
    const embedUrl = `${window.location.origin}/api/embed/${slug}`
    navigator.clipboard.writeText(embedUrl).then(() => {
      alert('Embed URL copied to clipboard!')
    }).catch(() => {
      prompt('Copy this URL:', embedUrl)
    })
  }

  const copyEmbedScript = (slug) => {
    const embedScript = `<script src="${window.location.origin}/sdk/activities.js"></script>
<div id="activity-${slug}"></div>
<script>
  HTMLActivities.render('${slug}', 'activity-${slug}');
</script>`
    
    navigator.clipboard.writeText(embedScript).then(() => {
      alert('Embed code copied to clipboard!')
    }).catch(() => {
      prompt('Copy this code:', embedScript)
    })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading activities...</p>
      </div>
    )
  }

  return (
    <div className="activities-page">
      <div className="activities-header">
        <div className="activities-nav">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <h1>My Activities</h1>
          <Link to="/activities/new" className="create-button">
            + Create Activity
          </Link>
        </div>
      </div>

      <div className="activities-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>No Activities Yet</h2>
            <p>Create your first activity to get started with hosting e-learning content.</p>
            <Link to="/activities/new" className="cta-button primary">
              Create Your First Activity
            </Link>
          </div>
        ) : (
          <div className="activities-grid">
            {activities.map(activity => (
              <div key={activity.id} className="activity-card">
                <div className="activity-header">
                  <h3>{activity.title}</h3>
                  <div className="activity-status">
                    <span className={`status-badge ${activity.is_public ? 'public' : 'private'}`}>
                      {activity.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
                
                {activity.description && (
                  <p className="activity-description">{activity.description}</p>
                )}
                
                <div className="activity-meta">
                  <div className="meta-item">
                    <strong>Slug:</strong> <code>{activity.slug}</code>
                  </div>
                  <div className="meta-item">
                    <strong>Type:</strong> {activity.content_type}
                  </div>
                  <div className="meta-item">
                    <strong>Created:</strong> {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="activity-actions">
                  <Link to={`/activities/edit/${activity.id}`} className="action-button edit">
                    Edit
                  </Link>
                  <button
                    onClick={() => copyEmbedUrl(activity.slug)}
                    className="action-button copy"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => copyEmbedScript(activity.slug)}
                    className="action-button embed"
                  >
                    Copy Embed
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id, activity.title)}
                    className="action-button delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Activities