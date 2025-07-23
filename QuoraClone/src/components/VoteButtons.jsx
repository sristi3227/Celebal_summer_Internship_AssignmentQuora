"use client"

import { useState, useEffect } from "react"
import { doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"
import "./VoteButtons.css"

function VoteButtons({ itemId, itemType, initialUpvotes, initialDownvotes, compact = false }) {
  const { currentUser } = useAuth()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkUserVote = async () => {
      try {
        const docRef = doc(db, itemType, itemId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          const votes = data.votes || []
          const userVoteData = votes.find((vote) => vote.userId === currentUser.uid)

          if (userVoteData) {
            setUserVote(userVoteData.type)
          }
        }
      } catch (error) {
        console.error("Error checking user vote:", error)
      }
    }

    if (currentUser) {
      checkUserVote()
    }
  }, [itemId, itemType, currentUser])

  const handleVote = async (voteType) => {
    if (!currentUser || loading) return

    setLoading(true)
    try {
      const docRef = doc(db, itemType, itemId)
      const voteData = { userId: currentUser.uid, type: voteType }

      if (userVote === voteType) {
        // Remove vote
        await updateDoc(docRef, {
          [voteType === "up" ? "upvotes" : "downvotes"]: increment(-1),
          votes: arrayRemove(voteData),
        })

        setUserVote(null)
        if (voteType === "up") {
          setUpvotes((prev) => prev - 1)
        } else {
          setDownvotes((prev) => prev - 1)
        }
      } else {
        // Add new vote or change existing vote
        const updates = {
          votes: arrayUnion(voteData),
        }

        if (userVote) {
          // Remove old vote
          const oldVoteData = { userId: currentUser.uid, type: userVote }
          updates.votes = arrayRemove(oldVoteData)
          updates[userVote === "up" ? "upvotes" : "downvotes"] = increment(-1)
        }

        // Add new vote
        updates[voteType === "up" ? "upvotes" : "downvotes"] = increment(1)

        await updateDoc(docRef, updates)

        // Update local state
        if (userVote) {
          if (userVote === "up") {
            setUpvotes((prev) => prev - 1)
          } else {
            setDownvotes((prev) => prev - 1)
          }
        }

        if (voteType === "up") {
          setUpvotes((prev) => prev + 1)
        } else {
          setDownvotes((prev) => prev + 1)
        }

        setUserVote(voteType)
      }
    } catch (error) {
      console.error("Error voting:", error)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <div className="vote-buttons compact">
        <button
          className={`vote-btn upvote ${userVote === "up" ? "active" : ""}`}
          onClick={() => handleVote("up")}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M7 14l5-5 5 5"></path>
          </svg>
          <span>{upvotes}</span>
        </button>
        <button
          className={`vote-btn downvote ${userVote === "down" ? "active" : ""}`}
          onClick={() => handleVote("down")}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 10l-5 5-5-5"></path>
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="vote-buttons">
      <button
        className={`vote-btn upvote ${userVote === "up" ? "active" : ""}`}
        onClick={() => handleVote("up")}
        disabled={loading}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M7 14l5-5 5 5"></path>
        </svg>
      </button>
      <span className="vote-count">{upvotes - downvotes}</span>
      <button
        className={`vote-btn downvote ${userVote === "down" ? "active" : ""}`}
        onClick={() => handleVote("down")}
        disabled={loading}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 10l-5 5-5-5"></path>
        </svg>
      </button>
    </div>
  )
}

export default VoteButtons
