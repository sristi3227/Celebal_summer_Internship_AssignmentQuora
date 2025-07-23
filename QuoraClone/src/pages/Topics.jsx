"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import "./Topics.css"
import { useUserData } from "../hooks/useUserData"

function Topics() {
  const { currentUser } = useAuth()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [followedTopics, setFollowedTopics] = useState(new Set())
  const [followingLoading, setFollowingLoading] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("popular") // popular, alphabetical, recent
  const { userData } = useUserData()

  // Remove the separate useEffect for checking followed topics and update the main useEffect:

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const questionsSnapshot = await getDocs(collection(db, "questions"))
        const allTags = new Map()
        const topicDetails = new Map()

        questionsSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.tags) {
            data.tags.forEach((tag) => {
              if (allTags.has(tag)) {
                const current = allTags.get(tag)
                allTags.set(tag, current + 1)
                // Update latest activity
                const currentDetails = topicDetails.get(tag)
                if (!currentDetails.latestActivity || data.createdAt?.toDate() > currentDetails.latestActivity) {
                  topicDetails.set(tag, {
                    ...currentDetails,
                    latestActivity: data.createdAt?.toDate(),
                    totalUpvotes: currentDetails.totalUpvotes + (data.upvotes || 0),
                  })
                }
              } else {
                allTags.set(tag, 1)
                topicDetails.set(tag, {
                  latestActivity: data.createdAt?.toDate(),
                  totalUpvotes: data.upvotes || 0,
                  description: getTopicDescription(tag),
                })
              }
            })
          }
        })

        const topicsArray = Array.from(allTags.entries()).map(([name, count]) => ({
          name,
          count,
          ...topicDetails.get(name),
        }))

        // Sort topics
        if (sortBy === "popular") {
          topicsArray.sort((a, b) => b.count - a.count)
        } else if (sortBy === "alphabetical") {
          topicsArray.sort((a, b) => a.name.localeCompare(b.name))
        } else if (sortBy === "recent") {
          topicsArray.sort((a, b) => (b.latestActivity || new Date(0)) - (a.latestActivity || new Date(0)))
        }

        setTopics(topicsArray)
      } catch (error) {
        console.error("Error fetching topics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopics()
  }, [sortBy])

  // Add separate useEffect to update followed topics when userData changes:
  useEffect(() => {
    if (userData) {
      setFollowedTopics(new Set(userData.followedTopics || []))
    } else {
      setFollowedTopics(new Set())
    }
  }, [userData])

  const getTopicDescription = (topic) => {
    const descriptions = {
      javascript: "Programming language for web development",
      react: "JavaScript library for building user interfaces",
      python: "High-level programming language",
      technology: "Latest tech trends and innovations",
      programming: "Software development and coding",
      web: "Web development and design",
      mobile: "Mobile app development",
      ai: "Artificial Intelligence and Machine Learning",
      career: "Professional development and career advice",
      startup: "Entrepreneurship and startup culture",
      design: "UI/UX and graphic design",
      business: "Business strategy and management",
    }
    return descriptions[topic.toLowerCase()] || `Discussion about ${topic}`
  }

  const toggleFollowTopic = async (topicName) => {
    if (!currentUser || followingLoading.has(topicName)) return

    setFollowingLoading((prev) => new Set([...prev, topicName]))

    try {
      const userRef = doc(db, "users", currentUser.uid)
      const isFollowing = followedTopics.has(topicName)

      if (isFollowing) {
        await updateDoc(userRef, {
          followedTopics: arrayRemove(topicName),
          updatedAt: serverTimestamp(),
        })
        setFollowedTopics((prev) => {
          const newSet = new Set(prev)
          newSet.delete(topicName)
          return newSet
        })
      } else {
        await updateDoc(userRef, {
          followedTopics: arrayUnion(topicName),
          updatedAt: serverTimestamp(),
        })
        setFollowedTopics((prev) => new Set([...prev, topicName]))
      }
    } catch (error) {
      console.error("Error toggling topic follow:", error)
      // Revert the optimistic update on error
      // You could show a toast notification here
    } finally {
      setFollowingLoading((prev) => {
        const newSet = new Set(prev)
        newSet.delete(topicName)
        return newSet
      })
    }
  }

  const filteredTopics = topics.filter((topic) => topic.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) {
    return <LoadingSpinner text="Loading topics..." />
  }

  return (
    <div className="topics-page">
      <div className="topics-header">
        <h1>Discover Topics</h1>
        <p>Follow topics that interest you to see related questions in your feed</p>

        <div className="topics-controls">
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="popular">Most Popular</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="recent">Recently Active</option>
          </select>
        </div>

        {followedTopics.size > 0 && (
          <div className="followed-topics-summary">
            <h3>You're following {followedTopics.size} topics</h3>
            <div className="followed-tags">
              {Array.from(followedTopics)
                .slice(0, 5)
                .map((topic) => (
                  <span key={topic} className="followed-tag">
                    {topic}
                  </span>
                ))}
              {followedTopics.size > 5 && <span className="more-count">+{followedTopics.size - 5} more</span>}
            </div>
          </div>
        )}
      </div>

      <div className="topics-grid">
        {filteredTopics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </div>
            <h3>{searchQuery ? "No topics found" : "No topics yet"}</h3>
            <p>
              {searchQuery ? "Try different keywords" : "Topics will appear here as questions are posted with tags"}
            </p>
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <div key={topic.name} className="topic-card">
              <div className="topic-header">
                <h3 className="topic-name">{topic.name}</h3>
                <button
                  className={`follow-btn ${followedTopics.has(topic.name) ? "following" : ""}`}
                  onClick={() => toggleFollowTopic(topic.name)}
                  disabled={followingLoading.has(topic.name)}
                >
                  {followingLoading.has(topic.name) ? (
                    <div className="btn-spinner"></div>
                  ) : followedTopics.has(topic.name) ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                      Following
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Follow
                    </>
                  )}
                </button>
              </div>

              <p className="topic-description">{topic.description}</p>

              <div className="topic-stats">
                <div className="stat">
                  <span className="stat-number">{topic.count}</span>
                  <span className="stat-label">Questions</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{topic.totalUpvotes || 0}</span>
                  <span className="stat-label">Upvotes</span>
                </div>
                {topic.latestActivity && (
                  <div className="stat">
                    <span className="stat-text">Active {new Date(topic.latestActivity).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Topics
