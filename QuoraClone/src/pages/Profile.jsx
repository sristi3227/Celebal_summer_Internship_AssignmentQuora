"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import QuestionCard from "../components/QuestionCard"
import LoadingSpinner from "../components/LoadingSpinner"
import "./Profile.css"

function Profile() {
  const { userId } = useParams()
  const { currentUser } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [userQuestions, setUserQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState([])
  const [activeTab, setActiveTab] = useState("questions")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUpvotes: 0,
    totalViews: 0,
    questionsCount: 0,
    answersCount: 0,
  })

  const targetUserId = userId || currentUser?.uid
  const isOwnProfile = !userId || userId === currentUser?.uid

  useEffect(() => {
    const fetchUserData = async () => {
      if (!targetUserId) return

      try {
        // Fetch user profile data
        const userDoc = await getDoc(doc(db, "users", targetUserId))
        if (userDoc.exists()) {
          setProfileUser({ id: userDoc.id, ...userDoc.data() })
        } else if (isOwnProfile) {
          setProfileUser(currentUser)
        }

        // Fetch user's questions
        const questionsQuery = query(collection(db, "questions"), where("authorId", "==", targetUserId))
        const questionsSnapshot = await getDocs(questionsQuery)
        const questions = questionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const sortedQuestions = questions.sort((a, b) => {
          const aTime = a.createdAt?.toDate() || new Date(0)
          const bTime = b.createdAt?.toDate() || new Date(0)
          return bTime - aTime
        })
        setUserQuestions(sortedQuestions)

        // Fetch user's answers
        const answersQuery = query(collection(db, "answers"), where("authorId", "==", targetUserId))
        const answersSnapshot = await getDocs(answersQuery)
        const answers = answersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const sortedAnswers = answers.sort((a, b) => {
          const aTime = a.createdAt?.toDate() || new Date(0)
          const bTime = b.createdAt?.toDate() || new Date(0)
          return bTime - aTime
        })
        setUserAnswers(sortedAnswers)

        // Calculate stats
        const totalUpvotes =
          questions.reduce((sum, q) => sum + (q.upvotes || 0), 0) +
          answers.reduce((sum, a) => sum + (a.upvotes || 0), 0)
        const totalViews = questions.reduce((sum, q) => sum + (q.views || 0), 0)

        setStats({
          totalUpvotes,
          totalViews,
          questionsCount: questions.length,
          answersCount: answers.length,
        })
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [targetUserId, currentUser, isOwnProfile])

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />
  }

  if (!profileUser) {
    return (
      <div className="profile-error">
        <h2>User not found</h2>
        <p>The profile you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-banner">
          <div className="profile-info">
            <div className="profile-avatar">
              {(profileUser.displayName || profileUser.email || "U")[0].toUpperCase()}
            </div>
            <div className="profile-details">
              <h1 className="profile-name">{profileUser.displayName || "Anonymous User"}</h1>
              <p className="profile-email">{profileUser.email}</p>
              {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}
              <div className="profile-meta">
                <span>Joined {new Date(profileUser.createdAt?.toDate() || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.questionsCount}</div>
            <div className="stat-label">Questions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.answersCount}</div>
            <div className="stat-label">Answers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalUpvotes}</div>
            <div className="stat-label">Upvotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalViews}</div>
            <div className="stat-label">Views</div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === "questions" ? "active" : ""}`}
            onClick={() => setActiveTab("questions")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Questions ({userQuestions.length})
          </button>
          <button className={`tab ${activeTab === "answers" ? "active" : ""}`} onClick={() => setActiveTab("answers")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Answers ({userAnswers.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "questions" && (
            <div className="questions-tab">
              {userQuestions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <h3>No questions yet</h3>
                  <p>
                    {isOwnProfile
                      ? "Start asking questions to build your profile"
                      : "This user hasn't asked any questions yet"}
                  </p>
                </div>
              ) : (
                <div className="content-list">
                  {userQuestions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "answers" && (
            <div className="answers-tab">
              {userAnswers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <h3>No answers yet</h3>
                  <p>
                    {isOwnProfile
                      ? "Start answering questions to help the community"
                      : "This user hasn't answered any questions yet"}
                  </p>
                </div>
              ) : (
                <div className="answers-list">
                  {userAnswers.map((answer) => (
                    <div key={answer.id} className="answer-preview">
                      <div className="answer-content">
                        <p>{answer.content}</p>
                      </div>
                      <div className="answer-meta">
                        <div className="answer-stats">
                          <span className="upvotes">{answer.upvotes || 0} upvotes</span>
                          <span className="date">{new Date(answer.createdAt?.toDate()).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
