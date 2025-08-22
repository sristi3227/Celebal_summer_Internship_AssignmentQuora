"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "./AuthContext"

const NotificationContext = createContext()

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    // Listen for notifications for the current user
    const q = query(collection(db, "notifications"), where("recipientId", "==", currentUser.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Sort by creation date (newest first)
      const sortedNotifications = notificationsData.sort((a, b) => {
        const aTime = a.createdAt?.toDate() || new Date(0)
        const bTime = b.createdAt?.toDate() || new Date(0)
        return bTime - aTime
      })

      setNotifications(sortedNotifications)

      // Count unread notifications
      const unreadCount = sortedNotifications.filter((n) => !n.read).length
      setUnreadCount(unreadCount)

      setLoading(false)
    })

    return unsubscribe
  }, [currentUser])

  // Create notification function
  const createNotification = async (notificationData) => {
    try {
      // Don't create notification if user is notifying themselves
      if (notificationData.recipientId === currentUser?.uid) {
        return
      }

      await addDoc(collection(db, "notifications"), {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false,
      })
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        readAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)

      const promises = unreadNotifications.map((notification) =>
        updateDoc(doc(db, "notifications", notification.id), {
          read: true,
          readAt: serverTimestamp(),
        }),
      )

      await Promise.all(promises)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    createNotification,
    markAsRead,
    markAllAsRead,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
