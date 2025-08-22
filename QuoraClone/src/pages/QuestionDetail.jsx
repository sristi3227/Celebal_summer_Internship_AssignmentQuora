"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
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
} from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"
import AnswerCard from "../components/AnswerCard"
import VoteButtons from "../components/VoteButtons"
import "./QuestionDetail.css"

function QuestionDetail() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const { createNotification } = useNotifications()
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [newAnswer, setNewAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const questionDoc = await getDoc(doc(db, "questions", id))
        if (questionDoc.exists()) {
          setQuestion({ id: questionDoc.id, ...questionDoc.data() })

          // Increment view count
          await updateDoc(doc(db, "questions", id), {
            views: increment(1),
          })
        }
      } catch (error) {
        console.error("Error fetching question:", error)
      }
    }

    fetchQuestion()
  }, [id])

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

      // Create notification for the question author
      if (question && question.authorId !== currentUser.uid) {
        await createNotification({
          type: "answer",
          recipientId: question.authorId,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.email,
          message: "answered your question",
          link: `/question/${id}`,
          entityId: id,
          entityType: "question",
        })
      }

      setNewAnswer("")
    } catch (error) {
      console.error("Error submitting answer:", error)
    } finally {
      setSubmitting(false)
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
    </div>
  )
}

export default QuestionDetail
