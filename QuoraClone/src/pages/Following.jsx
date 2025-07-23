"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import QuestionCard from "../components/QuestionCard"
import LoadingSpinner from "../components/LoadingSpinner"
import "./Following.css"
import { useUserData } from "../hooks/useUserData"

function Following() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState("questions")
  const [loading, setLoading] = useState(true)
  const [followedTopics, setFollowedTopics] = useState([])
  const [followingQuestions, setFollowingQuestions] = useState([])
  const [topicStats, setTopicStats] = useState({})
  const [recentActivity, setRecentActivity] = useState([])

  const { userData } = useUserData()

  useEffect(() => {
    if (!userData) {
      setFollowedTopics([])
      setFollowingQuestions([])
      setRecentActivity([])
      setTopicStats({})
      setLoading(false)
      return
    }

    const userFollowedTopics = userData.followedTopics || []
    setFollowedTopics(userFollowedTopics)

    if (userFollowedTopics.length === 0) {
      setFollowingQuestions([])
      setRecentActivity([])
      setTopicStats({})
      setLoading(false)
      return
    }

    // Set up real-time listener for questions
    const questionsRef = collection(db, "questions")
    const unsubscribe = onSnapshot(questionsRef, (snapshot) => {
      const allQuestions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Filter questions that have tags matching followed topics
      const relevantQuestions = allQuestions
        .filter((question) => question.tags && question.tags.some((tag) => userFollowedTopics.includes(tag)))
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate() || new Date(0)
          const bTime = b.createdAt?.toDate() || new Date(0)
          return bTime - aTime
        })

      setFollowingQuestions(relevantQuestions)

      // Calculate topic statistics
      const stats = {}
      userFollowedTopics.forEach((topic) => {
        const topicQuestions = allQuestions.filter((q) => q.tags && q.tags.includes(topic))
        stats[topic] = {
          questionCount: topicQuestions.length,
          totalUpvotes: topicQuestions.reduce((sum, q) => sum + (q.upvotes || 0), 0),
          recentQuestions: topicQuestions.slice(0, 3),
        }
      })
      setTopicStats(stats)

      // Get recent activity (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentQuestions = relevantQuestions.filter((q) => q.createdAt?.toDate() > weekAgo).slice(0, 10)
      setRecentActivity(recentQuestions)

      setLoading(false)
    })

    return unsubscribe
  }, [userData])

  if (loading) {
    return <LoadingSpinner text="Loading your feed..." />
  }

  if (followedTopics.length === 0) {
    return (
      <div className="following-page">
        <div className="following-header">
          <h1>Your Following Feed</h1>
          <p>Follow topics to see related questions and activity here</p>
        </div>

        <div className="empty-following">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3>Start following topics</h3>
          <p>Discover interesting topics and follow them to see related content in your personalized feed.</p>

          <div className="suggested-topics">
            <h4>Popular topics to follow:</h4>
            <div className="topic-suggestions">
              {["JavaScript", "React", "Python", "Technology", "Programming", "Career"].map((topic) => (
                <span key={topic} className="suggested-topic">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <a href="/topics" className="explore-topics-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            Explore Topics
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="following-page">
      <div className="following-header">
        <h1>Your Following Feed</h1>
        <p>Questions and activity from {followedTopics.length} topics you follow</p>

        <div className="following-summary">
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-number">{followingQuestions.length}</span>
              <span className="stat-label">Questions</span>
            </div>
            <div className="summary-stat">
              <span className="stat-number">{recentActivity.length}</span>
              <span className="stat-label">This Week</span>
            </div>
            <div className="summary-stat">
              <span className="stat-number">{followedTopics.length}</span>
              <span className="stat-label">Topics</span>
            </div>
          </div>
        </div>

        <div className="following-tabs">
          <button
            className={`tab ${activeTab === "questions" ? "active" : ""}`}
            onClick={() => setActiveTab("questions")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            All Questions ({followingQuestions.length})
          </button>
          <button className={`tab ${activeTab === "recent" ? "active" : ""}`} onClick={() => setActiveTab("recent")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            Recent Activity ({recentActivity.length})
          </button>
          <button className={`tab ${activeTab === "topics" ? "active" : ""}`} onClick={() => setActiveTab("topics")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            My Topics ({followedTopics.length})
          </button>
        </div>
      </div>

      <div className="following-content">
        {activeTab === "questions" && (
          <div className="questions-feed">
            {followingQuestions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h3>No questions yet</h3>
                <p>Questions from your followed topics will appear here</p>
              </div>
            ) : (
              followingQuestions.map((question) => <QuestionCard key={question.id} question={question} />)
            )}
          </div>
        )}

        {activeTab === "recent" && (
          <div className="recent-activity">
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                </div>
                <h3>No recent activity</h3>
                <p>Recent questions from your followed topics will appear here</p>
              </div>
            ) : (
              recentActivity.map((question) => <QuestionCard key={question.id} question={question} />)
            )}
          </div>
        )}

        {activeTab === "topics" && (
          <div className="topics-overview">
            <div className="topics-grid">
              {followedTopics.map((topic) => (
                <div key={topic} className="topic-overview-card">
                  <div className="topic-header">
                    <h3>{topic}</h3>
                    <div className="topic-stats">
                      <span>{topicStats[topic]?.questionCount || 0} questions</span>
                      <span>{topicStats[topic]?.totalUpvotes || 0} upvotes</span>
                    </div>
                  </div>

                  {topicStats[topic]?.recentQuestions?.length > 0 && (
                    <div className="recent-questions">
                      <h4>Recent questions:</h4>
                      <ul>
                        {topicStats[topic].recentQuestions.map((q) => (
                          <li key={q.id}>
                            <a href={`/question/${q.id}`}>{q.title}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Following
