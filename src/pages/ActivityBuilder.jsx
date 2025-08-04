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
    contentType: 'quiz',
    isPublic: false,
    contentData: {
      type: 'quiz',
      questions: [
        {
          question: 'Sample question?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct: 0,
          explanation: 'This is why the answer is correct.'
        }
      ],
      settings: {
        showExplanations: true,
        allowRetry: true,
        shuffleQuestions: false
      }
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
        contentType: activity.content_type,
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

  const handleSlugChange = (e) => {
    let slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    setFormData(prev => ({ ...prev, slug }))
  }

  const handleQuestionChange = (questionIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      contentData: {
        ...prev.contentData,
        questions: prev.contentData.questions.map((q, i) =>
          i === questionIndex ? { ...q, [field]: value } : q
        )
      }
    }))
  }

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setFormData(prev => ({
      ...prev,
      contentData: {
        ...prev.contentData,
        questions: prev.contentData.questions.map((q, i) =>
          i === questionIndex 
            ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? value : opt) }
            : q
        )
      }
    }))
  }

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      contentData: {
        ...prev.contentData,
        questions: [
          ...prev.contentData.questions,
          {
            question: 'New question?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 0,
            explanation: ''
          }
        ]
      }
    }))
  }

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      contentData: {
        ...prev.contentData,
        questions: prev.contentData.questions.filter((_, i) => i !== index)
      }
    }))
  }

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      setError('Title and slug are required')
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
                Make this activity public
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>Quiz Questions</h2>
            
            {formData.contentData.questions.map((question, qIndex) => (
              <div key={qIndex} className="question-editor">
                <div className="question-header">
                  <h3>Question {qIndex + 1}</h3>
                  {formData.contentData.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="remove-question"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Question Text</label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                    placeholder="Enter your question"
                  />
                </div>

                <div className="form-group">
                  <label>Answer Options</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="option-editor">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                      />
                      <label className="correct-option">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correct === oIndex}
                          onChange={() => handleQuestionChange(qIndex, 'correct', oIndex)}
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label>Explanation (optional)</label>
                  <textarea
                    value={question.explanation}
                    onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                    placeholder="Explain why this answer is correct"
                    rows="2"
                  />
                </div>
              </div>
            ))}

            <button type="button" onClick={addQuestion} className="add-question">
              + Add Question
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityBuilder