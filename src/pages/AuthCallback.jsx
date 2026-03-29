import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function AuthCallback() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const { ssoLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const savedState = sessionStorage.getItem('sso_state')

    if (!code) {
      setError('No authorization code received')
      return
    }

    if (state !== savedState) {
      setError('Invalid state parameter — possible CSRF attack')
      return
    }

    sessionStorage.removeItem('sso_state')

    ssoLogin(code)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(err => setError(err.error || 'SSO login failed'))
  }, [])

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <h1>Login Failed</h1>
            <div className="error-message">{error}</div>
            <a href="/login">Back to login</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Signing you in...</h1>
        </div>
      </div>
    </div>
  )
}

export default AuthCallback
