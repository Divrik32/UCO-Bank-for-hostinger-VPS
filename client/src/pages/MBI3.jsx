import { useState } from "react";
import api from "../api/axios";
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

export default function MBI3() {

  const savedBank = JSON.parse(
  localStorage.getItem("bankInfo")
);
const [isSaved, setIsSaved] = useState(false);
const [form, setForm] = useState({
  bank_name: savedBank?.bank_name || "",
  branch_name: savedBank?.branch_name || "",
  account_number: savedBank?.account_number || "",
  category: savedBank?.category || "",
  ifsc_code: savedBank?.ifsc_code || "",
  micr_code: savedBank?.micr_code || "",
});

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

const isFormValid =
  form.bank_name &&
  form.branch_name &&
  form.account_number &&
  form.category &&
  form.ifsc_code &&
  form.micr_code;

  // const handleDOBChange = (e) => {
  //   const dob = e.target.value;
  //   let age = "";
  //   if (dob) {
  //     const today = new Date();
  //     const birthDate = new Date(dob);
  //     age = today.getFullYear() - birthDate.getFullYear();
  //     const m = today.getMonth() - birthDate.getMonth();
  //     if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  //   }
  //   setForm((prev) => ({ ...prev, dob, age: age.toString() }));
  // };

// const handleFileChange = (e, previewSetter, fileSetter) => {
//   const file = e.target.files[0];
//   if (!file) return;

//   fileSetter(file);

//   const reader = new FileReader();
//   reader.onload = (ev) => previewSetter(ev.target.result);
//   reader.readAsDataURL(file);
// };

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

  localStorage.setItem("bankInfo", JSON.stringify(form));

  setIsSaved(true); // 🔥 MUST

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
            <span style={{ color: "#51678f", fontWeight: "600" }}>Member Banking Information</span>
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


   <div style={rowStyle}>
  <div style={labelStyle}>Bank Name <span style={{ color: "red" }}>*</span></div>
  <div style={fieldCol}>
<select
  name="bank_name"
  value={form.bank_name}
  onChange={handleChange}
  style={inputStyle}
>
  <option value="">Select Bank</option>
  <option value="Axis Bank">Axis Bank</option>
  <option value="Bank Of Baroda">Bank Of Baroda</option>
  <option value="Bank Of India">Bank Of India</option>
  <option value="Canara Bank">Canara Bank</option>
  <option value="Central Bank Of India">Central Bank Of India</option>
  <option value="HDFC">HDFC</option>
  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
  <option value="Punjab National Bank">Punjab National Bank</option>
  <option value="State Bank Of India">State Bank Of India</option>
  <option value="UCO Bank">UCO Bank</option>
  <option value="Union Bank Of India">Union Bank Of India</option>
</select>
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>Branch Name <span style={{ color: "red" }}>*</span></div>
  <div style={fieldCol}>
    <input
      type="text"
      name="branch_name"
      value={form.branch_name}
      onChange={handleChange}
      style={inputStyle}
    />
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>Account Number <span style={{ color: "red" }}>*</span></div>
  <div style={fieldCol}>
    <input
      type="text"
      name="account_number"
      value={form.account_number}
      onChange={handleChange}
      style={inputStyle}
    />
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>Category <span style={{ color: "red" }}>*</span></div>
  <div style={fieldCol}>
<select
  name="category"
  value={form.category}
  onChange={handleChange}
  style={inputStyle}
>
  <option value="">Select Category</option>
  <option value="Saving Account">Saving Account</option>
  <option value="Current Account">Current Account</option>
  <option value="Salary Account">Salary Account</option>
</select>
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>IFSC Code <span style={{ color: "red" }}>*</span></div>
  <div style={fieldCol}>
    <input
      type="text"
      name="ifsc_code"
      value={form.ifsc_code}
      onChange={handleChange}
      style={inputStyle}
    />
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>MICR Code <span style={{ color: "red" }}>*</span></div>
  <div style={fieldCol}>
    <input
      type="text"
      name="micr_code"
      value={form.micr_code}
      onChange={handleChange}
      style={inputStyle}
    />
  </div>
</div>


          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "28px" }}>
            <button type="submit" style={btnOutline}>Save</button>
            <Link
              to={`/${basePath}/ni4`}
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