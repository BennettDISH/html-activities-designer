import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import activityService from '../services/activityService'

function ActivityBuilder() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    contentType: 'text',
    isPublic: false,
    contentData: {
      type: 'text',
      content: '<h2>Your Content Title</h2>\n<p>Add your HTML content here...</p>'
    }
  })

  useEffect(() => {
    activityService.setAuthService({ getAuthHeaders: () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }) })
    loadTemplates()
    
    if (id) {
      loadActivity()
    }
  }, [id])

  const loadTemplates = async () => {
    try {
      const templatesData = await activityService.getTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadActivity = async () => {
    try {
      setLoading(true)
      const activity = await activityService.getActivity(id)
      setFormData({
        title: activity.title,
        description: activity.description || '',
        slug: activity.slug,
        contentType: 'text',
        isPublic: activity.is_public,
        contentData: activity.content_data
      })
    } catch (error) {
      setError('Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleTextContentChange = (e) => {
    setFormData(prev => ({
      ...prev,
      contentData: {
        ...prev.contentData,
        content: e.target.value
      }
    }))
  }

  const handleSlugChange = (e) => {
    let slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    setFormData(prev => ({ ...prev, slug }))
  }


  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      setError('Title and slug are required')
      return
    }

    if (!formData.contentData.content?.trim()) {
      setError('Content is required')
      return
    }

    try {
      setSaving(true)
      setError('')

      if (id) {
        await activityService.updateActivity(id, formData)
      } else {
        await activityService.createActivity(formData)
      }

      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading activity...</p>
      </div>
    )
  }

  return (
    <div className="activity-builder">
      <div className="builder-header">
        <div className="builder-nav">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <h1>{id ? 'Edit Activity' : 'Create New Activity'}</h1>
          <div className="builder-actions">
            <button onClick={handleSave} disabled={saving} className="save-button">
              {saving ? 'Saving...' : 'Save Activity'}
            </button>
            {formData.slug && (
              <div className="embed-info">
                <span className="embed-label">Embed URL:</span>
                <code className="embed-url">
                  {window.location.origin}/api/embed/{formData.slug}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="builder-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="builder-form">
          <div className="form-section">
            <h2>Activity Details</h2>
            
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter activity title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this activity is about"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="slug">URL Slug *</label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="activity-url-slug"
                required
              />
              <small>This will be the URL for embedding: /api/embed/{formData.slug}</small>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                Make this activity public (required for embedding)
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>HTML Content</h2>
            
            <div className="form-group">
              <label htmlFor="textContent">Content *</label>
              <textarea
                id="textContent"
                value={formData.contentData.content || ''}
                onChange={handleTextContentChange}
                placeholder="Enter your HTML content here..."
                rows="15"
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}
                required
              />
              <small>You can use HTML tags for formatting: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, etc.</small>
            </div>

            <div className="content-preview" style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              marginTop: '20px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3>Content Preview:</h3>
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formData.contentData.content || '<p>Your content preview will appear here...</p>' 
                }}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  padding: '15px',
                  backgroundColor: 'white',
                  minHeight: '200px'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityBuilder