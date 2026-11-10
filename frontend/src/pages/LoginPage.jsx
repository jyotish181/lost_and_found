// src/pages/LoginPage.jsx
// Professional, modern Lost & Found login page.

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // If already logged in, redirect straight to app
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        {/* Branding & Header */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <span className="auth-logo-icon">🔍</span>
          </div>
          <h1 className="auth-portal-title">Lost &amp; Found</h1>
          <p className="auth-portal-subtitle">
            Sign in to access your reports, browse items, and manage claims.
          </p>
        </div>

        {/* Login Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome Back</h2>
            <p>Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-clean-form" noValidate>
            {/* Email Field */}
            <div className="auth-field-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="auth-field-group">
              <div className="field-label-row">
                <label htmlFor="login-password">Password</label>
              </div>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex="-1"
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner-content">
                  <span className="mini-spinner"></span>
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="auth-card-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="auth-switch-link">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security / System Footer Note */}
        <div className="auth-system-footnote">
          🔒 Secure Lost &amp; Found Portal • Authenticated Access Only
        </div>
      </div>
    </div>
  );
}
