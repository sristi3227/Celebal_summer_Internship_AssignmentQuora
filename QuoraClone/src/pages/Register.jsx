"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "./Auth.css"

function Register() {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match"
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters"
    }

    if (formData.displayName.length < 2) {
      return "Name must be at least 2 characters"
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setError("")
      setLoading(true)
      await signup(formData.email, formData.password, formData.displayName)
      navigate("/")
    } catch (error) {
      setError(error.message || "Failed to create account. Please try again.")
    }
    setLoading(false)
  }

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: "" }
    if (password.length < 6) return { strength: 1, text: "Weak" }
    if (password.length < 10) return { strength: 2, text: "Medium" }
    return { strength: 3, text: "Strong" }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">
              <div className="logo-icon">Q</div>
              <span className="logo-text">Quora</span>
            </div>
            <h1>Create your account</h1>
            <p>Join our community and start sharing knowledge</p>
          </div>

          {error && (
            <div className="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="displayName">Full name</label>
              <div className="input-container">
                
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="input-container">
               
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-container">
                
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Create a password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className={`strength-fill strength-${passwordStrength.strength}`}
                      style={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                    ></div>
                  </div>
                  <span className={`strength-text strength-${passwordStrength.strength}`}>{passwordStrength.text}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="input-container">
                
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-illustration">
          <div className="illustration-content">
            <h2>Start Your Journey</h2>
            <p>Join thousands of users sharing knowledge and learning together.</p>
            <div className="features">
              <div className="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                <span>Build Reputation</span>
              </div>
              <div className="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Join Community</span>
              </div>
              <div className="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <span>Learn & Grow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
