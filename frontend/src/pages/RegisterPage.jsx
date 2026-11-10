// src/pages/RegisterPage.jsx
// Professional, modern Lost & Found registration page.

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validations
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your password.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
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
            Create an account to report items, search listings, and submit claims.
          </p>
        </div>

        {/* Registration Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create Account</h2>
            <p>Join our campus &amp; community recovery platform</p>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-clean-form" noValidate>
            {/* Full Name Field */}
            <div className="auth-field-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="auth-field-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  id="reg-email"
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
              <label htmlFor="reg-password">Password (min. 6 characters)</label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  minLength={6}
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

            {/* Confirm Password Field */}
            <div className="auth-field-group">
              <label htmlFor="reg-confirm-password">Confirm Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  id="reg-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
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
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="auth-card-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="auth-switch-link">
                Sign in here
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
