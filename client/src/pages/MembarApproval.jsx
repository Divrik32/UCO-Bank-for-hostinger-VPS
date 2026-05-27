import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

// ✅ Dummy data — replace with real API call
// const dummyMembers = [
//   { userid: "2023080001", firstname: "Sanjay", lastname: "Kr Verma", phoneno: "9430965129", email: "sanjayverma120789@gmail.com" },
//   { userid: "2023080002", firstname: "Praful", lastname: "Lakra", phoneno: "9337240878", email: "prafullakra12@gmail.com" },
//   { userid: "2023080003", firstname: "Dharmendra", lastname: "Kr Singh", phoneno: "9434475311", email: "dharamm.rai@gmail.com" },
//   { userid: "2023080004", firstname: "Lokesh", lastname: "Kumar", phoneno: "9712940509", email: "" },
//   { userid: "2023080005", firstname: "Satish", lastname: "Kr Singh", phoneno: "8471050834", email: "sunny547@rediffmail.com" },
//   { userid: "2023080006", firstname: "Ranoj", lastname: "Ranjan Kumar", phoneno: "8511376129", email: "ranojranjankumar@gmail.com" },
//   { userid: "2023080007", firstname: "Rohit", lastname: "Shaw", phoneno: "7982863646", email: "shawr1999@gmail.com" },
//   { userid: "2023080008", firstname: "Sunil", lastname: "Kumar Sinha", phoneno: "9471258748", email: "sinha.pg@gmail.com" },
//   { userid: "2026040009", firstname: "Divya", lastname: "Mondal", phoneno: "6295353607", email: "divyamondal2001@gmail.com" },
// ];


export default function MemberApproval() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(
        "http://88.222.245.71:5000/api/users/approval-pending-members"
      );

      setMembers(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch members. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={styles.wrapper}>
      {/* ── Page Header ── */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Member Approval</h1>
          <nav style={styles.breadcrumb}>
            <a href="/index" style={styles.breadLink}>Home</a>
            <span style={styles.breadSep}>/</span>
            <a href="/admin_update" style={styles.breadLink}>Admin Update</a>
            <span style={styles.breadSep}>/</span>
            <span style={styles.breadActive}>Member Approval</span>
          </nav>
        </div>

        <div style={styles.addressBox}>
          <p style={styles.addressText}>
            <strong style={{fontSize:"15px"}}>Regd. 203, Hari Om Commercial Complex</strong>
            <br />
            New Dak Bunglow Road, Patna-800001
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div style={styles.card}>
        <h5 style={styles.cardTitle}>Member Approval</h5>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Member Id</th>
                <th style={styles.th}>Member Name</th>
                <th style={styles.th}>Contact Number</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
<tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={styles.td}>
                    Loading...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.td}>
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((member, idx) => (
                  <tr
                    key={member._id}
                    style={{
                      ...styles.tr,
                      backgroundColor:
                        idx % 2 === 0 ? "white" : "#f9f9f9",
                    }}
                  >
                    <td style={styles.td}>
                      {member.memberId || member._id}
                    </td>

                    <td style={styles.td}>
                      {member.firstname} {member.lastname}
                    </td>

                    <td style={styles.td}>
                      {member.phoneno}
                    </td>

                    <td style={styles.td}>
                      {member.email}
                    </td>

                    <td style={styles.td}>
                      <button
                        style={styles.viewBtn}
                        onClick={() =>
                          navigate(
                            `/admin/member_approval/${member._id}`
                          )
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "20px 24px",
    fontFamily: '"Open Sans", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: "#f6f9fc",
    minHeight: "100vh",
  },

  // ── Header ──
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "24px",
  },
  pageTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#012970",
    margin: "0 0 6px 0",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
  },
  breadLink: {
    color: "#012970",
    textDecoration: "none",
    fontWeight: "500",
  },
  breadSep: {
    color: "#888",
  },
  breadActive: {
    color: "#555",
  },
  addressBox: {
    textAlign: "right",
  },
  addressText: {
    fontSize: "14px",
    color: "#333",
    margin: 0,
    lineHeight: "1.6",
  },

  // ── Card ──
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "20px 20px 8px 20px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#012970",
    margin: "0 0 16px 0",
    paddingBottom: "10px",
    borderBottom: "1px solid #e9ecef",
  },

  // ── Table ──
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    tableLayout: "auto",
  },
  theadRow: {
    backgroundColor: "#f8f9fa",
  },
  th: {
    border: "1px solid #dee2e6",
    padding: "10px 14px",
    textAlign: "center",
    fontWeight: "600",
    color: "#444",
    fontSize: "13px",
  },
  tr: {
    transition: "background-color 0.15s ease",
  },
  td: {
    border: "1px solid #dee2e6",
    padding: "10px 14px",
    textAlign: "center",
    color: "#333",
    verticalAlign: "middle",
  },

  // ── View Button ──
  viewBtn: {
    backgroundColor: "transparent",
    color: "#0f6e56",
    border: "1.5px solid #0f6e56",
    borderRadius: "5px",
    padding: "5px 16px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  },
};