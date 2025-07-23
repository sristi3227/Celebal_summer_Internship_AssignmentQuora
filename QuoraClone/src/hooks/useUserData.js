"use client"

import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../contexts/AuthContext"

export function useUserData() {
  const { currentUser } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setUserData(null)
      setLoading(false)
      return
    }

    const userRef = doc(db, "users", currentUser.uid)
    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          setUserData({ id: doc.id, ...doc.data() })
        } else {
          setUserData(null)
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching user data:", error)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [currentUser])

  return { userData, loading }
}
