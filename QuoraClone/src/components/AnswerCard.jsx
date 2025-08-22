"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"
import VoteButtons from "./VoteButtons"
import ReplyCard from "./ReplyCard"
import "./AnswerCard.css"

function AnswerCard({ answer }) {
  const { currentUser } = useAuth()
  const { createNotification } = useNotifications()
  const [allReplies, setAllReplies] = useState([])
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  // Always listen for replies, not just when showReplies is true
  useEffect(() => {
    console.log("Setting up replies listener for answer:", answer.id)

    const q = query(collection(db, "replies"), where("answerId", "==", answer.id))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const repliesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        console.log("Fetched replies for answer", answer.id, ":", repliesData)
        setAllReplies(repliesData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching replies:", error)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [answer.id]) // Remove showReplies dependency

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date"
    return new Date(timestamp.toDate()).toLocaleDateString()
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()

    // Prevent double submission
    if (!replyContent.trim() || submitting) {
      console.log("Preventing submission - submitting:", submitting, "content:", replyContent.trim())
      return
    }

    try {
      setSubmitting(true)
      console.log("Starting reply submission...")

      const replyData = {
        content: replyContent.trim(),
        answerId: answer.id,
        questionId: answer.questionId,
        parentReplyId: null, // Top-level reply
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        votes: [],
      }

      console.log("Submitting reply data:", replyData)

      const docRef = await addDoc(collection(db, "replies"), replyData)
      console.log("Reply created successfully with ID:", docRef.id)

      // Create notification for the answer author
      if (answer.authorId !== currentUser.uid) {
        await createNotification({
          type: "reply",
          recipientId: answer.authorId,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.email,
          message: "replied to your answer",
          link: `/question/${answer.questionId}`,
          entityId: answer.id,
          entityType: "answer",
        })
      }

      // Clear form and close it
      setReplyContent("")
      setShowReplyForm(false)

      // Show replies if they weren't already visible
      if (!showReplies) {
        setShowReplies(true)
      }
    } catch (error) {
      console.error("Error submitting reply:", error)
      alert(`Failed to post reply: ${error.message}`)
    } finally {
      setSubmitting(false)
      console.log("Reply submission completed")
    }
  }

  // Get only top-level replies (no parentReplyId)
  const topLevelReplies = allReplies
    .filter((reply) => !reply.parentReplyId)
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate() || new Date(0)
      const bTime = b.createdAt?.toDate() || new Date(0)
      return aTime - bTime
    })

  const totalRepliesCount = allReplies.length

  return (
    <div className="answer-card">
      <div className="answer-votes">
        <VoteButtons
          itemId={answer.id}
          itemType="answers"
          initialUpvotes={answer.upvotes || 0}
          initialDownvotes={answer.downvotes || 0}
        />
      </div>

      <div className="answer-content">
        <div className="answer-text">
          <p>{answer.content}</p>
        </div>

        <div className="answer-footer">
          <div className="answer-meta">
            <span>answered by {answer.authorName}</span>
            <span>•</span>
            <span>{formatDate(answer.createdAt)}</span>
          </div>

          <div className="answer-actions">
            <button className="reply-toggle-btn" onClick={() => setShowReplies(!showReplies)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {showReplies ? "Hide" : "Show"} Replies ({totalRepliesCount})
            </button>

            <button className="add-reply-btn" onClick={() => setShowReplyForm(!showReplyForm)} disabled={submitting}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              {submitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>

        {showReplyForm && (
          <form onSubmit={handleSubmitReply} className="reply-form">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply to this answer..."
              className="reply-textarea"
              rows={4}
              maxLength={1000}
              required
              disabled={submitting}
            />
            <div className="reply-form-actions">
              <span className="char-count">{replyContent.length}/1000</span>
              <div className="form-buttons">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false)
                    setReplyContent("")
                  }}
                  className="cancel-btn"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting || replyContent.trim().length === 0} className="submit-btn">
                  {submitting ? "Posting..." : "Post Reply"}
                </button>
              </div>
            </div>
          </form>
        )}

        {showReplies && (
          <div className="replies-section">
            {loading ? (
              <div className="replies-loading">
                <div className="loading-spinner"></div>
                <span>Loading replies...</span>
              </div>
            ) : totalRepliesCount === 0 ? (
              <div className="no-replies">
                <p>No replies yet. Be the first to reply!</p>
              </div>
            ) : (
              <div className="replies-list">
                <h4 className="replies-title">
                  {totalRepliesCount} {totalRepliesCount === 1 ? "Reply" : "Replies"}
                </h4>
                {topLevelReplies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    onReplyAdded={() => console.log("Nested reply added")}
                    level={0}
                    allReplies={allReplies}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AnswerCard
