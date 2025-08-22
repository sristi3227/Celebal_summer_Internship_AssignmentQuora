"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import "./AskQuestion.css"

function AskQuestion() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)

      const questionData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        views: 0,
        viewedBy: [], // Initialize empty array for view tracking
        answerCount: 0,
        votes: [],
      }

      const docRef = await addDoc(collection(db, "questions"), questionData)
      navigate(`/question/${docRef.id}`)
    } catch (error) {
      console.error("Error creating question:", error)
      setError("Failed to create question. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="ask-question">
        <div className="auth-required">
          <h2>Please log in to ask a question</h2>
          <p>You need to be logged in to ask questions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ask-question">
      <div className="ask-question-container">
        <h1>Ask a Question</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="question-form">
          <div className="form-group">
            <label htmlFor="title">Question Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What's your question? Be specific and clear."
              maxLength={200}
              required
            />
            <small>{formData.title.length}/200 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="content">Question Details *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Provide more details about your question. Include what you've tried and what you're looking for."
              rows={8}
              maxLength={2000}
              required
            />
            <small>{formData.content.length}/2000 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (optional)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Add up to 5 tags separated by commas (e.g., javascript, react, programming)"
            />
            <small>Separate tags with commas. Max 5 tags.</small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate("/")} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Posting..." : "Post Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AskQuestion
