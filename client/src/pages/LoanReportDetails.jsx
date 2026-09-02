import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { Printer } from "lucide-react";

export default function LoanReportDetails() {
  const { memberId } = useParams();
const handlePrint = () => {
  const pdfUrl = `${api.defaults.baseURL}/loan/member-loan-details-pdf/${memberId}`;

  window.open(pdfUrl, "_blank");
};

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchMemberLoanDetails();
    fetchAvailableBalance();
    fetchTransactions();
  }, [memberId]);

  const fetchMemberLoanDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(
        `/loan/member-loan-details/${memberId}`
      );

      setMember(res.data.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load member details."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBalance = async () => {
  try {
    const res = await api.get(
      `/loan/available-balance/${memberId}`
    );

    setAvailableBalance(
      Number(res.data?.availableBalance || 0)
    );
  } catch (err) {
    console.error("Failed to fetch available balance:", err);
    setAvailableBalance(0);
  }
};

const fetchTransactions = async () => {
  try {
    const res = await api.get(
      `/loan/transactions/${memberId}`
    );

    setTransactions(res.data.data || []);
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    setTransactions([]);
  }
};

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date)
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-");
  };

  const formatDateTime = (dateString) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loading}>Loading member details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.error}>Member not found.</div>
      </div>
    );
  }

  const role = localStorage.getItem("role");

  return (
    <div className="print-wrapper" style={styles.wrapper}>

        <style>
  {`
    @media print {
      body {
        background: white !important;
      }

      .no-print {
        display: none !important;
      }

      .print-wrapper {
        padding: 0 !important;
        background: white !important;
      }

      .print-card {
        box-shadow: none !important;
        border: 1px solid #dee2e6 !important;
        break-inside: avoid;
      }

      @page {
        size: A4;
        margin: 15mm;
      }
    }

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
      background: linear-gradient(135deg, #0b3d91, #1a4b9b, #2563eb);
      background-size: 200% 200%;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(1, 41, 112, 0.35);
      transition: transform 0.25s ease, box-shadow 0.25s ease, background-position 0.5s ease;
    }

    .premium-print-btn::before {
      content: "";
      position: absolute;
      top: 0;
      left: -75%;
      width: 50%;
      height: 100%;
      background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
      transform: skewX(-25deg);
      transition: left 0.6s ease;
    }

    .premium-print-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(1, 41, 112, 0.45);
      background-position: 100% 50%;
    }

    .premium-print-btn:hover::before {
      left: 130%;
    }

    .premium-print-btn:active {
      transform: translateY(0px) scale(0.97);
    }

    .premium-print-btn .print-icon-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.18);
      border-radius: 50%;
      padding: 3px;
    }
  `}
</style>


      {/* ================= HEADER ================= */}
<div style={styles.pageHeader}>
  <div>
    <h1 style={styles.pageTitle}>Loan Report Details</h1>

    <nav style={styles.breadcrumb}>
      <a
        href={`/${role}/dashboard`}
        style={styles.breadLink}
      >
        Home
      </a>

      <span style={styles.breadSep}>/</span>

      <a
        href={`/${role}/report`}
        style={styles.breadLink}
      >
        Reports
      </a>

      <span style={styles.breadSep}>/</span>

      <a
        href={`/${role}/loan-report`}
        style={styles.breadLink}
      >
        Loan Report
      </a>

      <span style={styles.breadSep}>/</span>

      <span style={styles.breadActive}>
        Details
      </span>
    </nav>
  </div>

  {/* Right Side */}
  <div style={styles.headerRight}>
    <div style={styles.addressBox}>
      <p style={styles.addressText}>
        <strong style={{ fontSize: "15px" }}>
          Regd. 203, Hari Om Commercial Complex
        </strong>
        <br />
        New Dak Bunglow Road, Patna-800001
      </p>
    </div>

<button
  className="no-print premium-print-btn"
  onClick={handlePrint}
>
  <span className="print-icon-badge">
    <Printer size={12} strokeWidth={2.4} />
  </span>
  <span>Print Report</span>
</button>
  </div>
</div>

      {/* ================= MEMBER INFORMATION ================= */}
      <div className="print-card" style={styles.card}>
        <h5 style={styles.cardTitle}>
          Member Information
        </h5>

        <div style={styles.detailsGrid}>
          <DetailItem
            label="Member Code"
            value={member.memberId}
          />

          <DetailItem 
  label="Member Name" 
  value={`${member.firstname || ""} ${member.lastname || ""}`.trim()} 
/>

          <DetailItem
            label="Member D.O.B"
            value={formatDate(member.dob)}
          />

          <DetailItem
            label="Age"
            value={member.age}
          />

          <DetailItem
            label="Gender"
            value={member.gender}
          />

          <DetailItem
            label="Status"
            value={member.status}
          />

          <DetailItem
            label="Guardian Name"
            value={member.guardian_firstname}
          />

          <DetailItem
            label="Guardian Relation"
            value={member.guardian_relation}
          />

          <DetailItem
            label="Phone"
            value={member.phoneno}
          />

          <DetailItem
            label="Email Id"
            value={member.email}
          />

          <DetailItem
            label="House/Flat No."
            value={member.address_line1}
          />

          <DetailItem
            label="Street No./Area"
            value={member.address_line2}
          />

          <DetailItem
            label="State"
            value={member.state}
          />

          <DetailItem
            label="Pincode"
            value={member.pincode}
          />

          <DetailItem
            label="PF No"
            value={member.pf_no}
          />
        </div>
      </div>

      {/* ================= LOAN INFORMATION ================= */}
      <div className="print-card" style={styles.card}>
        <h5 style={styles.cardTitle}>
          Loan Information
        </h5>

        <div style={styles.loanDetailsGrid}>
          <DetailItem
            label="First Loan Date"
            value={member.firstLoanDate}
          />

          <DetailItem
            label="Total Loan Amount"
            value={`₹${Number(
              member.totalLoanAmount || 0
            ).toLocaleString("en-IN")}`}
          />

          <DetailItem 
            label="Available Balance" 
            value={`₹${Number(
              availableBalance || 0
            ).toLocaleString("en-IN")}`} 
          /> 

          <DetailItem
            label="Payment Mode"
            value={member.paymentMode}
          />

          <DetailItem
            label="Transaction ID"
            value={member.transactionId}
          />

          <DetailItem
  label="Loan Paid from Thrift A/C"
  value={`₹${Number(
    member.thriftLoanPaid || 0
  ).toLocaleString("en-IN")}`}
/>

<DetailItem
  label="Loan Paid from Share A/C"
  value={`₹${Number(
    member.shareLoanPaid || 0
  ).toLocaleString("en-IN")}`}
/>
        </div>
      </div>

            {/* ================= TOTAL TRANSACTION DETAILS ================= */}
      <div className="print-card" style={styles.card}>
        <h5 style={styles.cardTitle}>
          Total Transaction Details
        </h5>

        <div
          style={{
            width: "100%",
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "420px",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: "1100px",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr>
                {[
                  "Sl No",
                  "Transaction Date",
                  "Particulars",
                  "Debit",
                  "Credit",
                  "Balance",
                  "No of Days",
                  "Interest Rate",
                  "Product",
                  "Interest Charge",
                  "Interest Balance",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      ...styles.transactionTh,
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      ...styles.transactionTd,
                      textAlign: "center",
                      padding: "25px",
                      color: "#888",
                    }}
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                (() => {
                  let runningBalance = 0;
                  let runningInterestBalance = 0;

                  return transactions.map((item, i) => {
                    const transactionType = String(
                      item.type ||
                        item.transactionType ||
                        ""
                    ).toUpperCase();

                    const amount = Number(
                      item.amount ||
                        item.Amount ||
                        0
                    );

                    const currentDate = new Date(
                      item.TransactionDate ||
                        item.transactionDate ||
                        item.date
                    );

                    // ============================
                    // NO OF DAYS
                    // ============================

                    let noOfDays = "-";

                    if (i < transactions.length - 1) {
                      const nextItem =
                        transactions[i + 1];

                      const nextDate = new Date(
                        nextItem.TransactionDate ||
                          nextItem.transactionDate ||
                          nextItem.date
                      );

                      const diffTime =
                        nextDate.getTime() -
                        currentDate.getTime();

                      const diffDays = Math.floor(
                        diffTime /
                          (1000 * 60 * 60 * 24)
                      );

                      noOfDays = Math.max(
                        diffDays - 1,
                        0
                      );
                    }

                    // ============================
                    // DEBIT → ADD BALANCE
                    // ============================

                    if (
                      transactionType === "DEBIT"
                    ) {
                      runningBalance += amount;
                    }

                    // ============================
                    // INTEREST CHARGE
                    // ============================

                    let interestCharge = 0;

                    if (noOfDays !== "-") {
                      interestCharge =
                        (runningBalance *
                          Number(
                            item.interestRate || 0
                          ) *
                          Number(noOfDays || 0)) /
                        36500;
                    }

                    runningInterestBalance +=
                      interestCharge;

                    // ============================
                    // CREDIT
                    // ============================

                    if (
                      transactionType === "CREDIT"
                    ) {
                      if (
                        amount <=
                        runningInterestBalance
                      ) {
                        runningInterestBalance -=
                          amount;
                      } else {
                        const remainingCredit =
                          amount -
                          runningInterestBalance;

                        runningInterestBalance = 0;

                        runningBalance = Math.max(
                          runningBalance -
                            remainingCredit,
                          0
                        );
                      }
                    }

                    // ============================
                    // PRODUCT
                    // ============================

                    const product =
                      noOfDays !== "-"
                        ? runningBalance *
                          Number(noOfDays || 0)
                        : "-";

                    return (
                      <tr
                        key={item._id || i}
                      >
                        {/* Sl No */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {i + 1}
                        </td>

                        {/* Transaction Date */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {formatDateTime(
                            item.TransactionDate ||
                              item.transactionDate ||
                              item.date
                          )}
                        </td>

                        {/* Particulars */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {item.PaymentMode ||
                            item.paymentMode ||
                            "-"}
                        </td>

                        {/* Debit */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {transactionType ===
                          "DEBIT"
                            ? amount.toFixed(2)
                            : "-"}
                        </td>

                        {/* Credit */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {transactionType ===
                          "CREDIT"
                            ? amount.toFixed(2)
                            : "-"}
                        </td>

                        {/* Balance */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {runningBalance.toFixed(
                            2
                          )}
                        </td>

                        {/* No of Days */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {noOfDays}
                        </td>

                        {/* Interest Rate */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {item.interestRate !==
                            undefined &&
                          item.interestRate !==
                            null &&
                          item.interestRate !== ""
                            ? `${Number(
                                item.interestRate
                              ).toFixed(2)}%`
                            : "-"}
                        </td>

                        {/* Product */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {product !== "-"
                            ? product.toFixed(2)
                            : "-"}
                        </td>

                        {/* Interest Charge */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {noOfDays !== "-"
                            ? interestCharge.toFixed(
                                2
                              )
                            : "-"}
                        </td>

                        {/* Interest Balance */}
                        <td
                          style={
                            styles.transactionTd
                          }
                        >
                          {runningInterestBalance.toFixed(
                            2
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* ================= BALANCE FOOTER ================= */}

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow:
              "0 2px 8px rgba(30,64,175,0.10)",
            border: "1.5px solid #dbeafe",
            width: "fit-content",
            marginLeft: "auto",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              backgroundColor: "#1e40af",
              color: "#fff",
              fontWeight: "700",
              fontSize: "13px",
              padding: "10px 18px",
              whiteSpace: "nowrap",
            }}
          >
            Available Balance
          </div>

          <div
            style={{
              backgroundColor: "#eff6ff",
              color: "#1e40af",
              fontWeight: "800",
              fontSize: "14px",
              padding: "10px 18px",
              whiteSpace: "nowrap",
            }}
          >
            ₹
            {Number(
              availableBalance
            ).toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= DETAIL ITEM ================= */

function DetailItem({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.detailLabel}>{label}</div>

      <div style={styles.detailValue}>
        {value !== undefined &&
        value !== null &&
        value !== ""
          ? value
          : "-"}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  loanDetailsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "0",
  borderTop: "1px solid #dee2e6",
  borderLeft: "1px solid #dee2e6",
},
  wrapper: {
    padding: "20px 24px",
    fontFamily:
      '"Open Sans", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
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

  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "20px",
    marginBottom: "20px",
  },

  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#012970",
    margin: "0 0 20px 0",
    paddingBottom: "10px",
    borderBottom: "1px solid #e9ecef",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "0",
    borderTop: "1px solid #dee2e6",
    borderLeft: "1px solid #dee2e6",
  },

  detailItem: {
    display: "grid",
    gridTemplateColumns: "45% 55%",
    minHeight: "48px",
    borderRight: "1px solid #dee2e6",
    borderBottom: "1px solid #dee2e6",
  },

  detailLabel: {
    padding: "12px",
    backgroundColor: "#f8f9fa",
    fontSize: "14px",
    fontWeight: "600",
    color: "#444",
  },

  detailValue: {
    padding: "12px",
    fontSize: "14px",
    color: "#333",
    wordBreak: "break-word",
  },

  loading: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    textAlign: "center",
    color: "#555",
  },

  error: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    textAlign: "center",
    color: "#dc3545",
  },

  headerRight: {
  display: "flex",
  alignItems: "flex-start",
  gap: "20px",
},

printBtn: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  background: "linear-gradient(135deg, #012970, #1a4b9b)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 18px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 4px 10px rgba(1, 41, 112, 0.2)",
  transition: "all 0.2s ease",
  minWidth: "105px",
},

  transactionTh: {
    padding: "11px 14px",
    textAlign: "left",
    fontWeight: "700",
    color: "#1a2052",
    backgroundColor: "#e2e8f0",
    borderBottom: "2px solid #cbd5e1",
    borderRight: "1px solid #dee2e6",
    whiteSpace: "nowrap",
    fontSize: "13px",
  },

  transactionTd: {
    padding: "10px 14px",
    borderBottom: "1px solid #f0f2ff",
    borderRight: "1px solid #f0f2ff",
    color: "#333",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
};