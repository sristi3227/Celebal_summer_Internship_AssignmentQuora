"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore"
import { db } from "../firebase/config"
import QuestionCard from "../components/QuestionCard"
import LoadingSpinner from "../components/LoadingSpinner"
import "./Home.css"

function Home() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("recent") // recent, popular, unanswered

  useEffect(() => {
    let q

    switch (filter) {
      case "popular":
        q = query(collection(db, "questions"), orderBy("upvotes", "desc"), limit(20))
        break
      case "unanswered":
        q = query(collection(db, "questions"), orderBy("createdAt", "desc"), limit(20))
        break
      default:
        q = query(collection(db, "questions"), orderBy("createdAt", "desc"), limit(20))
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Filter unanswered questions on client side
      if (filter === "unanswered") {
        questionsData = questionsData.filter((q) => (q.answerCount || 0) === 0)
      }

      setQuestions(questionsData)
      setLoading(false)
    })

    return unsubscribe
  }, [filter])

  if (loading) {
    return <LoadingSpinner text="Loading questions..." />
  }

  return (
    <div className="home">
      <div className="home-header">
        <h1>Questions for you</h1>
        <div className="filter-tabs">
          <button className={`filter-tab ${filter === "recent" ? "active" : ""}`} onClick={() => setFilter("recent")}>
            Recent
          </button>
          <button className={`filter-tab ${filter === "popular" ? "active" : ""}`} onClick={() => setFilter("popular")}>
            Popular
          </button>
          <button
            className={`filter-tab ${filter === "unanswered" ? "active" : ""}`}
            onClick={() => setFilter("unanswered")}
          >
            Unanswered
          </button>
        </div>
      </div>

      <div className="questions-feed">
        {questions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3>No questions found</h3>
            <p>Be the first to ask a question in this category!</p>
          </div>
        ) : (
          questions.map((question) => <QuestionCard key={question.id} question={question} />)
        )}
      </div>
    </div>
  )
}

export default Home
