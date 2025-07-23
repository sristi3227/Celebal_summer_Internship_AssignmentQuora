import { Link, useLocation } from "react-router-dom"
import "./Sidebar.css"

function Sidebar() {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9,22 9,12 15,12 15,22"></polyline>
          </svg>
          Home
        </Link>

        <Link to="/following" className={`nav-item ${isActive("/following") ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Following
        </Link>

        <Link to="/topics" className={`nav-item ${isActive("/topics") ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          Topics
        </Link>

        <div className="sidebar-divider"></div>

        <div className="sidebar-section">
          <h3 className="section-title">Your Activity</h3>
          <Link to="/profile" className={`nav-item ${isActive("/profile") ? "active" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Your Profile
          </Link>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
