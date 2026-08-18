import { useState, useEffect } from "react";
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

export default function NI4() {
  const savedNominee = JSON.parse(
  localStorage.getItem("nomineeInfo")
);
const [isSaved, setIsSaved] = useState(false);
const [nomineeRelations, setNomineeRelations] = useState([]);
const [form, setForm] = useState({
  nominee_name: savedNominee?.nominee_name || "",
  nominee_dob: savedNominee?.nominee_dob || "",
  nominee_age: savedNominee?.nominee_age || "",
  nominee_relation: savedNominee?.nominee_relation || "",
  percentage_share: savedNominee?.percentage_share || "",
});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsSaved(false);
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

  const location = useLocation();

const basePath = location.pathname.split("/")[1];

useEffect(() => {
  const fetchNomineeRelations = async () => {
    try {
      const response = await api.get("/users/nominee-relations");
      setNomineeRelations(response.data.data);
    } catch (error) {
      console.error("Failed to fetch nominee relations:", error);
    }
  };
  fetchNomineeRelations();
}, []);

const isFormValid =
  form.nominee_name &&
  form.nominee_dob &&
  form.nominee_age &&
  form.nominee_relation &&
  form.percentage_share;

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
    nominee_dob: dob,
    nominee_age: age.toString(),
  }));

  setIsSaved(false);
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

  localStorage.setItem("nomineeInfo", JSON.stringify(form));

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
            <span style={{ color: "#51678f", fontWeight: "600" }}>Nominee Form</span>
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
  { label: "Nominee Name", name: "nominee_name", type: "text" },
  { label: "D.O.B", name: "nominee_dob", type: "date" },
  { label: "Age", name: "nominee_age", type: "number" },
  { label: "Relation", name: "nominee_relation", type: "text" },
  { label: "Percentage Share", name: "percentage_share", type: "number" },
].map(({ label, name, type }) => (
  <div key={name} style={rowStyle}>
    <div style={labelStyle}>{label} <span style={{ color: "red" }}>*</span></div>
    <div style={fieldCol}>
      {name === "nominee_relation" ? (
<select
  name={name}
  value={form[name]}
  onChange={handleChange}
  style={inputStyle}
>
  <option value="">Select Relation</option>

  {nomineeRelations.map((relation) => (
    <option key={relation} value={relation}>
      {relation}
    </option>
  ))}
</select>
      ) : (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={
            name === "nominee_dob"
              ? handleDOBChange
              : handleChange
          }
          style={{
            ...inputStyle,
            backgroundColor:
              name === "nominee_age" ? "#f8f9fa" : "#fff",
          }}
          readOnly={name === "nominee_age"}
        />
      )}
    </div>
  </div>
))}

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "28px" }}>
            <button type="submit" style={btnOutline}>Save</button>
            <Link
              to={`/${basePath}/edit`}
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