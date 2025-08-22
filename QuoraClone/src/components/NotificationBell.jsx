"use client"

import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { useNotifications } from "../contexts/NotificationContext"
import "./NotificationBell.css"

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown time"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffMinutes = Math.ceil(diffTime / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.ceil(diffMinutes / 60)}h ago`
    return `${Math.ceil(diffMinutes / 1440)}d ago`
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "reply":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )
      case "answer":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12l2 2 4-4"></path>
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        )
      case "vote":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M7 14l5-5 5 5"></path>
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        )
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    setShowDropdown(false)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notifications-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <p>No notifications yet</p>
                <span>You'll see notifications here when someone interacts with your content</span>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link}
                  className={`notification-item ${!notification.read ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                  <div className="notification-content">
                    <div className="notification-text">
                      <strong>{notification.senderName}</strong> {notification.message}
                    </div>
                    <div className="notification-time">{formatDate(notification.createdAt)}</div>
                  </div>
                  {!notification.read && <div className="unread-dot"></div>}
                </Link>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="notification-footer">
              <Link to="/notifications" onClick={() => setShowDropdown(false)}>
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
