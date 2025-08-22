"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { NotificationProvider } from "./contexts/NotificationContext"
import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import QuestionDetail from "./pages/QuestionDetail"
import AskQuestion from "./pages/AskQuestion"
import Search from "./pages/Search"
import Topics from "./pages/Topics"
import Following from "./pages/Following"
import LoadingSpinner from "./components/LoadingSpinner"
import "./App.css"

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return currentUser ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return !currentUser ? children : <Navigate to="/" />
}

function AppLayout({ children }) {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return children
  }

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <AppLayout>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/profile/:userId?"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/question/:id"
                    element={
                      <ProtectedRoute>
                        <QuestionDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ask"
                    element={
                      <ProtectedRoute>
                        <AskQuestion />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <Search />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/topics"
                    element={
                      <ProtectedRoute>
                        <Topics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/following"
                    element={
                      <ProtectedRoute>
                        <Following />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </AppLayout>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
