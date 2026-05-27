import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";


const Card = ({
  title,
  currentLabel,
  fieldKey,
  inputLabel,
  step,
  values,
  handleChange,
  inputStyle,
  labelStyle,
  formRowStyle,
  cardStyle,
  titleStyle,
  currentLabelStyle,
  btnStyle,
  onUpdate,
}) => (
    <div style={cardStyle}>
      <h5 style={titleStyle}>{title}</h5>
      <span style={currentLabelStyle}>{currentLabel}</span>
      <div style={formRowStyle}>
        <label style={labelStyle}>{inputLabel}</label>
        <input
          type="number"
          step={step || 1}
          value={values[fieldKey]}
          onChange={(e) => handleChange(fieldKey, e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#4154f1")}
          onBlur={(e) => (e.target.style.borderColor = "#ced4da")}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
        <button
          style={btnStyle}
          onMouseEnter={(e) => {
            e.target.style.background = "#0d6efd";
            e.target.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.color = "#0d6efd";
          }}
          onClick={onUpdate}
          
        >
          Update
        </button>
      </div>
    </div>
  );
  
export default function GlobalUpdates() {
const [values, setValues] = useState({
  tenure: "",
  limit: "",
  pfees: "",
  variable: "",
  thriftRoi: "",
  shareRoi: "",
  loanRoi: "",
});
const API = "http://localhost:5000/api/thrift-fund";
const [current, setCurrent] = useState({
  tenure: 84,
  limit: 500000,
  pfees: 0,
  variable: 16.86,
  roi: 7,
  shareRoi: 0,
  loanRoi: 0,
});

const SHARE_API = "http://localhost:5000/api/share";
const LOAN_API = "http://localhost:5000/api/loan";
const fetchInterestRate = async () => {
  try {
    // thrift roi
    const thriftRes = await axios.get(`${API}/interest-rate`);
    const thriftRate = thriftRes.data.data?.rate ?? 7;

    // share roi
    const shareRes = await axios.get(`${SHARE_API}/share-interest`);
    const shareRate = shareRes.data.data?.rate ?? 0;

    // loan roi
    const loanRes = await axios.get(`${LOAN_API}/interest-rate`);
    const loanRate = loanRes.data.data?.rate ?? 0;

    setCurrent((prev) => ({
      ...prev,
      roi: thriftRate,
      shareRoi: shareRate,
      loanRoi: loanRate,
    }));

    setValues((prev) => ({
      ...prev,
      thriftRoi: String(thriftRate),
      shareRoi: String(shareRate),
      loanRoi: String(loanRate),
    }));
  } catch (error) {
    toast.error("Failed to fetch interest rate");
  }
};
useEffect(() => {
  fetchInterestRate();
}, []);
const updateThriftROI = async () => {
  if (!values.thriftRoi) {
    toast.error("Enter ROI");
    return;
  }

  try {
    await axios.put(`${API}/update-interest`, {
      rate: Number(values.thriftRoi),
      updatedBy: "Admin",
      remarks: "Updated from Global Updates",
    });

    toast.success("ROI updated successfully");

    setCurrent((prev) => ({
      ...prev,
      roi: Number(values.thriftRoi),
    }));
  } catch (error) {
    toast.error("Update failed");
  }
};

const updateShareROI = async () => {
  if (!values.shareRoi) {
    toast.error("Enter Share ROI");
    return;
  }

  try {
    await axios.put(`${SHARE_API}/share-interest`, {
      rate: Number(values.shareRoi),
      updatedBy: "Admin",
      remarks: "Updated from Global Updates",
    });

    toast.success("Share ROI updated successfully");

    setCurrent((prev) => ({
      ...prev,
      shareRoi: Number(values.shareRoi),
    }));
  } catch (error) {
    toast.error("Share ROI update failed");
  }
};

const updateLoanROI = async () => {
  if (!values.loanRoi) {
    toast.error("Enter Loan ROI");
    return;
  }

  try {
    await axios.put(`${LOAN_API}/interest-rate`, {
      rate: Number(values.loanRoi),
      updatedBy: "Admin",
      remarks: "Updated from Global Updates",
    });

    toast.success("Loan ROI updated successfully");

    setCurrent((prev) => ({
      ...prev,
      loanRoi: Number(values.loanRoi),
    }));
  } catch (error) {
    toast.error("Loan ROI update failed");
  }
};

  const handleChange = (field, val) =>
    setValues((prev) => ({ ...prev, [field]: val }));

  const cardStyle = {
    background: "#fff",
    borderRadius: "5px",
    boxShadow: "0px 0 30px rgba(1,41,112,0.1)",
    padding: "0 20px 20px 20px",
  };

  const titleStyle = {
    padding: "20px 0 15px 0",
    fontSize: "18px",
    fontWeight: "500",
    color: "#012970",
    fontFamily: "'Poppins', sans-serif",
    margin: 0,
  };

  const currentLabelStyle = {
    fontSize: "14px",
    color: "#444",
    display: "block",
    marginBottom: "6px",
  };

  const formRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "14px",
    flexWrap: "wrap",
  };

  const labelStyle = {
    fontSize: "14px",
    color: "#444",
    flex: "0 0 140px",
    fontFamily: "'Open Sans', sans-serif",
  };

  const inputStyle = {
    flex: "1 1 120px",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    padding: "6px 10px",
    fontSize: "14px",
    color: "#444",
    outline: "none",
    fontFamily: "'Open Sans', sans-serif",
  };

  const btnStyle = {
    border: "1.5px solid #0d6efd",
    background: "transparent",
    color: "#0d6efd",
    borderRadius: "4px",
    padding: "6px 22px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "'Open Sans', sans-serif",
  };

  return (
    <div
      style={{
        padding: "20px 30px",
        background: "#f6f9ff",
        minHeight: "100vh",
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      {/* Top Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#012970",
              fontFamily: "'Nunito', sans-serif",
              marginBottom: "4px",
            }}
          >
            Global Updates
          </h1>
          <nav style={{ fontSize: "13px", color: "#899bbd", fontFamily: "'Nunito', sans-serif", fontWeight: "600" }}>
            <a href="/index" style={{ color: "#899bbd", textDecoration: "none" }}>Home</a>
            <span style={{ margin: "0 4px" }}>/</span>
            <a href="/admin_update" style={{ color: "#899bbd", textDecoration: "none" }}>Admin Updates</a>
            <span style={{ margin: "0 4px" }}>/</span>
            <span style={{ color: "#51678f" }}>Global Updates</span>
          </nav>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: "#444" }}>
            Regd. 203, Hari Om Commercial Complex
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "#444" }}>
            New Dak Bunglow Road, Patna-800001
          </p>
        </div>
      </div>

      {/* Row 1 — 3 cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 280px" }}>
          <Card
            title="Tenure (months)"
            currentLabel={`Current Tenure: ${current.tenure}`}
            fieldKey="tenure"
            inputLabel="Tenure (months) :"
              values={values}
  handleChange={handleChange}
  inputStyle={inputStyle}
  labelStyle={labelStyle}
  formRowStyle={formRowStyle}
  cardStyle={cardStyle}
  titleStyle={titleStyle}
  currentLabelStyle={currentLabelStyle}
  btnStyle={btnStyle}
  updateThriftROI={updateThriftROI}
          />
        </div>
        <div style={{ flex: "1 1 280px" }}>
          <Card
            title="Limit"
            currentLabel={`Current Limit: ${current.limit}`}
            fieldKey="limit"
            inputLabel="Limit :"
              values={values}
  handleChange={handleChange}
  inputStyle={inputStyle}
  labelStyle={labelStyle}
  formRowStyle={formRowStyle}
  cardStyle={cardStyle}
  titleStyle={titleStyle}
  currentLabelStyle={currentLabelStyle}
  btnStyle={btnStyle}
  updateThriftROI={updateThriftROI}
          />
        </div>
        <div style={{ flex: "1 1 280px" }}>
          <Card
            title="Processing Fees"
            currentLabel={`Current Fees: ${current.pfees}`}
            fieldKey="pfees"
            inputLabel="Processing Fees :"
              values={values}
  handleChange={handleChange}
  inputStyle={inputStyle}
  labelStyle={labelStyle}
  formRowStyle={formRowStyle}
  cardStyle={cardStyle}
  titleStyle={titleStyle}
  currentLabelStyle={currentLabelStyle}
  btnStyle={btnStyle}
  updateThriftROI={updateThriftROI}
          />
        </div>
      </div>

      {/* Row 2 — 2 centered cards */}
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 calc(33.33% - 14px)", minWidth: "280px" }}>
          <Card
            title="Variable change"
            currentLabel={`Current Variable: ${current.variable}`}
            fieldKey="variable"
            inputLabel="New Variable :"
            step="0.001"
              values={values}
  handleChange={handleChange}
  inputStyle={inputStyle}
  labelStyle={labelStyle}
  formRowStyle={formRowStyle}
  cardStyle={cardStyle}
  titleStyle={titleStyle}
  currentLabelStyle={currentLabelStyle}
  btnStyle={btnStyle}
  updateThriftROI={updateThriftROI}
          />
        </div>
        <div style={{ flex: "0 0 calc(33.33% - 14px)", minWidth: "280px" }}>
<Card
  title="Thrift ROI change"
  currentLabel={`Current ROI: ${current.roi}`}
  fieldKey="thriftRoi"
  inputLabel="ROI :"
  values={values}
  handleChange={handleChange}
  inputStyle={inputStyle}
  labelStyle={labelStyle}
  formRowStyle={formRowStyle}
  cardStyle={cardStyle}
  titleStyle={titleStyle}
  currentLabelStyle={currentLabelStyle}
  btnStyle={btnStyle}
  onUpdate={updateThriftROI}
/>
        </div>
        <div style={{ flex: "0 0 calc(33.33% - 14px)", minWidth: "280px" }}>
<Card
  title="Share ROI change"
  currentLabel={`Current ROI: ${current.shareRoi}`}
  fieldKey="shareRoi"
  inputLabel="ROI :"
  values={values}
  handleChange={handleChange}
  inputStyle={inputStyle}
  labelStyle={labelStyle}
  formRowStyle={formRowStyle}
  cardStyle={cardStyle}
  titleStyle={titleStyle}
  currentLabelStyle={currentLabelStyle}
  btnStyle={btnStyle}
  onUpdate={updateShareROI}
/>
        </div>
        <div style={{ flex: "0 0 calc(33.33% - 14px)", minWidth: "280px" }}>
<Card
  title="Loan ROI change"
  currentLabel={`Current ROI: ${current.loanRoi}`}
  fieldKey="loanRoi"
  inputLabel="ROI :"
  values={values}
  handleChange={handleChange}
  inputStyle={inputStyle}
  labelStyle={labelStyle}
  formRowStyle={formRowStyle}
  cardStyle={cardStyle}
  titleStyle={titleStyle}
  currentLabelStyle={currentLabelStyle}
  btnStyle={btnStyle}
  onUpdate={updateLoanROI}
/>
        </div>
      </div>
    </div>
  );
}