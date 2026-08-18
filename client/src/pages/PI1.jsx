// import api from "../api/axios";
import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  fontSize: "14px",
  border: "1px solid #ced4da",
  borderRadius: "4px",
  fontFamily: "Open Sans, sans-serif",
  outline: "none",
  backgroundColor: "#fff",
  boxSizing: "border-box",
  color: "#444",
};

const labelStyle = {
  flex: "0 0 160px",
  fontSize: "14px",
  color: "#6980aa",
  textAlign: "right",
  fontFamily: "Open Sans, sans-serif",
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "14px",
  flexWrap: "wrap",
};

const fieldCol = { flex: "1 1 300px" };

const btnOutline = {
  backgroundColor: "transparent",
  border: "1px solid #4154f1",
  color: "#4154f1",
  borderRadius: "4px",
  padding: "9px 32px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "Open Sans, sans-serif",
};

export default function PI1() {
const [form, setForm] = useState(() => {
  const saved = JSON.parse(
    localStorage.getItem("personalInfo")
  );

  return saved || {
    firstname: "",
    lastname: "",
    dob: "",
    date_of_joining: "",
    date_of_retirement: "",
    age: "",
    membershipNumber: "",
    gender: "Male",
    status: "Married",
    guardian_firstname: "",
    guardian_relation: "Father",
    phoneno: "",
    email: "",
    address_line1: "",
    address_line2: "",
    state: "",
    pincode: "",
  };
});

  const [profilePreview, setProfilePreview] = useState(null);
  const [signPreview, setSignPreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [signFile, setSignFile] = useState(null);
  const profileRef = useRef();
  const signRef = useRef();
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsSaved(false);
  };

const location = useLocation();

const basePath = location.pathname.split("/")[1];
const [isSaved, setIsSaved] = useState(false);
const isFormValid =
  form.firstname &&
  form.lastname &&
  form.dob &&
  // form.date_of_joining &&
  // form.date_of_retirement &&
  form.age &&
  form.gender &&
  form.status &&
  form.guardian_firstname &&
  form.guardian_relation &&
  form.phoneno &&
  // form.email &&
  form.address_line1 &&
  form.address_line2 &&
  form.state &&
  form.pincode;
  // profileFile &&
  // signFile;

const handleDOBChange = (e) => {
  const dob = e.target.value;

  let age = "";

  if (dob) {
    const today = new Date();
    const birthDate = new Date(dob);

    age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
  }

  setForm((prev) => ({
    ...prev,
    dob,
    age: age.toString(),
  }));

  setIsSaved(false);
};

const handleFileChange = (e, previewSetter, fileSetter) => {
  const file = e.target.files[0];
  if (!file) return;

  fileSetter(file);

  const reader = new FileReader();
  reader.onload = (ev) => previewSetter(ev.target.result);
  reader.readAsDataURL(file);
};

const handleNext = (e) => {
  if (!isSaved) {
    e.preventDefault();
    Swal.fire({
      icon: "error",
      title: "Save Required",
      text: "Please save your details before proceeding.",
    });
  }
};

const handleSubmit = (e) => {
  e.preventDefault();

  if (!isFormValid) {
    Swal.fire({
      icon: "warning",
      title: "Incomplete Form",
      text: "Please fill in all required fields.",
    });
    return;
  }

  const savedData = {
    ...form,
    profile_image: profilePreview,
    signature_image: signPreview,
  };

  localStorage.setItem("personalInfo", JSON.stringify(savedData));

  setIsSaved(true); // 🔥 important

  Swal.fire({
    icon: "success",
    title: "Saved Successfully",
    timer: 1200,
    showConfirmButton: false,
  });
};

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f6f9ff", padding: "24px 32px", fontFamily: "Open Sans, sans-serif" }}>

      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "600", color: "#012970", margin: 0, fontFamily: "Nunito, sans-serif" }}>Registration Form</h1>
          <nav style={{ fontSize: "13px", color: "#899bbd", marginTop: "4px" }}>
            <a href="/" style={{ color: "#899bbd", textDecoration: "underline" }}>Home</a>
            <span style={{ margin: "0 6px" }}>/</span>
            <span>Member</span>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ color: "#51678f", fontWeight: "600" }}>Personal Information</span>
          </nav>
        </div>
        <div style={{ textAlign: "right", fontSize: "13px", color: "#666", lineHeight: 1.7 }}>
          <strong style={{ color: "#333", fontWeight: "700", fontSize: "14px", display: "block" }}>Regd. 203, Hari Om Commercial Complex</strong>
          New Dak Bunglow Road, Patna-800001
        </div>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: "5px", boxShadow: "0px 0 30px rgba(1,41,112,0.1)", padding: "28px 32px" }}>
        <form onSubmit={handleSubmit}>

          {/* Standard fields */}
          {[
            { label: "Member Name",      name: "firstname",          type: "text" },
            { label: "Last Name",        name: "lastname",           type: "text" },
            { label: "Member D.O.B",     name: "dob",                type: "date", onChange: handleDOBChange, },
              { 
    label: "Date of Joining", 
    name: "date_of_joining", 
    type: "date" 
  },

  { 
    label: "Date of Retirement", 
    name: "date_of_retirement", 
    type: "date" 
  },
            { label: "Age",              name: "age",                type: "number" },
            {label: "Membership Number", name: "membershipNumber",   type: "text"},
            { label: "Guardian Name",    name: "guardian_firstname", type: "text" },
            { label: "Phone",            name: "phoneno",            type: "tel" },
            { label: "Email Id",         name: "email",              type: "email" },
          ].map(({ label, name, type, onChange }) => (
            <div key={name} style={rowStyle}>
<div style={labelStyle}>
  {label}
  {name !== "membershipNumber" &&
   name !== "date_of_joining" &&
   name !== "date_of_retirement" &&
   name !== "email" && (
    <span style={{ color: "red" }}> *</span>
  )}
</div>
              <div style={fieldCol}>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={onChange || handleChange}
                  style={{
                    ...inputStyle,
                    backgroundColor: name === "age" ? "#f8f9fa" : "#fff",
                    cursor: name === "age" ? "not-allowed" : "text",
                  }}
                  readOnly={name === "age"}
                />
              </div>
            </div>
          ))}

          {/* Gender */}
          <div style={rowStyle}>
            <div style={labelStyle}>Gender <span style={{ color: "red" }}>*</span></div>
            <div style={fieldCol}>
              <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div style={rowStyle}>
            <div style={labelStyle}>Status <span style={{ color: "red" }}>*</span></div>
            <div style={fieldCol}>
              <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                <option>Married</option>
                <option>Unmarried</option>
                <option>Widow</option>
                <option>Widower</option>
              </select>
            </div>
          </div>

          {/* Guardian Relation */}
          <div style={rowStyle}>
            <div style={labelStyle}>Guardian Relation <span style={{ color: "red" }}>*</span></div>
            <div style={fieldCol}>
              <select name="guardian_relation" value={form.guardian_relation} onChange={handleChange} style={inputStyle}>
                <option>Father</option>
                <option>Mother</option>
                <option>Husband</option>
                <option>Wife</option>
                <option>Son</option>
                <option>Daughter</option>
              </select>
            </div>
          </div>

          {/* Address Section */}
          <div style={{ marginTop: "20px", marginBottom: "14px" }}>
            <p style={{ fontSize: "14px", fontWeight: "600", color: "#444", marginBottom: "8px" }}>Address <span style={{ color: "red" }}>*</span></p>
            <hr style={{ border: "none", borderTop: "1px solid #ebeef4", marginBottom: "14px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#444", marginBottom: "6px", display: "block" }}>House/Flat No. <span style={{ color: "red" }}>*</span></label>
                <input name="address_line1" value={form.address_line1} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#444", marginBottom: "6px", display: "block" }}>Street no./Area <span style={{ color: "red" }}>*</span></label>
                <input name="address_line2" value={form.address_line2} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#444", marginBottom: "6px", display: "block" }}>State <span style={{ color: "red" }}>*</span></label>
                <select name="state" value={form.state} onChange={handleChange} style={inputStyle}>
                  <option value="">-- Select State --</option>
                  {["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#444", marginBottom: "6px", display: "block" }}>Pincode <span style={{ color: "red" }}>*</span></label>
                <input name="pincode" value={form.pincode} onChange={handleChange} style={inputStyle} maxLength={6} />
              </div>
            </div>
          </div>

          {/* Image Uploads */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "20px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "#444", marginBottom: "6px", display: "block" }}>Upload Image</label>
<input
  ref={profileRef}
  type="file"
  name="profile_image"
  accept="image/*"
  style={{ ...inputStyle, padding: "4px 6px", cursor: "pointer" }}
  onChange={(e) =>
  handleFileChange(
    e,
    setProfilePreview,
    setProfileFile
  )
}
/>
              {profilePreview && (
                <img src={profilePreview} alt="profile preview"
                  style={{ marginTop: "8px", width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ebeef4" }} />
              )}
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#444", marginBottom: "6px", display: "block" }}>Upload Image</label>
<input
  ref={signRef}
  type="file"
  name="signature_image"
  accept="image/*"
  style={{ ...inputStyle, padding: "4px 6px", cursor: "pointer" }}
  onChange={(e) =>
  handleFileChange(
    e,
    setSignPreview,
    setSignFile
  )
}
/>
              {signPreview && (
                <img src={signPreview} alt="signature preview"
                  style={{ marginTop: "8px", height: "50px", maxWidth: "160px", objectFit: "contain", border: "1px solid #ebeef4", borderRadius: "4px" }} />
              )}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "28px" }}>
            <button type="submit" style={btnOutline}>Save</button>
            <Link
              to={`/${basePath}/mgi2`}
              onClick={handleNext}
              style={{
                ...btnOutline,
                textDecoration: "none",
                pointerEvents: isFormValid ? "auto" : "none",
                opacity: isFormValid ? 1 : 0.5,
              }}>
              Next
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}