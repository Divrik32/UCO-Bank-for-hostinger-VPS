import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";


// ── Dummy data for preview ──────────────────────────────────────────────────
const dummyMember = {
  userid: "2023080001",
  firstname: "Sanjay",
  lastname: "Kr Verma",
  dob: "1970-06-04",
  age: 52,
  gender: "Male",
  status: "Married",
  guardian_firstname: "Late Sarjug Prasad",
  guardian_relation: "Father",
  phoneno: "9430965129",
  email: "sanjayverma120789@gmail.com",
  address_line1: "Hakimganj",
  address_line2: "Shiv Mandir",
  state: "Bihar",
  pincode: "800008",
  bankname: "UCO Bank",
  branchName: "F. I Patna",
  accountno: "41420245",
  category: "Saving Account",
  ifsc_code: "UCBA0001234",
  micr_code: "800028001",
  pf_no: "43010",
  id_proof_name: "Aadhar Card",
  id_proof_no: "4545454",
  address_proof_name: "Aadhar Card",
  address_proof_no: "45545455",
  sign_proof_name: "Passport",
  pan_no: "4156494",
  image1: null,
  image2: null,
  nomi_name: "Neelam Verma",
  nomi_dob: "",
  nomi_age: 48,
  nomi_relation: "Spouse",
  nomi_per_share: 100,
};
// ────────────────────────────────────────────────────────────────────────────

// Reusable row component
function InfoRow({ label, value }) {
  return (
    <div style={rowStyles.row}>
      <span style={rowStyles.label}>{label}</span>
      <span style={rowStyles.value}>{value || "—"}</span>
    </div>
  );
}

// Reusable card component
function InfoCard({ title, children }) {
  return (
    <div style={cardStyles.card}>
      <h5 style={cardStyles.title}>{title}</h5>
      <div style={cardStyles.body}>{children}</div>
    </div>
  );
}

