import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";

// ─────────────────────────────────────────────
//  Responsive hook
// ─────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

// ─────────────────────────────────────────────
//  Shared style tokens
// ─────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  fontSize: "14px",
  border: "1px solid #ced4da",
  borderRadius: "4px",
  backgroundColor: "#fff",
  boxSizing: "border-box",
  color: "#333",
};

const disabledInputStyle = {
  ...inputStyle,
  backgroundColor: "#f8f9fa",
  color: "#6c757d",
  cursor: "not-allowed",
};

const labelStyle = {
  fontSize: "13px",
  marginBottom: "6px",
  color: "#555",
  display: "block",
};

const fieldBox = { marginBottom: "14px" };

// ─────────────────────────────────────────────
//  Small reusable components
// ─────────────────────────────────────────────
function Field({ label, name, value = "", onChange, type = "text", required = false }) {
  return (
    <div style={fieldBox}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
        required={required}
      />
    </div>
  );
}

function FieldDisabled({ label, value = "" }) {
  return (
    <div style={fieldBox}>
      <label style={labelStyle}>{label}</label>
      <input disabled value={value} style={disabledInputStyle} />
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{ margin: "16px 0 10px" }}>
      <p style={{ fontSize: "14px", fontWeight: 600, color: "#012970", marginBottom: 6 }}>
        {label}
      </p>
      <hr style={{ borderColor: "#ebeef4", margin: 0 }} />
    </div>
  );
}

function UploadBox({ label, preview, required = false }) {
  return (
    <div
      style={{
        border: "1px dashed #b0bec5",
        borderRadius: 6,
        padding: "16px 12px",
        textAlign: "center",
      }}
    >
      <p style={{ margin: "0 0 8px", fontSize: 13, color: "#555" }}>
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </p>
      {preview && (
        <img
          src={preview}
          alt={label}
          style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 4 }}
        />
      )}
    </div>
  );
}

function Card({ title, onEdit, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 5,
        marginBottom: 20,
        boxShadow: "0 0 30px rgba(1,41,112,0.1)",
        padding: "0 20px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 0 14px",
          fontSize: 18,
          fontWeight: 500,
          color: "#012970",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <span style={{ fontSize: "clamp(15px, 2.5vw, 18px)" }}>{title}</span>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              fontSize: 13,
              padding: "4px 14px",
              border: "1px solid #4154f1",
              color: "#4154f1",
              background: "transparent",
              borderRadius: 4,
              cursor: "pointer",
              whiteSpace: "nowrap",
              marginLeft: 8,
            }}
          >
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Page Component
// ─────────────────────────────────────────────
export default function PreviewEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.split("/")[1];
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // On mobile & tablet → single column; on desktop → two columns
  const isSingleColumn = isMobile || isTablet;

  const [formData, setFormData] = useState({
    ...JSON.parse(localStorage.getItem("personalInfo") || "{}"),
    ...JSON.parse(localStorage.getItem("kycInfo") || "{}"),
    ...JSON.parse(localStorage.getItem("bankInfo") || "{}"),
    ...JSON.parse(localStorage.getItem("nomineeInfo") || "{}"),
  });

  const [existingFiles, setExistingFiles] = useState({
    profile_image: null,
    signature_image: null,
    doc1File: null,
    doc2File: null,
  });

  useEffect(() => {
    const personal = JSON.parse(localStorage.getItem("personalInfo") || "{}");
    const kyc = JSON.parse(localStorage.getItem("kycInfo") || "{}");

    const base64ToFile = (base64, filename) => {
      if (!base64) return null;
      const arr = base64.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new File([u8arr], filename, { type: mime });
    };

    setExistingFiles({
      profile_image: base64ToFile(personal.profile_image, "profile.jpg"),
      signature_image: base64ToFile(personal.signature_image, "signature.jpg"),
      doc1File: base64ToFile(kyc.doc1File, "doc1.jpg"),
      doc2File: base64ToFile(kyc.doc2File, "doc2.jpg"),
    });
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDone = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (
          (key === "address_proof_name" || key === "address_proof_no") &&
          !value
        ) return;
        if (formData[key] !== undefined && formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      if (existingFiles.profile_image)   submitData.append("profile_image",   existingFiles.profile_image);
      if (existingFiles.signature_image) submitData.append("signature_image", existingFiles.signature_image);
      if (existingFiles.doc1File)        submitData.append("doc1File",        existingFiles.doc1File);
      if (existingFiles.doc2File)        submitData.append("doc2File",        existingFiles.doc2File);

      const res = await api.post("/api/users/submit-member-form", submitData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const returnedId = res.data?.userid || res.data?.member_id || "—";

      localStorage.removeItem("personalInfo");
      localStorage.removeItem("kycInfo");
      localStorage.removeItem("bankInfo");
      localStorage.removeItem("nomineeInfo");

      toast.success("Form submitted successfully!");
      setMemberId(returnedId);
      setShowModal(true);
    } catch (err) {
      console.error("SUBMIT ERROR:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Form submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate(`/${basePath}`);
  };

  // ──────────────────────────────────────────
  //  Address sub-grid: 2-col on tablet+, 1-col on mobile
  // ──────────────────────────────────────────
  const addressGridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: isMobile ? 0 : 10,
  };

  // Upload boxes: always 2-col (they're small enough)
  const uploadGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 12,
  };

  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "'Open Sans', sans-serif",
        padding: isMobile ? "12px" : isTablet ? "16px" : "20px",
        boxSizing: "border-box",
        maxWidth: "100%",
      }}
    >
      {/* Page title + breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: isMobile ? 20 : 24,
            fontWeight: 600,
            color: "#012970",
            marginBottom: 4,
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Preview Form
        </h1>
        <nav
          style={{
            fontSize: 14,
            color: "#899bbd",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
          }}
        >
          <a href="/" style={{ color: "#899bbd", textDecoration: "none" }}>
            Home
          </a>
          {" › "}Member{" › "}
          <span style={{ color: "#51678f" }}>Edit</span>
        </nav>
      </div>

      {/* Card grid — single column on mobile/tablet, two columns on desktop */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isSingleColumn ? "1fr" : "1fr 1fr",
          gap: isMobile ? 0 : 20,
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Personal Info */}
          <Card title="Personal Information" onEdit={() => navigate(`/${basePath}/pi1`)}>
            <Field label="Member Name"       name="firstname"           value={formData.firstname}           onChange={handleChange} required />
            <Field label="Last Name"          name="lastname"            value={formData.lastname}            onChange={handleChange} required />
            <Field label="Member D.O.B"       name="dob"                 value={formData.dob}                 onChange={handleChange} required />
            <Field label="Age"                name="age"                 value={formData.age}                 onChange={handleChange} required />
            <Field label="Phone"              name="phoneno"             value={formData.phoneno}             onChange={handleChange} required />
            <Field label="Email"              name="email"               value={formData.email}               onChange={handleChange} required />
            <Field label="Gender"             name="gender"              value={formData.gender}              onChange={handleChange} required />
            <Field label="Status"             name="status"              value={formData.status}              onChange={handleChange} required />
            <Field label="Guardian Name"      name="guardian_firstname"  value={formData.guardian_firstname}  onChange={handleChange} required />
            <Field label="Guardian Relation"  name="guardian_relation"   value={formData.guardian_relation}   onChange={handleChange} required />

            <SectionDivider label="Address" />
            <div style={addressGridStyle}>
              <Field label="House/Flat No."  name="address_line1" value={formData.address_line1} onChange={handleChange} required />
              <Field label="Street no./Area" name="address_line2" value={formData.address_line2} onChange={handleChange} required />
              <Field label="State"           name="state"         value={formData.state}         onChange={handleChange} required />
              <Field label="Pincode"         name="pincode"       value={formData.pincode}       onChange={handleChange} required />
            </div>

            <div style={uploadGridStyle}>
              <UploadBox label="Profile Image"    preview={existingFiles.profile_image}   required />
              <UploadBox label="Signature Image"  preview={existingFiles.signature_image} required />
            </div>
          </Card>

          {/* Nominee Info */}
          <Card title="Nominee Information" onEdit={() => navigate(`/${basePath}/ni4`)}>
            <Field label="Nominee Name"  name="nominee_name"     value={formData.nominee_name}     onChange={handleChange} required />
            <Field label="D.O.B"         name="nominee_dob"      value={formData.nominee_dob}      onChange={handleChange} type="date" required />
            <Field label="Age"           name="nominee_age"      value={formData.nominee_age}      onChange={handleChange} required />
            <Field label="Relation"      name="nominee_relation" value={formData.nominee_relation} onChange={handleChange} required />
            <Field label="Per. Of Share" name="percentage_share" value={formData.percentage_share} onChange={handleChange} required />
          </Card>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          {/* General / KYC Info */}
          <Card title="Member General Information" onEdit={() => navigate(`/${basePath}/mgi2`)}>
            <Field label="PF No."            name="pf_no"              value={formData.pf_no}              onChange={handleChange} required />
            <Field label="ID Proof Name"     name="id_proof_name"      value={formData.id_proof_name}      onChange={handleChange} required />
            <Field label="ID Proof No."      name="id_proof_no"        value={formData.id_proof_no}        onChange={handleChange} required />
            <Field label="Address Proof"     name="address_proof_name" value={formData.address_proof_name} onChange={handleChange} />
            <Field label="Address Proof No." name="address_proof_no"   value={formData.address_proof_no}   onChange={handleChange} />
            <Field label="Sign. Proof Name"  name="sign_proof_name"    value={formData.sign_proof_name}    onChange={handleChange} required />
            <Field label="PAN Card No."      name="pan_no"             value={formData.pan_no}             onChange={handleChange} required />

            <SectionDivider label="Upload Required Documents For Verification" />
            <div style={uploadGridStyle}>
              <UploadBox label="Upload Image 1" preview={existingFiles.doc1File} required />
              <UploadBox label="Upload Image 2" preview={existingFiles.doc2File} required />
            </div>
          </Card>

          {/* Banking Info */}
          <Card title="Member Banking Information" onEdit={() => navigate(`/${basePath}/mbi3`)}>
            <Field label="Bank Name"   name="bank_name"      value={formData.bank_name}      onChange={handleChange} required />
            <Field label="Branch Name" name="branch_name"    value={formData.branch_name}    onChange={handleChange} required />
            <Field label="Account No." name="account_number" value={formData.account_number} onChange={handleChange} required />
            <Field label="Category"    name="category"       value={formData.category}       onChange={handleChange} required />
            <Field label="IFSC Code"   name="ifsc_code"      value={formData.ifsc_code}      onChange={handleChange} required />
            <Field label="MICR Code"   name="micr_code"      value={formData.micr_code}      onChange={handleChange} required />
          </Card>
        </div>
      </div>

      {/* Done / Submit button */}
      <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
        <button
          onClick={handleDone}
          disabled={loading}
          style={{
            padding: isMobile ? "10px 32px" : "9px 36px",
            background: loading ? "#aaa" : "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            width: isMobile ? "100%" : "auto",
          }}
        >
          {loading ? "Submitting…" : "Done"}
        </button>
      </div>

      {/* ── Success Modal ── */}
      {showModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && handleModalClose()}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: isMobile ? "16px" : 0,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              width: isMobile ? "100%" : 440,
              maxWidth: "95vw",
              boxShadow: "0 4px 24px rgba(1,41,112,0.15)",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #ebeef4",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h5
                style={{
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: 600,
                  color: "#012970",
                  margin: 0,
                }}
              >
                Member Created Successfully
              </h5>
              <button
                onClick={handleModalClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#888",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px 18px" }}>
              <p style={{ fontSize: 14, color: "#333" }}>
                Member Created Successfully with Member ID:{" "}
                <span
                  style={{
                    background: "#e8ecfe",
                    color: "#4154f1",
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {memberId}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}