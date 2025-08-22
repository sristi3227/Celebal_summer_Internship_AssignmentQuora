"use client"

import { useState } from "react"
import { addDoc, collection, serverTimestamp, doc, deleteDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"
import VoteButtons from "./VoteButtons"
import "./ReplyCard.css"

function ReplyCard({ reply, onReplyAdded, level = 0, allReplies = [] }) {
  const { currentUser } = useAuth()
  const { createNotification } = useNotifications()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showNestedReplies, setShowNestedReplies] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffMinutes = Math.ceil(diffTime / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.ceil(diffMinutes / 60)}h ago`
    return `${Math.ceil(diffMinutes / 1440)}d ago`
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()

    // Prevent double submission
    if (!replyContent.trim() || submitting) {
      console.log("Preventing nested reply submission - submitting:", submitting, "content:", replyContent.trim())
      return
    }

    try {
      setSubmitting(true)
      console.log("Starting nested reply submission...")

      const newReply = {
        content: replyContent.trim(),
        answerId: reply.answerId,
        questionId: reply.questionId,
        parentReplyId: reply.id, // This makes it a nested reply
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        votes: [],
      }

      console.log("Submitting nested reply:", newReply)

      const docRef = await addDoc(collection(db, "replies"), newReply)
      console.log("Nested reply created successfully with ID:", docRef.id)

      // Create notification for the reply author
      if (reply.authorId !== currentUser.uid) {
        await createNotification({
          type: "reply",
          recipientId: reply.authorId,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.email,
          message: "replied to your comment",
          link: `/question/${reply.questionId}`,
          entityId: reply.id,
          entityType: "reply",
        })
      }

      setReplyContent("")
      setShowReplyForm(false)

      if (onReplyAdded) {
        onReplyAdded()
      }
    } catch (error) {
      console.error("Error submitting nested reply:", error)
      alert(`Failed to post reply: ${error.message}`)
    } finally {
      setSubmitting(false)
      console.log("Nested reply submission completed")
    }
  }

  const handleDeleteReply = async () => {
    if (!currentUser || deleting) return

    try {
      setDeleting(true)
      console.log("Deleting reply:", reply.id)

      // Delete the reply document
      await deleteDoc(doc(db, "replies", reply.id))

      console.log("Reply deleted successfully")
      setShowDeleteConfirm(false)

      if (onReplyAdded) {
        onReplyAdded() // Trigger refresh
      }
    } catch (error) {
      console.error("Error deleting reply:", error)
      alert(`Failed to delete reply: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Get nested replies for this reply
  const nestedReplies = allReplies
    .filter((r) => r.parentReplyId === reply.id)
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate() || new Date(0)
      const bTime = b.createdAt?.toDate() || new Date(0)
      return aTime - bTime
    })

  const maxNestingLevel = 3 // Limit nesting to prevent infinite depth
  const isOwnReply = currentUser && reply.authorId === currentUser.uid

  return (
    <div className={`reply-card level-${Math.min(level, maxNestingLevel)}`}>
      <div className="reply-content">
        <div className="reply-header">
          <div className="author-info">
            <div className="author-avatar">{(reply.authorName || "U")[0].toUpperCase()}</div>
            <div className="author-details">
              <span className="author-name">{reply.authorName}</span>
              <span className="reply-date">{formatDate(reply.createdAt)}</span>
            </div>
          </div>

          {/* Delete button for own replies */}
          {isOwnReply && (
            <div className="reply-menu">
              <button
                className="delete-reply-btn"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                title="Delete reply"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="reply-text">
          <p>{reply.content}</p>
        </div>

        <div className="reply-actions">
          <VoteButtons
            itemId={reply.id}
            itemType="replies"
            initialUpvotes={reply.upvotes || 0}
            initialDownvotes={reply.downvotes || 0}
            compact={true}
          />

          {level < maxNestingLevel && (
            <button className="reply-btn" onClick={() => setShowReplyForm(!showReplyForm)} disabled={submitting}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {submitting ? "Posting..." : "Reply"}
            </button>
          )}

          {nestedReplies.length > 0 && (
            <button className="toggle-replies-btn" onClick={() => setShowNestedReplies(!showNestedReplies)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points={showNestedReplies ? "18,15 12,9 6,15" : "6,9 12,15 18,9"}></polyline>
              </svg>
              {showNestedReplies ? "Hide" : "Show"} {nestedReplies.length}{" "}
              {nestedReplies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="delete-confirmation">
            <div className="delete-modal">
              <h4>Delete Reply</h4>
              <p>Are you sure you want to delete this reply? This action cannot be undone.</p>
              <div className="delete-actions">
                <button className="cancel-delete-btn" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Cancel
                </button>
                <button className="confirm-delete-btn" onClick={handleDeleteReply} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showReplyForm && (
          <form onSubmit={handleSubmitReply} className="reply-form">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="reply-textarea"
              rows={3}
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
                  {submitting ? "Posting..." : "Reply"}
                </button>
              </div>
            </div>
          </form>
        )}

        {showNestedReplies && nestedReplies.length > 0 && (
          <div className="nested-replies">
            {nestedReplies.map((nestedReply) => (
              <ReplyCard
                key={nestedReply.id}
                reply={nestedReply}
                onReplyAdded={onReplyAdded}
                level={level + 1}
                allReplies={allReplies}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReplyCard
