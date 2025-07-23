"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import "./AskQuestion.css"

function AskQuestion() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      setError("Please fill in all required fields")
      return
    }

    if (title.length > 200) {
      setError("Question title must be 200 characters or less")
      return
    }

    if (content.length > 5000) {
      setError("Question content must be 5000 characters or less")
      return
    }

    try {
      setLoading(true)
      setError("")

      const questionData = {
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
          .slice(0, 5), // Limit to 5 tags
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        answerCount: 0,
        views: 0,
        votes: [], // Array to track user votes
      }

      const docRef = await addDoc(collection(db, "questions"), questionData)

      // Update user's question count
      await updateDoc(doc(db, "users", currentUser.uid), {
        questionsCount: increment(1),
        updatedAt: serverTimestamp(),
      })

      navigate(`/question/${docRef.id}`)
    } catch (error) {
      console.error("Error posting question:", error)
      if (error.code === "permission-denied") {
        setError("You don't have permission to post questions. Please make sure you're logged in.")
      } else {
        setError("Failed to post question. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ask-question">
      <div className="ask-container">
        <h1>Ask a Question</h1>
        <p>Share your question with the community and get helpful answers</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="question-form">
          <div className="form-group">
            <label htmlFor="title">Question Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question? Be specific."
              className="form-input"
              maxLength={200}
            />
            <small className="char-count">{title.length}/200</small>
          </div>

          <div className="form-group">
            <label htmlFor="content">Question Details *</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide more details about your question..."
              className="form-textarea"
              rows={8}
              maxLength={5000}
            />
            <small className="char-count">{content.length}/5000</small>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (optional)</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add up to 5 tags separated by commas (e.g., javascript, react, programming)"
              className="form-input"
            />
            <small className="help-text">Tags help others find your question (max 5 tags)</small>
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
