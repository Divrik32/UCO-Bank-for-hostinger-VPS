import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Printer } from "lucide-react";

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


export default function LoanReport() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberCodeSearch, setMemberCodeSearch] = useState("");
  const [membershipNumberSearch, setMembershipNumberSearch] = useState("");
  const [memberNameSearch, setMemberNameSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
  const pdfUrl =
    `${api.defaults.baseURL}/loan/loan-report-pdf`;

  window.open(pdfUrl, "_blank");
};
  
  const fetchReports = async () => {
    try {
      const res = await api.get("/loan/loan-report");
      setReports(res.data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  const filteredReports = reports.filter((report) => {
    // Member Code
    const matchMemberCode = report.memberCode
      ?.toLowerCase()
      .includes(memberCodeSearch.toLowerCase());

    // Membership Number
    const matchMembershipNumber = report.membershipNumber
      ?.toLowerCase()
      .includes(membershipNumberSearch.toLowerCase());
  
    // Member Name
    const matchMemberName = report.memberName
      ?.toLowerCase()
      .includes(memberNameSearch.toLowerCase());
  
    // Date Filter
    let matchDate = true;
  
    if (fromDate || toDate) {
      if (report.firstLoanDate === "-") {
        matchDate = false;
      } else {
        const [day, month, year] = report.firstLoanDate.split("-");
        const reportDate = new Date(`${year}-${month}-${day}`);
  
        if (fromDate && reportDate < new Date(fromDate))
          matchDate = false;
  
        if (toDate && reportDate > new Date(toDate))
          matchDate = false;
      }
    }
  
    return matchMemberCode && matchMembershipNumber && matchMemberName && matchDate;
  });


  return (<>
  <style>
{`
  .premium-print-btn {
    position: relative;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 9px;

    padding: 11px 22px;

    font-family: inherit;
    font-size: 14px;
    font-weight: 600;

    color: #ffffff;

    background:
      linear-gradient(
        135deg,
        #0b3d91,
        #1a4b9b,
        #2563eb
      );

    border: none;
    border-radius: 10px;

    cursor: pointer;

    overflow: hidden;

    box-shadow:
      0 4px 14px
      rgba(1, 41, 112, 0.35);

    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;
  }

  .premium-print-btn:hover {
    transform: translateY(-2px);

    box-shadow:
      0 8px 20px
      rgba(1, 41, 112, 0.45);
  }

  .premium-print-btn:active {
    transform: scale(0.97);
  }

  .premium-print-btn .print-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;

    background:
      rgba(255,255,255,0.18);

    border-radius: 50%;

    padding: 3px;
  }
`}
</style>
    <div style={styles.wrapper}>
    {/* ── Page Header ── */}
    <div style={styles.pageHeader}>
    <div>
      {role === "admin" ? (
        <>
          <h1 style={styles.pageTitle}>Loan Approval</h1>
          <nav style={styles.breadcrumb}>
            <a href={`/${role}/dashboard`} style={styles.breadLink}>
              Home
            </a>
            <span style={styles.breadSep}>/</span>
            <a href={`/${role}/admin-update`} style={styles.breadLink}>
              Admin Update
            </a>
            <span style={styles.breadSep}>/</span>
            <span style={styles.breadActive}>Loan Approval</span>
          </nav>
        </>
      ) : (
        <>
          <h1 style={styles.pageTitle}>Loan Report</h1>
          <nav style={styles.breadcrumb}>
            <a href={`/${role}/dashboard`} style={styles.breadLink}>
              Home
            </a>
            <span style={styles.breadSep}>/</span>
            <a href={`/${role}/report`} style={styles.breadLink}>
              Reports
            </a>
            <span style={styles.breadSep}>/</span>
            <span style={styles.breadActive}>Loan Report</span>
          </nav>
        </>
      )}
    </div>
      <div style={styles.addressBox}>
          <p style={styles.addressText}>
            <strong style={{fontSize:"15px"}}>Regd. 203, Hari Om Commercial Complex</strong>
            <br />
            New Dak Bunglow Road, Patna-800001
          </p>
        </div>
      </div>
<div style={styles.filterRow}>
  {/* Member Code */}
  <input
    type="text"
    placeholder="Search Member Code"
    value={memberCodeSearch}
    onChange={(e) => setMemberCodeSearch(e.target.value)}
    style={styles.searchInput}
  />

  {/* Membership Number */}
  <input
    type="text"
    placeholder="Search Membership Number"
    value={membershipNumberSearch}
    onChange={(e) =>
      setMembershipNumberSearch(e.target.value)
    }
    style={styles.searchInput}
  />

  {/* Member Name */}
  <input
    type="text"
    placeholder="Search Member Name"
    value={memberNameSearch}
    onChange={(e) => setMemberNameSearch(e.target.value)}
    style={styles.searchInput}
  />

  {/* From Date */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
  >
    <label>From</label>

    <input
      type="date"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
      style={styles.searchInput}
    />
  </div>

  {/* To Date */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
  >
    <label>To</label>

    <input
      type="date"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
      style={styles.searchInput}
    />
  </div>

  {/* Print Button */}
<button
  className="no-print premium-print-btn"
  onClick={handlePrint}
  style={{
    marginLeft: "auto",
    flexShrink: 0,
    alignSelf: "flex-end",
  }}
>
    <span className="print-icon-badge">
      <Printer
        size={12}
        strokeWidth={2.4}
      />
    </span>

    <span>Print</span>
  </button>
</div>

      {/* ── Table Card ── */}
      <div style={styles.card}>
        <h5 style={styles.cardTitle}>Loan Approval</h5>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>Sl.</th>
              <th style={styles.th}>Member Code</th>
              <th style={styles.th}>Membership Number</th>
              <th style={styles.th}>Member Name</th>
              <th style={styles.th}>First Loan Date</th>
              <th style={styles.th}>Total Loan Amount</th>
              <th style={styles.th}>Interest</th>
              <th style={styles.th}>Payment Mode</th>
              <th style={styles.th}>Transaction ID</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={styles.td}>
                  Loading...
                </td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan={10} style={styles.td}>
                  No loan report found.
                </td>
              </tr>
            ) : (
              filteredReports.map((report, index) => (
                <tr key={report.memberCode}>
                  <td style={styles.td}>{index + 1}</td>
          
                  <td style={styles.td}>
                    {report.memberCode || "-"}
                  </td>
                  <td style={styles.td}>
                    {report.membershipNumber || "-"}
                  </td>
          
                  <td style={styles.td}>
                    {report.memberName || "-"}
                  </td>
          
                  <td style={styles.td}>
                    {report.firstLoanDate}
                  </td>
          
                  <td style={styles.td}>
                    ₹{Number(report.totalLoanAmount || 0).toLocaleString()}
                  </td>
          
                  <td style={styles.td}>
                    {report.interest}
                  </td>
          
                  <td style={styles.td}>
                    {report.paymentMode || "-"}
                  </td>
          
                  <td style={styles.td}>
                    {report.transactionId || "-"}
                  </td>

                 <td style={styles.td}>
                   <button
                     style={styles.viewBtn}
                     onClick={() =>
                       navigate(`/${role}/loan-report-details/${report.memberCode}`)
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
    </>
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

  searchInput: {
    padding: "8px 12px",
    border: "1px solid #ced4da",
    borderRadius: "6px",
    fontSize: "14px",
    minWidth: "180px",
    outline: "none",
  },
  headerRight: {
  display: "flex",
  alignItems: "flex-start",
  gap: "20px",
},
filterRow: {
  display: "flex",
  alignItems: "flex-end",
  gap: "15px",
  flexWrap: "wrap",
  marginBottom: "20px",

  width: "100%",
  boxSizing: "border-box",

  padding: "0",
},
};