"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "../firebase/config"
import QuestionCard from "../components/QuestionCard"
import LoadingSpinner from "../components/LoadingSpinner"
import "./Search.css"

function Search() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchType, setSearchType] = useState("questions")
  const [sortBy, setSortBy] = useState("relevance")

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setResults([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        if (searchType === "questions") {
          const questionsRef = collection(db, "questions")
          const q = query(questionsRef, orderBy("createdAt", "desc"))

          const snapshot = await getDocs(q)
          const allQuestions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))

          // Filter questions that match the search query
          const filteredQuestions = allQuestions.filter((question) => {
            const searchLower = searchQuery.toLowerCase()
            return (
              question.title.toLowerCase().includes(searchLower) ||
              question.content.toLowerCase().includes(searchLower) ||
              (question.tags && question.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
            )
          })

          // Sort results
          if (sortBy === "popular") {
            filteredQuestions.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
          } else if (sortBy === "recent") {
            filteredQuestions.sort((a, b) => {
              const aTime = a.createdAt?.toDate() || new Date(0)
              const bTime = b.createdAt?.toDate() || new Date(0)
              return bTime - aTime
            })
          }

          setResults(filteredQuestions)
        }
      } catch (error) {
        console.error("Error searching:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [searchQuery, searchType, sortBy])

  if (loading) {
    return <LoadingSpinner text="Searching..." />
  }

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search Results</h1>
        <p className="search-query">
          {results.length} result{results.length !== 1 ? "s" : ""} for "{searchQuery}"
        </p>

        <div className="search-filters">
          <div className="filter-group">
            <label>Search in:</label>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <option value="questions">Questions</option>
              <option value="answers">Answers</option>
              <option value="users">Users</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Relevance</option>
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      <div className="search-results">
        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <h3>No results found</h3>
            <p>Try different keywords or check your spelling</p>
            <div className="search-suggestions">
              <h4>Search suggestions:</h4>
              <ul>
                <li>Use different keywords</li>
                <li>Check your spelling</li>
                <li>Try more general terms</li>
                <li>Use fewer keywords</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="results-list">
            {results.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
