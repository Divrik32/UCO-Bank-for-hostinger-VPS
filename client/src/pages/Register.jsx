import React, { useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: "", lastname: "", username: "",
    email: "", password: "", role: "user", image: null,
  });
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("Choose an image…");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setFormData({ ...formData, image: file });
      setFileName(file.name);
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const data = new FormData();
  Object.entries(formData).forEach(([k, v]) => data.append(k, v));

  try {
    const res = await axios.post(
      "http://88.222.245.71:5000/api/users/register",
      data
    );
    toast.success(res.data.message || "Registration successful!");
    setTimeout(() => navigate("/login"), 1500);
  } catch (err) {
    console.log(err);
    toast.error(err.response?.data?.message || "Registration failed. Try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');

        .uco-page {
          min-height: 100vh;
          background: #0a1628;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(15,40,80,0.8) 0%, transparent 60%),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 80px,
              rgba(255,255,255,0.015) 80px,
              rgba(255,255,255,0.015) 81px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 80px,
              rgba(255,255,255,0.015) 80px,
              rgba(255,255,255,0.015) 81px
            );
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          font-family: 'Source Sans 3', sans-serif;
        }

        /* Top bank bar */
        .uco-topbar {
          width: 100%;
          max-width: 520px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
          animation: fadeDown 0.5s ease both;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .uco-logo-box {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #c9a84c, #e8cc7a);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700;
          color: #0a1628;
          font-family: 'Playfair Display', serif;
          box-shadow: 0 4px 16px rgba(201,168,76,0.35);
          flex-shrink: 0;
        }

        .uco-bank-name {
          display: flex; flex-direction: column;
        }

        .uco-bank-name strong {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #e8cc7a;
          letter-spacing: 0.5px;
          line-height: 1;
        }

        .uco-bank-name span {
          font-size: 11px;
          color: #7a9bc4;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 3px;
        }

        .uco-tagline {
          margin-left: auto;
          font-size: 11px;
          color: #4a6a8a;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-align: right;
          line-height: 1.5;
        }

        /* Card */
        .uco-card {
          width: 100%;
          max-width: 520px;
          background: #0d1f3c;
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 4px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03),
            0 24px 80px rgba(0,0,0,0.5);
          animation: fadeUp 0.5s ease 0.1s both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Card header */
        .uco-card-header {
          background: linear-gradient(135deg, #0f2545 0%, #162e52 100%);
          border-bottom: 2px solid #c9a84c;
          padding: 28px 36px 24px;
          position: relative;
          overflow: hidden;
        }

        .uco-card-header::after {
          content: 'UCO';
          position: absolute;
          right: -10px; top: -16px;
          font-family: 'Playfair Display', serif;
          font-size: 90px;
          font-weight: 700;
          color: rgba(201,168,76,0.06);
          user-select: none;
        }

        .uco-form-title-label {
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #c9a84c;
          margin-bottom: 6px;
        }

        .uco-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #dce8f5;
          font-weight: 600;
          margin: 0;
        }

        .uco-form-subtitle {
          font-size: 12.5px;
          color: #5a7a9a;
          margin-top: 6px;
        }

        /* Body */
        .uco-card-body {
          padding: 32px 36px 36px;
        }

        /* Section divider */
        .uco-section {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          margin-top: 4px;
        }

        .uco-section-label {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #c9a84c;
          white-space: nowrap;
          font-weight: 600;
        }

        .uco-section-line {
          flex: 1;
          height: 1px;
          background: rgba(201,168,76,0.2);
        }

        /* Row */
        .uco-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* Field */
        .uco-field {
          margin-bottom: 18px;
        }

        .uco-label {
          display: block;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #7a9bc4;
          margin-bottom: 7px;
        }

        .uco-input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(10, 22, 40, 0.8);
          border: 1px solid rgba(100,140,180,0.25);
          border-radius: 3px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 14px;
          color: #dce8f5;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .uco-input::placeholder {
          color: #2d4a6a;
        }

        .uco-input:focus {
          border-color: #c9a84c;
          background: rgba(10,22,40,0.95);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.10);
        }

        /* File upload */
        .uco-file-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(10,22,40,0.8);
          border: 1px dashed rgba(100,140,180,0.25);
          border-radius: 3px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          color: #4a6a8a;
          font-size: 13px;
        }

        .uco-file-box:hover {
          border-color: #c9a84c;
          background: rgba(10,22,40,0.95);
        }

        .uco-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #c9a84c;
        }

        .uco-file-icon {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(201,168,76,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .uco-file-name {
          font-size: 12px;
          color: #5a7a9a;
        }

        /* Submit button */
        .uco-btn {
          width: 100%;
          margin-top: 8px;
          padding: 13px;
          background: linear-gradient(135deg, #b8922a, #e8cc7a, #b8922a);
          background-size: 200% 100%;
          background-position: left;
          color: #0a1628;
          border: none;
          border-radius: 3px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background-position 0.4s, box-shadow 0.2s, transform 0.1s;
          box-shadow: 0 4px 20px rgba(201,168,76,0.25);
        }

        .uco-btn:hover {
          background-position: right;
          box-shadow: 0 6px 28px rgba(201,168,76,0.4);
        }

        .uco-btn:active { transform: scale(0.99); }

        .uco-btn:disabled {
          background: #2a3a52;
          color: #4a6a8a;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Footer strip */
        .uco-footer-strip {
          width: 100%;
          max-width: 520px;
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
          animation: fadeUp 0.5s ease 0.25s both;
        }

        .uco-footer-strip p {
          font-size: 11px;
          color: #2d4a6a;
          letter-spacing: 0.5px;
        }

        .uco-footer-strip a {
          font-size: 11.5px;
          color: #c9a84c;
          text-decoration: none;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .uco-footer-strip a:hover { text-decoration: underline; }

        /* Security badge */
        .uco-secure {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 3px;
          padding: 8px 14px;
          margin-bottom: 24px;
          font-size: 11px;
          color: #5a7a9a;
          letter-spacing: 0.5px;
        }

        .uco-secure-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #4caf7d;
          box-shadow: 0 0 6px #4caf7d;
          flex-shrink: 0;
        }
      `}</style>

      <div className="uco-page">

        {/* Top bar */}
        <div className="uco-topbar">
          <div className="uco-logo-box">U</div>
          <div className="uco-bank-name">
            <strong>UCO Bank</strong>
            <span>Govt. of India Undertaking</span>
          </div>
          <div className="uco-tagline">
            Honours Your<br />Trust
          </div>
        </div>

        {/* Card */}
        <div className="uco-card">

          <div className="uco-card-header">
            <div className="uco-form-title-label">New Customer Registration</div>
            <h2 className="uco-form-title">Open Your Account</h2>
            <p className="uco-form-subtitle">Please fill in all details carefully as per your documents</p>
          </div>

          <div className="uco-card-body">

            {/* Secure badge */}
            <div className="uco-secure">
              <div className="uco-secure-dot" />
              Secure 256-bit SSL Encrypted Connection
            </div>

            <form onSubmit={handleSubmit}>

              {/* Personal Info */}
              <div className="uco-section">
                <span className="uco-section-label">Personal Details</span>
                <div className="uco-section-line" />
              </div>

              <div className="uco-row">
                <div className="uco-field">
                  <label className="uco-label">First Name</label>
                  <input className="uco-input" type="text" name="firstname"
                    placeholder="As per Aadhaar" onChange={handleChange} required />
                </div>
                <div className="uco-field">
                  <label className="uco-label">Last Name</label>
                  <input className="uco-input" type="text" name="lastname"
                    placeholder="As per Aadhaar" onChange={handleChange} required />
                </div>
              </div>

              <div className="uco-field">
                <label className="uco-label">Username</label>
                <input className="uco-input" type="text" name="username"
                  placeholder="Choose a unique username" onChange={handleChange} required />
              </div>

              {/* Login Info */}
              <div className="uco-section" style={{ marginTop: "8px" }}>
                <span className="uco-section-label">Login Credentials</span>
                <div className="uco-section-line" />
              </div>

              <div className="uco-field">
                <label className="uco-label">Email Address</label>
                <input className="uco-input" type="email" name="email"
                  placeholder="Your registered email" onChange={handleChange} required />
              </div>

              <div className="uco-field">
                <label className="uco-label">Set Password</label>
                <input className="uco-input" type="password" name="password"
                  placeholder="Min. 8 characters" onChange={handleChange} required />
              </div>

              {/* Photo */}
              <div className="uco-section" style={{ marginTop: "8px" }}>
                <span className="uco-section-label">KYC Photo Upload</span>
                <div className="uco-section-line" />
              </div>

              <div className="uco-field">
                <label className="uco-label">Passport Size Photo</label>
                <div className="uco-file-box" onClick={() => fileRef.current.click()}>
                  {preview
                    ? <img src={preview} alt="preview" className="uco-avatar" />
                    : <div className="uco-file-icon">📎</div>}
                  <span className="uco-file-name">{fileName}</span>
                </div>
                <input ref={fileRef} type="file" name="image"
                  accept="image/*" onChange={handleChange} style={{ display: "none" }} />
              </div>

              <button type="submit" className="uco-btn" disabled={loading}>
                {loading ? "Submitting…" : "Submit Registration"}
              </button>

            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="uco-footer-strip">
          <p>© 2025 <a href="https://wsdstech.com" target="_blank" rel="noreferrer">
            WSDSTech.com
          </a>. All rights reserved.</p>
          <Link to="/login">Already registered? Sign In</Link>
        </div>

      </div>
    </>
  );
};

export default Register;