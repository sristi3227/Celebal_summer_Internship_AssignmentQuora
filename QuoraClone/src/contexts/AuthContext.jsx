"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase/config"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(email, password, displayName) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName })

      // Create user document in Firestore with proper structure for production rules
      await setDoc(doc(db, "users", result.user.uid), {
        displayName: displayName || "",
        email: email,
        createdAt: new Date(),
        updatedAt: new Date(),
        reputation: 0,
        questionsCount: 0,
        answersCount: 0,
      })

      return result
    } catch (error) {
      console.error("Signup error:", error)
      // Provide more specific error messages
      if (error.code === "auth/email-already-in-use") {
        throw new Error("This email is already registered. Please try logging in instead.")
      } else if (error.code === "auth/weak-password") {
        throw new Error("Password is too weak. Please use at least 6 characters.")
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Please enter a valid email address.")
      } else if (error.code === "auth/operation-not-allowed") {
        throw new Error("Email/password authentication is not enabled. Please contact support.")
      } else {
        throw new Error("Failed to create account. Please check your internet connection and try again.")
      }
    }
  }

  async function login(email, password) {
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Login error:", error)
      if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email address.")
      } else if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password. Please try again.")
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Please enter a valid email address.")
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("Too many failed login attempts. Please try again later.")
      } else {
        throw new Error("Failed to log in. Please check your credentials and try again.")
      }
    }
  }

  function logout() {
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setCurrentUser({ ...user, ...userDoc.data() })
          } else {
            // If user document doesn't exist, create it (for existing users)
            const userData = {
              displayName: user.displayName || "",
              email: user.email,
              createdAt: new Date(),
              updatedAt: new Date(),
              reputation: 0,
              questionsCount: 0,
              answersCount: 0,
            }
            await setDoc(doc(db, "users", user.uid), userData)
            setCurrentUser({ ...user, ...userData })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setCurrentUser(user)
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
