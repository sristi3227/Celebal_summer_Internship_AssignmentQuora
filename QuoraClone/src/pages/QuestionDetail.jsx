"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
  getDocs,
  writeBatch,
} from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import AnswerCard from "../components/AnswerCard"
import VoteButtons from "../components/VoteButtons"
import "./QuestionDetail.css"

function QuestionDetail() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [newAnswer, setNewAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const questionDoc = await getDoc(doc(db, "questions", id))
        if (questionDoc.exists()) {
          const questionData = { id: questionDoc.id, ...questionDoc.data() }
          setQuestion(questionData)

          // Only increment view count if user hasn't viewed this question before
          if (currentUser) {
            const viewedBy = questionData.viewedBy || []
            const hasViewed = viewedBy.includes(currentUser.uid)

            if (!hasViewed) {
              try {
                await updateDoc(doc(db, "questions", id), {
                  views: increment(1),
                  viewedBy: [...viewedBy, currentUser.uid],
                })

                // Update local state to reflect the new view count
                setQuestion((prev) => ({
                  ...prev,
                  views: (prev.views || 0) + 1,
                  viewedBy: [...viewedBy, currentUser.uid],
                }))
              } catch (viewError) {
                console.error("Error updating view count:", viewError)
                // Continue without updating view count if it fails
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching question:", error)
      }
    }

    fetchQuestion()
  }, [id, currentUser])

  useEffect(() => {
    // Simplified query - get answers for this question and sort on client side
    const q = query(collection(db, "answers"), where("questionId", "==", id))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const answersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Sort on client side to avoid index requirement
      const sortedAnswers = answersData.sort((a, b) => {
        const aTime = a.createdAt?.toDate() || new Date(0)
        const bTime = b.createdAt?.toDate() || new Date(0)
        return bTime - aTime // Most recent first
      })

      setAnswers(sortedAnswers)
      setLoading(false)
    })

    return unsubscribe
  }, [id])

  const handleSubmitAnswer = async (e) => {
    e.preventDefault()

    if (!newAnswer.trim()) return

    try {
      setSubmitting(true)

      const answerData = {
        content: newAnswer.trim(),
        questionId: id,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        votes: [],
      }

      await addDoc(collection(db, "answers"), answerData)

      // Update question answer count
      await updateDoc(doc(db, "questions", id), {
        answerCount: increment(1),
      })

      setNewAnswer("")
    } catch (error) {
      console.error("Error submitting answer:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!question || question.authorId !== currentUser?.uid) {
      alert("You can only delete your own questions.")
      return
    }

    try {
      setDeleting(true)
      console.log("Starting deletion process...")
      console.log("Question author:", question.authorId)
      console.log("Current user:", currentUser?.uid)

      // Use batch operations for better performance and atomicity
      const batch = writeBatch(db)

      // Get all answers for this question
      const answersQuery = query(collection(db, "answers"), where("questionId", "==", id))
      const answersSnapshot = await getDocs(answersQuery)
      console.log("Found answers:", answersSnapshot.docs.length)

      // Get all answer IDs for reply deletion
      const answerIds = answersSnapshot.docs.map((doc) => doc.id)

      // Delete all answers
      answersSnapshot.docs.forEach((answerDoc) => {
        batch.delete(answerDoc.ref)
      })

      // Get and delete all replies for these answers
      if (answerIds.length > 0) {
        const repliesQuery = query(collection(db, "replies"), where("answerId", "in", answerIds))
        const repliesSnapshot = await getDocs(repliesQuery)
        console.log("Found replies:", repliesSnapshot.docs.length)

        repliesSnapshot.docs.forEach((replyDoc) => {
          batch.delete(replyDoc.ref)
        })
      }

      // Delete the question last
      batch.delete(doc(db, "questions", id))

      // Commit all deletions
      await batch.commit()

      console.log("Question and related data deleted successfully")

      // Navigate back to home
      navigate("/")
    } catch (error) {
      console.error("Detailed error deleting question:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)

      // More specific error messages
      if (error.code === "permission-denied") {
        alert(
          "Permission denied. Make sure you are the author of this question and your Firestore rules are correctly configured.",
        )
      } else if (error.code === "not-found") {
        alert("Question not found or already deleted.")
      } else {
        alert(`Failed to delete question: ${error.message}`)
      }
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading question...</div>
  }

  if (!question) {
    return <div className="error">Question not found</div>
  }

  return (
    <div className="question-detail">
      <div className="question-container">
        <div className="question-header">
          <div className="question-votes">
            <VoteButtons
              itemId={question.id}
              itemType="questions"
              initialUpvotes={question.upvotes || 0}
              initialDownvotes={question.downvotes || 0}
            />
          </div>

          <div className="question-content">
            <h1>{question.title}</h1>
            <div className="question-meta">
              <span>Asked by {question.authorName}</span>
              <span>•</span>
              <span>{new Date(question.createdAt?.toDate()).toLocaleDateString()}</span>
              <span>•</span>
              <span>{question.views || 0} views</span>
            </div>

            <div className="question-body">
              <p>{question.content}</p>
            </div>

            {question.authorId === currentUser?.uid && (
              <div className="question-actions">
                <button
                  className="delete-question-btn"
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete Question"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Delete Question
                </button>
              </div>
            )}

            {question.tags && question.tags.length > 0 && (
              <div className="question-tags">
                {question.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="answers-section">
          <h2>
            {answers.length} Answer{answers.length !== 1 ? "s" : ""}
          </h2>

          <form onSubmit={handleSubmitAnswer} className="answer-form">
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Write your answer..."
              className="answer-textarea"
              rows={6}
            />
            <button type="submit" disabled={submitting || !newAnswer.trim()} className="submit-answer-btn">
              {submitting ? "Posting..." : "Post Answer"}
            </button>
          </form>

          <div className="answers-list">
            {answers.map((answer) => (
              <AnswerCard key={answer.id} answer={answer} />
            ))}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Question</h3>
            <p>
              Are you sure you want to delete this question? This action cannot be undone and will also delete all
              answers and replies.
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="delete-btn" onClick={handleDeleteQuestion} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionDetail
