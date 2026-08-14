import { useState, useRef } from "react";
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

export default function MGI2() {

  const savedKyc = JSON.parse(
  localStorage.getItem("kycInfo")
);

const [form, setForm] = useState(() => {
  const saved = JSON.parse(
    localStorage.getItem("kycInfo")
  );

  return saved || {
    pf_no: "",
    id_proof_name: "",
    id_proof_no: "",
    address_proof_name: "",
    address_proof_no: "",
    sign_proof_name: "",
    pan_no: "",
  };
});



const [doc1File, setDoc1File] = useState(
  savedKyc?.doc1File || null
);

const [doc2File, setDoc2File] = useState(
  savedKyc?.doc2File || null
);
const [isSaved, setIsSaved] = useState(false);
// const [doc1File, setDoc1File] = useState(null);
// const [doc2File, setDoc2File] = useState(null);
const [doc1Preview, setDoc1Preview] = useState(
  savedKyc?.doc1File || null
);

const [doc2Preview, setDoc2Preview] = useState(
  savedKyc?.doc2File || null
);
const doc1Ref = useRef(null);
const doc2Ref = useRef(null);

const handleChange = (e) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: value,
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

  const location = useLocation();

const basePath = location.pathname.split("/")[1];
const handleNext = (e) => {
  if (!isSaved) {
    e.preventDefault();
    Swal.fire({
      icon: "error",
      title: "Save Required",
      text: "Please save your KYC details before proceeding.",
    });
  }
};
const isFormValid = true
//   form.pf_no.trim() !== "";
  // form.id_proof_name &&
  // form.id_proof_no &&
  // form.address_proof_name &&
  // form.address_proof_no &&
  // form.sign_proof_name &&
  // form.pan_no &&
  // doc1File &&
  // doc2File;
  
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
    doc1File: doc1Preview,
    doc2File: doc2Preview,
  };

  localStorage.setItem("kycInfo", JSON.stringify(savedData));

  setIsSaved(true); // 🔥 must

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
            <span style={{ color: "#51678f", fontWeight: "600" }}>KYC Form</span>
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
  <div style={labelStyle}>PF No 
    {/* <span style={{ color: "red" }}>*</span> */}
  </div>
  <div style={fieldCol}>
    <input
      type="text"
      name="pf_no"
      value={form.pf_no}
      onChange={handleChange}
      style={inputStyle}
    />
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>ID Proof Name</div>
  <div style={fieldCol}>
<select
  name="id_proof_name"
  value={form.id_proof_name}
  onChange={handleChange}
  style={inputStyle}
>
  <option value="">Select ID Proof</option>
  <option value="Aadhar Card">Aadhar Card</option>
  <option value="Driving Licence">Driving Licence</option>
  <option value="Passport">Passport</option>
  <option value="Pan Card">Pan Card</option>
  <option value="Voter ID Card">Voter ID Card</option>
</select>
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>ID Proof No</div>
  <div style={fieldCol}>
    <input
      type="text"
      name="id_proof_no"
      value={form.id_proof_no}
      onChange={handleChange}
      style={inputStyle}
    />
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>Address Proof</div>
  <div style={fieldCol}>
<select
  name="address_proof_name"
  value={form.address_proof_name}
  onChange={handleChange}
  style={inputStyle}
>
  <option value="">Select Address Proof</option>
  <option value="Aadhar Card">Aadhar Card</option>
  <option value="Driving Licence">Driving Licence</option>
  <option value="Passport">Passport</option>
  <option value="Electricity Bill">Electricity Bill</option>
  <option value="Pan Card">Pan Card</option>
</select>
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>Address Proof No</div>
  <div style={fieldCol}>
    <input
      type="text"
      name="address_proof_no"
      value={form.address_proof_no}
      onChange={handleChange}
      style={inputStyle}
    />
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>Sign Proof Name</div>
  <div style={fieldCol}>
<select
  name="sign_proof_name"
  value={form.sign_proof_name}
  onChange={handleChange}
  style={inputStyle}
>
  <option value="">Select Sign Proof</option>
  <option value="Passport">Passport</option>
  <option value="Pan Card">Pan Card</option>
</select>
  </div>
</div>

<div style={rowStyle}>
  <div style={labelStyle}>PAN Card No</div>
  <div style={fieldCol}>
    <input
      type="text"
      name="pan_no"
      value={form.pan_no}
      onChange={handleChange}
      style={inputStyle}
    />
  </div>
</div>

{/* Verification Documents Section */}
<div style={{ marginTop: "24px", marginBottom: "14px" }}>
  <p
    style={{
      fontSize: "16px",
      fontWeight: "400",
      color: "#222",
      marginBottom: "12px",
      fontFamily: "Open Sans, sans-serif",
    }}
  >
    Upload Required Documents For Verification
  </p>

  <hr
    style={{
      border: "none",
      borderTop: "1px solid #d9d9d9",
      marginBottom: "20px",
    }}
  />

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "30px",
    }}
  >
    {/* Doc 1 */}
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "14px",
          color: "#222",
          fontFamily: "Open Sans, sans-serif",
        }}
      >
        Upload Image
      </label>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #d9d9d9",
          borderRadius: "4px",
          overflow: "hidden",
          cursor: "pointer",
          backgroundColor: "#fff",
          height: "38px",
        }}
      >
        <span
          style={{
            padding: "0 14px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            background: "#f0f0f0",
            borderRight: "1px solid #d9d9d9",
            fontSize: "13px",
            color: "#222",
            fontFamily: "Open Sans, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          Choose File
        </span>
        <span
          style={{
            padding: "0 12px",
            fontSize: "13px",
            color: "#555",
            fontFamily: "Open Sans, sans-serif",
          }}
        >
          {doc1File ? doc1File.name : "No file chosen"}
        </span>
<input
  type="file"
  name="doc1File"
  ref={doc1Ref}
  onChange={(e) =>
  handleFileChange(
    e,
    setDoc1Preview,
    setDoc1File
  )
}
  style={{ display: "none" }}
/>
      </label>
    </div>

    {/* Doc 2 */}
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "14px",
          color: "#222",
          fontFamily: "Open Sans, sans-serif",
        }}
      >
        Upload Image
      </label>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #d9d9d9",
          borderRadius: "4px",
          overflow: "hidden",
          cursor: "pointer",
          backgroundColor: "#fff",
          height: "38px",
        }}
      >
        <span
          style={{
            padding: "0 14px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            background: "#f0f0f0",
            borderRight: "1px solid #d9d9d9",
            fontSize: "13px",
            color: "#222",
            fontFamily: "Open Sans, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          Choose File
        </span>
        <span
          style={{
            padding: "0 12px",
            fontSize: "13px",
            color: "#555",
            fontFamily: "Open Sans, sans-serif",
          }}
        >
          {doc2File ? doc2File.name : "No file chosen"}
        </span>
<input
  type="file"
  name="doc2File"
  ref={doc2Ref}
  onChange={(e) =>
  handleFileChange(
    e,
    setDoc2Preview,
    setDoc2File
  )
}
  style={{ display: "none" }}
/>
      </label>
    </div>
  </div>
</div>





          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "28px" }}>
            <button type="submit" style={btnOutline}>Save</button>
            <Link
              to={`/${basePath}/mbi3`}
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