export default function MemberApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null); 
  const [loading, setLoading] = useState(false);

  // ── Uncomment for real API ──
  // useEffect(() => {
  //   setLoading(true);
  //   axios
  //     .get(`http://localhost:5000/api/member_approval/${userid}`, {
  //       headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  //     })
  //     .then((res) => setMember(res.data))
  //     .catch((err) => console.error(err))
  //     .finally(() => setLoading(false));
  // }, [userid]);

  useEffect(() => {
  setLoading(true);

  axios
    .get(`http://localhost:5000/api/users/members/${id}`)
    .then((res) => {
      setMember(res.data.data); // ⚠️ important
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => setLoading(false));

}, [id]);
const fixPath = (path) => path.replace(/\\/g, "/");
  const handleApprove = () => {
    axios
      .get(`http://localhost:5000/approve_member/${member.userid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(() => { alert("Member Approved!"); navigate("/member_approval"); })
      .catch((err) => console.error(err));
  };

  const handleDeny = () => {
    axios
      .get(`http://localhost:5000/deny_member/${member.userid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(() => { alert("Member Denied."); navigate("/member_approval"); })
      .catch((err) => console.error(err));
  };

  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;
  if (!member) return <p style={{ padding: 24 }}>Member not found.</p>;

  return (
    <div style={styles.wrapper}>
      {/* ── Page Header ── */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Member Approval</h1>
          <nav style={styles.breadcrumb}>
            <a href="/index" style={styles.breadLink}>Home</a>
            <span style={styles.breadSep}>/</span>
            <a href="/admin_update" style={styles.breadLink}>Admin Updates</a>
            <span style={styles.breadSep}>/</span>
            <span style={styles.breadActive}>Member Approval</span>
          </nav>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={styles.addressText}>
            <strong>Regd. 203, Hari Om Commercial Complex</strong>
            <br />
            New Dak Bunglow Road, Patna-800001
          </p>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div style={styles.grid}>

        {/* ── LEFT COLUMN ── */}
        <div style={styles.col}>

          <InfoCard title="Member Details">
            <InfoRow label="Member Name"       value={member.firstname} />
            <InfoRow label="Last Name"         value={member.lastname} />
            <InfoRow label="Member D.O.B"      value={member.dob} />
            <InfoRow label="Age"               value={member.age} />
            <InfoRow label="Gender"            value={member.gender} />
            <InfoRow label="Status"            value={member.status} />
            <InfoRow label="Guardian Name"     value={member.guardian_firstname} />
            <InfoRow label="Guardian Relation" value={member.guardian_relation} />
            <InfoRow label="Phone"             value={member.phoneno} />
            <InfoRow label="Email Id"          value={member.email} />
            <InfoRow label="House/Flat No."    value={member.address_line1} />
            <InfoRow label="Street No./Area"   value={member.address_line2} />
            <InfoRow label="State"             value={member.state} />
            <InfoRow label="Pincode"           value={member.pincode} />

            {/* Profile and signature images */}
            <div style={styles.imgRow}>
              {member.profile_image ? (
                <img
                  src={`http://localhost:5000/${fixPath(member.profile_image)}`}
                  alt="ID proof"
                  style={styles.docImg}
                />
              ) : (
                <div style={styles.imgPlaceholder}>ID Photo</div>
              )}
              {member.signature_image ? (
                <img
                  src={`http://localhost:5000/${fixPath(member.signature_image)}`}
                  alt="Signature"
                  style={{ ...styles.docImg, height: 50 }}
                />
              ) : (
                <div style={{ ...styles.imgPlaceholder, height: 50 }}>Signature</div>
              )}
            </div>

          </InfoCard>

          <InfoCard title="Member Banking Information">
            <InfoRow label="Bank Name"    value={member.bank_name} />
            <InfoRow label="Branch Name"  value={member.branch_name} />
            <InfoRow label="Account No."  value={member.account_number} />
            <InfoRow label="Category"     value={member.category} />
            <InfoRow label="IFSC Code"    value={member.ifsc_code} />
            <InfoRow label="MICR Code"    value={member.micr_code} />
          </InfoCard>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={styles.col}>

          <InfoCard title="KYC Details">
            <InfoRow label="PF No"              value={member.pf_no} />
            <InfoRow label="Gender"             value={member.gender} />
            <InfoRow label="ID Proof Name"      value={member.id_proof_name} />
            <InfoRow label="ID Proof No"        value={member.id_proof_no} />
            <InfoRow label="Address Proof"      value={member.address_proof_name} />
            <InfoRow label="Address Proof No"   value={member.address_proof_no} />
            <InfoRow label="Sign. Proof Name"   value={member.sign_proof_name} />
            <InfoRow label="PAN Card No"        value={member.pan_no} />

            {/* Document images */}
            <div style={styles.imgRow}>
              {member.doc1File ? (
                <img
                  src={`http://localhost:5000/${fixPath(member.doc1File)}`}
                  alt="KYC Document 1"
                  style={styles.docImg}
                />
              ) : (
                <div style={styles.imgPlaceholder}>KYC Document 1</div>
              )}
              {member.doc2File ? (
                <img
                  src={`http://localhost:5000/${fixPath(member.doc2File)}`}
                  alt="KYC document 2"
                  style={{ ...styles.docImg, height: 50 }}
                />
              ) : (
                <div style={{ ...styles.imgPlaceholder, height: 50 }}>KYC document 2</div>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Nominee Details">
            <InfoRow label="Nominee Name"  value={member.nominee_name} />
            <InfoRow label="D.O.B"         value={member.nominee_dob} />
            <InfoRow label="Age"           value={member.nominee_age} />
            <InfoRow label="Relation"      value={member.nominee_relation} />
            <InfoRow label="Per. Of Share" value={member.percentage_share ? `${member.percentage_share}%` : ""} />
          </InfoCard>

        </div>
      </div>

      {/* ── Approve / Deny buttons ── */}
      <div style={styles.actionRow}>
        <button
          style={styles.approveBtn}
          onClick={handleApprove}
          onMouseEnter={(e) => { e.target.style.backgroundColor = "#0f6e56"; e.target.style.color = "white"; }}
          onMouseLeave={(e) => { e.target.style.backgroundColor = "transparent"; e.target.style.color = "#0f6e56"; }}
        >
          Approve
        </button>
        <button
          style={styles.denyBtn}
          onClick={handleDeny}
          onMouseEnter={(e) => { e.target.style.backgroundColor = "#c0392b"; e.target.style.color = "white"; }}
          onMouseLeave={(e) => { e.target.style.backgroundColor = "transparent"; e.target.style.color = "#c0392b"; }}
        >
          Deny
        </button>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    padding: "20px 24px",
    fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
    backgroundColor: "#f6f9fc",
    minHeight: "100vh",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "24px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#012970",
    margin: "0 0 6px 0",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
  },
  breadLink: {
    color: "#012970",
    textDecoration: "none",
    fontWeight: "500",
  },
  breadSep: { color: "#888" },
  breadActive: { color: "#555" },
  addressText: {
    fontSize: "13px",
    color: "#333",
    margin: 0,
    lineHeight: "1.6",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    alignItems: "start",
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  imgRow: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "12px",
  },
  docImg: {
    height: 100,
    objectFit: "contain",
    border: "1px solid #dee2e6",
    borderRadius: 6,
    padding: 4,
    background: "#fff",
  },
  imgPlaceholder: {
    height: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px dashed #bbb",
    borderRadius: 6,
    color: "#aaa",
    fontSize: 13,
    background: "#fafafa",
  },
  actionRow: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginTop: "28px",
    paddingBottom: "32px",
  },
  approveBtn: {
    backgroundColor: "transparent",
    color: "#0f6e56",
    border: "1.5px solid #0f6e56",
    borderRadius: "6px",
    padding: "9px 36px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  },
  denyBtn: {
    backgroundColor: "transparent",
    color: "#c0392b",
    border: "1.5px solid #c0392b",
    borderRadius: "6px",
    padding: "9px 36px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  },
};

const cardStyles = {
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "16px 20px 8px 20px",
  },
  title: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#012970",
    margin: "0 0 12px 0",
    paddingBottom: "8px",
    borderBottom: "1px solid #e9ecef",
  },
  body: {
    display: "flex",
    flexDirection: "column",
  },
};

const rowStyles = {
  row: {
    display: "flex",
    padding: "6px 0",
    borderBottom: "0.5px solid #f0f0f0",
    gap: "8px",
    fontSize: "13.5px",
  },
  label: {
    minWidth: "160px",
    color: "#555",
    fontWeight: "500",
    flexShrink: 0,
  },
  value: {
    color: "#222",
    wordBreak: "break-word",
  },
};