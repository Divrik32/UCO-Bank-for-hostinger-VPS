import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/users/forgot-password",
        { email }
      );
      alert(res.data.message);
      window.location.href = `/reset-password?email=${email}`;
    } catch (err) {
      alert(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fp-body {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f0;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
        }

        .fp-wrapper {
          width: 100%;
          max-width: 460px;
        }

        .fp-back-btn {
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
        .fp-back-btn:hover { color: #cc0000; }

        .fp-card {
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.09);
          overflow: hidden;
        }

        .fp-header {
          background: #1a1a1a;
          padding: 36px 40px 32px;
          position: relative;
          overflow: hidden;
        }

        .fp-header::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(204,0,0,0.3) 0%, transparent 70%);
          border-radius: 50%;
        }

        .fp-icon-wrap {
          width: 54px; height: 54px;
          background: rgba(204,0,0,0.15);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
          position: relative; z-index: 1;
        }

        .fp-icon {
          font-size: 26px;
        }

        .fp-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.7rem;
          color: #fff;
          margin-bottom: 6px;
          position: relative; z-index: 1;
        }

        .fp-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          position: relative; z-index: 1;
          line-height: 1.5;
        }

        .fp-body-content {
          padding: 36px 40px 40px;
        }

        .fp-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #555;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .fp-input {
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
          margin-bottom: 24px;
        }

        .fp-input:focus {
          border-color: #cc0000;
          box-shadow: 0 0 0 3px rgba(204,0,0,0.08);
          background: #fff;
        }

        .fp-btn {
          width: 100%;
          height: 52px;
          background: #cc0000;
          color: #fff;
          border: 2px solid #cc0000;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: background 0.25s, color 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }

        .fp-btn:hover:not(:disabled) {
          background: transparent;
          color: #cc0000;
        }

        .fp-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .fp-hint {
          text-align: center;
          font-size: 12px;
          color: #bbb;
          margin-top: 18px;
        }

        /* Responsive */
        @media (max-width: 500px) {
          .fp-header { padding: 28px 24px 24px; }
          .fp-body-content { padding: 28px 24px 32px; }
          .fp-title { font-size: 1.4rem; }
        }
      `}</style>

      <div className="fp-body">
        <div className="fp-wrapper">

          <button className="fp-back-btn" onClick={() => navigate("/login")}>
            ← Back to Login
          </button>

          <div className="fp-card">
            <div className="fp-header">
              <div className="fp-icon-wrap">
                <span className="fp-icon">🔑</span>
              </div>
              <h2 className="fp-title">Forgot Password?</h2>
              <p className="fp-subtitle">
                No worries! Enter your registered email and we'll send you an OTP to reset your password.
              </p>
            </div>

            <div className="fp-body-content">
              <label className="fp-label">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fp-input"
              />

              <button
                className="fp-btn"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP →"}
              </button>

              <p className="fp-hint">Check your spam folder if you don't see the email.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}