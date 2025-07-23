"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import VoteButtons from "./VoteButtons"
import "./QuestionCard.css"

function QuestionCard({ question }) {
  const { currentUser } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser) return

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const followedQuestions = userData.followedQuestions || []
          setIsFollowing(followedQuestions.includes(question.id))
        }
      } catch (error) {
        console.error("Error checking follow status:", error)
      }
    }

    checkFollowStatus()
  }, [currentUser, question.id])

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date"
    const date = new Date(timestamp.toDate())
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const truncateContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  const handleFollowQuestion = async () => {
    if (!currentUser || followLoading) return

    setFollowLoading(true)
    try {
      const userRef = doc(db, "users", currentUser.uid)
      const userDoc = await getDoc(userRef)
      const userData = userDoc.exists() ? userDoc.data() : {}
      const followedQuestions = userData.followedQuestions || []

      if (followedQuestions.includes(question.id)) {
        // Unfollow question
        await updateDoc(userRef, {
          followedQuestions: arrayRemove(question.id),
          updatedAt: serverTimestamp(),
        })
        setIsFollowing(false)
      } else {
        // Follow question
        await updateDoc(userRef, {
          followedQuestions: arrayUnion(question.id),
          updatedAt: serverTimestamp(),
        })
        setIsFollowing(true)
      }
    } catch (error) {
      console.error("Error following question:", error)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/question/${question.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: question.title,
          text: question.content.substring(0, 100) + "...",
          url: url,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        // You could show a toast notification here
        alert("Link copied to clipboard!")
      } catch (error) {
        console.log("Error copying to clipboard:", error)
      }
    }
  }

  return (
    <article className="question-card">
      <div className="question-header">
        <div className="author-info">
          <div className="author-avatar">{(question.authorName || "U")[0].toUpperCase()}</div>
          <div className="author-details">
            <span className="author-name">{question.authorName}</span>
            <span className="question-date">{formatDate(question.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="question-content">
        <h2 className="question-title">
          <Link to={`/question/${question.id}`}>{question.title}</Link>
        </h2>

        <div className="question-body">
          <p>
            {isExpanded ? question.content : truncateContent(question.content)}
            {question.content.length > 200 && (
              <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? " Show less" : " Read more"}
              </button>
            )}
          </p>
        </div>

        {question.tags && question.tags.length > 0 && (
          <div className="question-tags">
            {question.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
            {question.tags.length > 3 && <span className="tag-more">+{question.tags.length - 3} more</span>}
          </div>
        )}
      </div>

      <div className="question-footer">
        <div className="question-stats">
          <VoteButtons
            itemId={question.id}
            itemType="questions"
            initialUpvotes={question.upvotes || 0}
            initialDownvotes={question.downvotes || 0}
            compact={true}
          />

          <Link to={`/question/${question.id}`} className="stat-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{question.answerCount || 0} answers</span>
          </Link>

          <div className="stat-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>{question.views || 0} views</span>
          </div>
        </div>

        <div className="question-actions">
          <button className="action-btn" onClick={handleShare}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16,6 12,2 8,6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            Share
          </button>
          <button
            className={`action-btn ${isFollowing ? "following" : ""}`}
            onClick={handleFollowQuestion}
            disabled={followLoading}
          >
            {followLoading ? (
              <div className="btn-spinner"></div>
            ) : isFollowing ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Following
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"></path>
                </svg>
                Follow
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

export default QuestionCard
