// src/App.jsx
// Main application component with strict authentication protection on all Lost & Found content.
// Only /login and /register are publicly accessible.

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LostItemsPage from "./pages/LostItemsPage";
import FoundItemsPage from "./pages/FoundItemsPage";
import ItemDetailsPage from "./pages/ItemDetailsPage";
import CreateItemPage from "./pages/CreateItemPage";
import MyClaimsPage from "./pages/MyClaimsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClaims from "./pages/admin/AdminClaims";
import AdminItems from "./pages/admin/AdminItems";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          {/* Main Navbar: automatically hidden when not authenticated */}
          <Navbar />

          <main className="main-content">
            <Routes>
              {/* Only Login & Register are publicly accessible */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* ALL Lost & Found Application Pages Require Authentication */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lost-items"
                element={
                  <ProtectedRoute>
                    <LostItemsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/found-items"
                element={
                  <ProtectedRoute>
                    <FoundItemsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/items/:id"
                element={
                  <ProtectedRoute>
                    <ItemDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Add / Report Item (supports multiple aliases) */}
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreateItemPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-lost"
                element={
                  <ProtectedRoute>
                    <CreateItemPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-found"
                element={
                  <ProtectedRoute>
                    <CreateItemPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-item"
                element={
                  <ProtectedRoute>
                    <CreateItemPage />
                  </ProtectedRoute>
                }
              />

              {/* Claims (supports /my-claims and /claims) */}
              <Route
                path="/my-claims"
                element={
                  <ProtectedRoute>
                    <MyClaimsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/claims"
                element={
                  <ProtectedRoute>
                    <MyClaimsPage />
                  </ProtectedRoute>
                }
              />

              {/* User Profile & Notifications */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes (Require Auth + Admin Role) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/claims"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminClaims />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/items"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminItems />
                  </ProtectedRoute>
                }
              />

              {/* Any other URL defaults to /, which immediately bounces unauthenticated users to /login */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
