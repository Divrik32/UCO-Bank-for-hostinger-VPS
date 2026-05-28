import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const email = new URLSearchParams(window.location.search).get("email");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      return alert("Passwords do not match");
    }
    try {
      setLoading(true);
      const res = await axios.post(
        "/api/users/reset-password",
        {
          email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }
      );
      alert(res.data.message);
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: "Request OTP", done: true },
    { label: "Enter OTP", done: false, active: true },
    { label: "Done", done: false },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rp-body {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f0;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
        }

        .rp-wrapper {
          width: 100%;
          max-width: 480px;
        }

        .rp-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #888;
          cursor: pointer;
          margin-bottom: 20px;
          padding: 0;
          transition: color 0.2s;
        }
        .rp-back-btn:hover { color: #cc0000; }

        .rp-card {
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.09);
          overflow: hidden;
        }

        .rp-header {
          background: #1a1a1a;
          padding: 32px 40px 28px;
          position: relative;
          overflow: hidden;
        }

        .rp-header::before {
          content: '';
          position: absolute;
          bottom: -50px; left: -50px;
          width: 160px; height: 160px;
          background: radial-gradient(circle, rgba(204,0,0,0.25) 0%, transparent 70%);
          border-radius: 50%;
        }

        .rp-header::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 130px; height: 130px;
          background: radial-gradient(circle, rgba(204,0,0,0.15) 0%, transparent 70%);
          border-radius: 50%;
        }

        .rp-icon-wrap {
          width: 54px; height: 54px;
          background: rgba(204,0,0,0.15);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
          position: relative; z-index: 1;
        }

        .rp-icon { font-size: 26px; }

        .rp-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.65rem;
          color: #fff;
          margin-bottom: 6px;
          position: relative; z-index: 1;
        }

        .rp-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          position: relative; z-index: 1;
          line-height: 1.5;
        }

        /* Step indicator */
        .rp-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 0 40px;
          margin: 28px 0 0;
          position: relative; z-index: 1;
        }

        .rp-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          position: relative;
        }

        .rp-step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 13px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: rgba(255,255,255,0.15);
        }

        .rp-step.done::after { background: rgba(204,0,0,0.6); }

        .rp-step-dot {
          width: 26px; height: 26px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 700;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.4);
          border: 2px solid rgba(255,255,255,0.15);
          position: relative; z-index: 1;
          transition: all 0.3s;
        }

        .rp-step.done .rp-step-dot {
          background: #cc0000;
          color: #fff;
          border-color: #cc0000;
        }

        .rp-step.active .rp-step-dot {
          background: #fff;
          color: #cc0000;
          border-color: #fff;
        }

        .rp-step-label {
          font-size: 10px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .rp-step.done .rp-step-label,
        .rp-step.active .rp-step-label {
          color: rgba(255,255,255,0.7);
        }

        /* Body */
        .rp-body-content {
          padding: 32px 40px 40px;
        }

        .rp-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #555;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .rp-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          border: 1.5px solid #e8e8e8;
          border-radius: 10px;
          outline: none;
          background: #fafafa;
          color: #1a1a1a;
          transition: border-color 0.25s, box-shadow 0.25s;
          margin-bottom: 20px;
        }

        .rp-input:focus {
          border-color: #cc0000;
          box-shadow: 0 0 0 3px rgba(204,0,0,0.08);
          background: #fff;
        }

        .rp-divider {
          height: 1px;
          background: #f0f0f0;
          margin: 4px 0 20px;
        }

        .rp-btn {
          width: 100%;
          height: 52px;
          background: #1a1a1a;
          color: #fff;
          border: 2px solid #1a1a1a;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: background 0.25s, color 0.25s;
        }

        .rp-btn:hover:not(:disabled) {
          background: transparent;
          color: #1a1a1a;
        }

        .rp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rp-security-note {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 18px;
        }

        .rp-security-note span {
          font-size: 12px;
          color: #aaa;
          line-height: 1.4;
        }

        /* Responsive */
        @media (max-width: 520px) {
          .rp-header { padding: 26px 22px 22px; }
          .rp-steps { padding: 0 22px; }
          .rp-body-content { padding: 26px 22px 32px; }
          .rp-title { font-size: 1.4rem; }
        }
      `}</style>

      <div className="rp-body">
        <div className="rp-wrapper">

          <button className="rp-back-btn" onClick={() => navigate("/forgot-password")}>
            ← Back
          </button>

          <div className="rp-card">
            <div className="rp-header">
              <div className="rp-icon-wrap">
                <span className="rp-icon">🔒</span>
              </div>
              <h2 className="rp-title">Reset Password</h2>
              <p className="rp-subtitle">
                Enter the OTP sent to <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{email}</strong> and choose a new password.
              </p>

              {/* Step Indicator */}
              <div className="rp-steps">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className={`rp-step ${step.done ? "done" : ""} ${step.active ? "active" : ""}`}
                  >
                    <div className="rp-step-dot">
                      {step.done ? "✓" : i + 1}
                    </div>
                    <span className="rp-step-label">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rp-body-content">
              <label className="rp-label">OTP Code</label>
              <input
                type="text"
                name="otp"
                placeholder="Enter 6-digit OTP"
                value={formData.otp}
                onChange={handleChange}
                className="rp-input"
                maxLength={6}
              />

              <div className="rp-divider" />

              <label className="rp-label">New Password</label>
              <input
                type="password"
                name="newPassword"
                placeholder="Create a strong password"
                value={formData.newPassword}
                onChange={handleChange}
                className="rp-input"
              />

              <label className="rp-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="rp-input"
              />

              <button
                className="rp-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="rp-security-note">
                <span>🛡️</span>
                <span>Your password is encrypted and stored securely. Never share your OTP with anyone.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}