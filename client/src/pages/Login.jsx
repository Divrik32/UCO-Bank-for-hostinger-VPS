import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warn("Please fill in all fields.");
      return;
    }
    try {
      const res = await api.post(
        "/users/login",
        { email, password },
        { withCredentials: true }
      );
      const { token, role, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success(res.data.message || "Login successful!");
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Login failed. Try again.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d0d0d;
          font-family: 'Outfit', sans-serif;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* Animated background blobs */
        .login-root::before {
          content: '';
          position: fixed;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(180,0,0,0.18) 0%, transparent 65%);
          border-radius: 50%;
          animation: blobMove1 12s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .login-root::after {
          content: '';
          position: fixed;
          bottom: -200px; right: -200px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(180,0,0,0.12) 0%, transparent 65%);
          border-radius: 50%;
          animation: blobMove2 15s ease-in-out infinite alternate;
          pointer-events: none;
        }
        @keyframes blobMove1 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(80px, 60px) scale(1.15); }
        }
        @keyframes blobMove2 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(-60px, -40px) scale(1.1); }
        }

        .login-card {
          display: flex;
          width: 100%;
          max-width: 960px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          animation: cardIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
          position: relative;
          z-index: 1;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ─── LEFT PANEL ─── */
        .brand-side {
          flex: 0 0 380px;
          background: linear-gradient(160deg, #1a0000 0%, #0d0d0d 40%, #1a0606 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 52px 40px;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.05);
        }

        /* Grid lines decoration */
        .brand-side::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(180,0,0,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,0,0,0.06) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Gold accent line */
        .brand-side::after {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 60px; height: 3px;
          background: linear-gradient(90deg, #b8860b, #ffd700, #b8860b);
          border-radius: 0 0 4px 4px;
        }

        .logo-wrapper {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          animation: logoIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }

        @keyframes logoIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Logo glow ring */
        .logo-ring {
          width: 180px; height: 180px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,215,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 0 40px rgba(180,0,0,0.2), inset 0 0 20px rgba(0,0,0,0.3);
          margin-bottom: 28px;
        }

        .logo-ring::before {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid rgba(255,215,0,0.08);
        }

        .logo-ring img {
          width: 150px;
          height: 150px;
          object-fit: contain;
          border-radius: 50%;
        }

        .bank-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.45rem;
          font-weight: 700;
          color: #fff;
          text-align: center;
          line-height: 1.3;
          letter-spacing: 0.3px;
          margin-bottom: 8px;
        }

        .bank-name span {
          color: #ffd700;
        }

        .bank-subtitle {
          font-size: 11.5px;
          color: rgba(255,255,255,0.5);
          text-align: center;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          margin-bottom: 32px;
        }

        .divider-line {
          width: 60px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent);
          margin: 0 auto 28px;
        }

        .info-pills {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .info-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 11px 16px;
          transition: background 0.2s, border-color 0.2s;
        }

        .info-pill:hover {
          background: rgba(180,0,0,0.12);
          border-color: rgba(180,0,0,0.25);
        }

        .pill-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(180,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }

        .pill-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .pill-label {
          font-size: 10px;
          color: rgba(255,255,255,0.38);
          text-transform: uppercase;
          letter-spacing: 1.2px;
        }

        .pill-value {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.85);
        }

        .estd-badge {
          margin-top: 24px;
          background: linear-gradient(135deg, rgba(184,134,11,0.15), rgba(255,215,0,0.08));
          border: 1px solid rgba(255,215,0,0.2);
          border-radius: 30px;
          padding: 6px 18px;
          font-size: 11px;
          color: #ffd700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* ─── RIGHT PANEL ─── */
        .form-side {
          flex: 1;
          padding: 56px 52px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #fff;
          animation: formIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }

        @keyframes formIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .form-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #cc0000;
          margin-bottom: 10px;
        }

        .form-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.6rem;
          font-weight: 700;
          color: #0d0d0d;
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .form-subtext {
          font-size: 14px;
          color: #999;
          margin-bottom: 38px;
          font-weight: 300;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 20px;
          position: relative;
        }

        .input-label {
          font-size: 11.5px;
          font-weight: 600;
          color: #555;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #bbb;
          font-size: 16px;
          pointer-events: none;
          transition: color 0.2s;
        }

        .input-field {
          width: 100%;
          padding: 14px 16px 14px 44px;
          font-size: 14.5px;
          font-family: 'Outfit', sans-serif;
          border: 1.5px solid #eaeaea;
          border-radius: 12px;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
          background: #fafafa;
          color: #111;
          font-weight: 400;
        }

        .input-field:focus {
          border-color: #cc0000;
          box-shadow: 0 0 0 4px rgba(204,0,0,0.07);
          background: #fff;
        }

        .input-field:focus + .input-icon {
          color: #cc0000;
        }

        .input-field:focus ~ .input-icon {
          color: #cc0000;
        }

        .input-wrap:focus-within .input-icon {
          color: #cc0000;
        }

        .eye-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #bbb;
          font-size: 16px;
          padding: 4px;
          transition: color 0.2s;
        }
        .eye-toggle:hover { color: #cc0000; }

        .row-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
          margin-top: -8px;
        }

        .forgot-link {
          font-size: 13px;
          color: #cc0000;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'Outfit', sans-serif;
          transition: opacity 0.2s;
          padding: 0;
        }
        .forgot-link:hover { opacity: 0.65; }

        .login-btn {
          width: 100%;
          height: 52px;
          background: #cc0000;
          color: #fff;
          border: 2px solid #cc0000;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .login-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.25s;
        }

        .login-btn:hover {
          background: #a80000;
          border-color: #a80000;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(204,0,0,0.28);
        }
        .login-btn:hover::after { opacity: 1; }

        .login-btn:active {
          transform: translateY(0);
          box-shadow: none;
        }

        .register-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .register-text {
          font-size: 13px;
          color: #aaa;
        }

        .register-btn {
          background: #fff5f5;
          border: 1.5px solid #ffd0d0;
          color: #cc0000;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: 24px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          letter-spacing: 0.3px;
          transition: all 0.22s;
        }
        .register-btn:hover {
          background: #cc0000;
          color: #fff;
          border-color: #cc0000;
        }

        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
          font-size: 11.5px;
          color: #bbb;
          letter-spacing: 0.3px;
        }

        .security-note span { font-size: 13px; }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 760px) {
          .login-card {
            flex-direction: column;
            border-radius: 20px;
            max-width: 440px;
          }
          .brand-side {
            flex: none;
            padding: 36px 28px 32px;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .logo-ring { width: 130px; height: 130px; margin-bottom: 20px; }
          .logo-ring img { width: 110px; height: 110px; }
          .bank-name { font-size: 1.15rem; }
          .info-pills { display: none; }
          .estd-badge { margin-top: 16px; }
          .form-side { padding: 36px 28px 40px; }
          .form-heading { font-size: 2rem; }
        }

        @media (max-width: 420px) {
          .form-side { padding: 28px 20px 32px; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">

          {/* ─── LEFT: BRAND PANEL ─── */}
          <div className="brand-side">
            <div className="logo-wrapper">
              <div className="logo-ring">
                <img src="/assets/img/logo.png" alt="AIBEA AIBOA Logo" />
              </div>

              <div className="bank-name">
                Bihar State UCO Bank<br />
                Officers' <span>Credit & Thrift</span><br />
                Co-operative Society Ltd.
              </div>
              <div className="bank-subtitle">Patna, Bihar</div>

              <div className="divider-line" />

              <div className="info-pills">
                <div className="info-pill">
                  <div className="pill-icon">🏦</div>
                  <div className="pill-text">
                    <span className="pill-label">Organisation</span>
                    <span className="pill-value">AIBEA · AIBOA Affiliate</span>
                  </div>
                </div>
                <div className="info-pill">
                  <div className="pill-icon">📍</div>
                  <div className="pill-text">
                    <span className="pill-label">Registered Office</span>
                    <span className="pill-value">Patna, Bihar, India</span>
                  </div>
                </div>
                <div className="info-pill">
                  <div className="pill-icon">🔐</div>
                  <div className="pill-text">
                    <span className="pill-label">Portal</span>
                    <span className="pill-value">Member Secure Access</span>
                  </div>
                </div>
              </div>

              <div className="estd-badge">Est. Members' Portal</div>
            </div>
          </div>

          {/* ─── RIGHT: FORM PANEL ─── */}
          <div className="form-side">
            <div className="form-eyebrow">Member Portal</div>
            <h2 className="form-heading">Sign In</h2>
            <p className="form-subtext">Enter your credentials to access your account</p>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="input-wrap">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                  />
                  <span className="input-icon">✉</span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                  />
                  <span className="input-icon">🔒</span>
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className="row-actions">
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="login-btn">
                Login to Portal
              </button>
            </form>

            <div className="register-row">
              <span className="register-text">New member?</span>
              <button
                type="button"
                className="register-btn"
                onClick={() => navigate("/register")}
              >
                Create Account →
              </button>
            </div>

            <div className="security-note">
              <span>🔒</span> Secured connection · Data encrypted in transit
            </div>
          </div>

        </div>
      </div>
    </>
  );
}