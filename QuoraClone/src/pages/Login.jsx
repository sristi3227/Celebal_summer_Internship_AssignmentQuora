"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "./Auth.css"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setError("")
      setLoading(true)
      await login(email, password)
      navigate("/")
    } catch (error) {
      setError(error.message || "Failed to log in. Please check your credentials.")
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">
              <div className="logo-icon">Q</div>
              <span className="logo-text">Quora</span>
            </div>
            <h1>Welcome back</h1>
            <p>Sign in to your account to continue</p>
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
              <label htmlFor="email">Email address</label>
              <div className="input-container">
                
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter your password"
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
            </div>

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-illustration">
          <div className="illustration-content">
            <h2>Join the Knowledge Community</h2>
            <p>Connect with experts, share insights, and discover answers to your questions.</p>
            <div className="features">
              <div className="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>Ask Questions</span>
              </div>
              <div className="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Share Knowledge</span>
              </div>
              <div className="feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Connect with Experts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
