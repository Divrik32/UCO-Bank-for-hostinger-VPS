import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { Printer } from "lucide-react";

export default function ShareDetails() {
  const { memberId } = useParams();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // PRINT REPORT
  // ==========================================
  const handlePrint = () => {
    const pdfUrl =
      `${api.defaults.baseURL}/share/member-share-details-pdf/${memberId}`;

    window.open(pdfUrl, "_blank");
  };

  // ==========================================
  // FETCH MEMBER SHARE DETAILS
  // ==========================================
  useEffect(() => {
    fetchMemberShareDetails();
  }, [memberId]);

const fetchMemberShareDetails = async () => {
  try {
    setLoading(true);
    setError("");

    // ==========================================
    // MEMBER DETAILS
    // ==========================================
    const res = await api.get(
      `/share/member-share-details/${memberId}`
    );

    const memberData = res.data.data;

    // ==========================================
    // FETCH SHARE TRANSACTIONS
    // SAME LOGIC AS SharePurchase
    // ==========================================
    const creditRes = await api.get(
      `/share/credit-share/${memberId}`
    );

    const debitRes = await api.get(
      `/share/debit-share/${memberId}`
    );

    const loanAdjustmentRes = await api.get(
      `/loan/loan-adjustment/${memberId}`
    );

    // ==========================================
    // CREDIT TRANSACTIONS
    // ==========================================
    const credits = creditRes.data.data.map((item) => ({
      id: item._id,
      amount: Number(item.investmentAmount || 0),
      transactionType: "Credit",
      createdAt: item.createdAt,
      bookNo: item.bookNo || "",
      certificateNo: item.certificateNo || "",
    }));

    // ==========================================
    // DEBIT TRANSACTIONS
    // ==========================================
    const debits = debitRes.data.data.map((item) => ({
      id: item._id,
      amount: Number(item.amount || 0),
      transactionType: "Debit",
      createdAt: item.createdAt,
      bookNo: item.bookNo || "",
      certificateNo: item.certificateNo || "",
    }));

    // ==========================================
    // LOAN ADJUSTMENTS
    // ONLY:
    // Amount given from Share A/C
    // Both
    // ==========================================
    const loanAdjustments = loanAdjustmentRes.data.data
      .filter(
        (item) =>
          item.paymentMode === "Amount given from Share A/C" ||
          item.paymentMode === "Both"
      )
      .map((item) => {
        const adjustmentAmount =
          item.paymentMode === "Both"
            ? Number(item.shareAdjustmentAmount || 0)
            : Number(item.adjustmentAmount || 0);

        return {
          id: item._id,
          amount: adjustmentAmount,
          transactionType: "Debit",
          createdAt: item.createdAt,
          bookNo: "",
          certificateNo: "",
          isLoanAdjustment: true,
        };
      });

    // ==========================================
    // COMBINE ALL TRANSACTIONS
    // ==========================================
    const allTransactions = [
      ...credits,
      ...debits,
      ...loanAdjustments,
    ];

    // ==========================================
    // EARLIEST → LATEST
    // ==========================================
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return dateA - dateB;
    });

    // ==========================================
    // SET MEMBER WITH FINAL TRANSACTIONS
    // ==========================================
    setMember({
      ...memberData,
      transactions: allTransactions,
    });

  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.message ||
        "Failed to load member share details."
    );
  } finally {
    setLoading(false);
  }
};

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-");
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loading}>
          Loading member details...
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.error}>
          {error}
        </div>
      </div>
    );
  }

  // ==========================================
  // MEMBER NOT FOUND
  // ==========================================
  if (!member) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.error}>
          Member not found.
        </div>
      </div>
    );
  }

  // ==========================================
// CALCULATE SHARE TOTALS
// ==========================================

const totalEntryAmount = (member.transactions || [])
  .filter(
    (transaction) =>
      transaction.transactionType === "Credit"
  )
  .reduce(
    (sum, transaction) =>
      sum + Number(transaction.amount || 0),
    0
  );

const totalWithdrawalAmount = (member.transactions || [])
  .filter(
    (transaction) =>
      transaction.transactionType === "Debit"
  )
  .reduce(
    (sum, transaction) =>
      sum + Number(transaction.amount || 0),
    0
  );

const netShareAmount = totalEntryAmount - totalWithdrawalAmount;
const sortedTransactions = [...(member.transactions || [])].sort(
  (a, b) =>
    new Date(a.transactionDate || a.createdAt).getTime() -
    new Date(b.transactionDate || b.createdAt).getTime()
);

let runningBalance = 0;

  const role = localStorage.getItem("role");

  return (
    <div
      className="print-wrapper"
      style={styles.wrapper}
    >

      {/* ==========================================
          PRINT CSS
      ========================================== */}

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

            background:
              linear-gradient(
                135deg,
                #0b3d91,
                #1a4b9b,
                #2563eb
              );

            background-size: 200% 200%;

            border: none;

            border-radius: 10px;

            cursor: pointer;

            overflow: hidden;

            box-shadow:
              0 4px 14px
              rgba(1, 41, 112, 0.35);

            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease,
              background-position 0.5s ease;
          }


          .premium-print-btn::before {
            content: "";

            position: absolute;

            top: 0;
            left: -75%;

            width: 50%;
            height: 100%;

            background:
              linear-gradient(
                120deg,
                transparent,
                rgba(255,255,255,0.35),
                transparent
              );

            transform: skewX(-25deg);

            transition:
              left 0.6s ease;
          }


          .premium-print-btn:hover {
            transform: translateY(-2px);

            box-shadow:
              0 8px 20px
              rgba(1, 41, 112, 0.45);

            background-position: 100% 50%;
          }


          .premium-print-btn:hover::before {
            left: 130%;
          }


          .premium-print-btn:active {
            transform:
              translateY(0px)
              scale(0.97);
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


      {/* ==========================================
          HEADER
      ========================================== */}

      <div style={styles.pageHeader}>

        <div>

          <h1 style={styles.pageTitle}>
            Share Fund Details
          </h1>


          <nav style={styles.breadcrumb}>

            <a
              href={`/${role}/dashboard`}
              style={styles.breadLink}
            >
              Home
            </a>

            <span style={styles.breadSep}>
              /
            </span>

            <a
              href={`/${role}/report`}
              style={styles.breadLink}
            >
              Reports
            </a>

            <span style={styles.breadSep}>
              /
            </span>

            <a
              href={`/${role}/share-report`}
              style={styles.breadLink}
            >
              Share Fund Report
            </a>

            <span style={styles.breadSep}>
              /
            </span>

            <span style={styles.breadActive}>
              Details
            </span>

          </nav>

        </div>


        {/* ==========================================
            RIGHT SIDE
        ========================================== */}

        <div style={styles.headerRight}>

          <div style={styles.addressBox}>

            <p style={styles.addressText}>

              <strong
                style={{ fontSize: "15px" }}
              >
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

              <Printer
                size={12}
                strokeWidth={2.4}
              />

            </span>

            <span>
              Print Report
            </span>

          </button>

        </div>

      </div>


      {/* ==========================================
          MEMBER INFORMATION
      ========================================== */}

      <div
        className="print-card"
        style={styles.card}
      >

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
            value={member.firstname}
          />

          <DetailItem
            label="Last Name"
            value={member.lastname}
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


      {/* ==========================================
          SHARE INFORMATION
      ========================================== */}

<div
  className="print-card"
  style={styles.card}
>

  <h5 style={styles.cardTitle}>
    Share Information
  </h5>


  <div style={styles.detailsGrid}>

    <DetailItem
      label="First Transaction Date"
      value={member.firstTransactionDate}
    />


    <DetailItem
      label="Total Entry Amount"
      value={`₹${totalEntryAmount.toLocaleString(
        "en-IN"
      )}`}
    />


    <DetailItem
      label="Total Withdrawal Amount"
      value={`₹${totalWithdrawalAmount.toLocaleString(
        "en-IN"
      )}`}
    />


    <DetailItem
      label="Net Share Amount"
      value={`₹${netShareAmount.toLocaleString(
        "en-IN"
      )}`}
    />

  </div>

</div>


      {/* ==========================================
          TRANSACTION INFORMATION
      ========================================== */}

<div
  className="print-card"
  style={styles.card}
>
  <h5 style={styles.cardTitle}>
    Total Transaction Details
  </h5>

  <div style={styles.tableWrapper}>
    <table
      style={{
        ...styles.table,
        minWidth: "1050px",
      }}
    >
      <thead>
        <tr style={styles.theadRow}>
          <th style={styles.th}>
            Sl No
          </th>

          <th style={styles.th}>
            Date
          </th>

          <th style={styles.th}>
            Particulars
          </th>

          <th style={styles.th}>
            Amount
          </th>

          <th style={styles.th}>
            Credit/Debit
          </th>

          <th style={styles.th}>
            Balance Amount
          </th>

          <th style={styles.th}>
            No. (s) of Share Remained
          </th>

          <th style={styles.th}>
            Book No.
          </th>

          <th style={styles.th}>
            Certificate No.
          </th>
        </tr>
      </thead>

      <tbody>
        {sortedTransactions.length === 0 ? (
          <tr>
            <td
              colSpan={9}
              style={{
                ...styles.td,
                padding: "28px",
                color: "#aaa",
              }}
            >
              No transactions found.
            </td>
          </tr>
        ) : (
          sortedTransactions.map((transaction, index) => {
            const amount = Number(transaction.amount || 0);

            /* --------------------------------
               Credit = ADD
               Debit  = MINUS
            -------------------------------- */
            if (transaction.transactionType === "Credit") {
              runningBalance += amount;
            } else if (
              transaction.transactionType === "Debit"
            ) {
              runningBalance -= amount;
            }

            const remainingShares =
              runningBalance / 20;

            return (
              <tr key={`${transaction.transactionId || transaction._id}-${index}`}>
                {/* Sl No */}
                <td style={styles.td}>
                  {index + 1}
                </td>

                {/* Date */}
                <td
                  style={{
                    ...styles.td,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDate(
                    transaction.transactionDate ||
                      transaction.createdAt
                  )}
                </td>

                {/* Particulars */}
                <td
                  style={{
                    ...styles.td,
                    whiteSpace: "nowrap",
                  }}
                >
                  {`By ${amount / 20} shares`}
                </td>

                {/* Amount */}
                <td
                  style={{
                    ...styles.td,
                    textAlign: "right",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  ₹
                  {amount.toLocaleString(
                    "en-IN"
                  )}
                </td>

                {/* Credit / Debit */}
                <td style={styles.td}>
                  <span
                    style={
                      transaction.transactionType ===
                      "Credit"
                        ? {
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            backgroundColor:
                              "#d4f8e8",
                            color: "#1a7a4a",
                            fontWeight: "600",
                            fontSize: "12px",
                          }
                        : {
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            backgroundColor:
                              "#fde8e8",
                            color: "#c0392b",
                            fontWeight: "600",
                            fontSize: "12px",
                          }
                    }
                  >
                    {transaction.isLoanAdjustment
                      ? "Paid to Loan Account"
                      : transaction.transactionType ||
                        "Debit"}
                  </span>
                </td>

                {/* Balance Amount */}
                <td
                  style={{
                    ...styles.td,
                    textAlign: "right",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}
                >
                  ₹
                  {runningBalance.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </td>

                {/* Remaining Shares */}
                <td
                  style={{
                    ...styles.td,
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}
                >
                  {remainingShares % 1 === 0
                    ? remainingShares
                    : remainingShares.toFixed(2)}
                </td>

                {/* Book No */}
                <td style={styles.td}>
                  {transaction.isLoanAdjustment
                    ? "-"
                    : transaction.bookNo || "-"}
                </td>

                {/* Certificate No */}
                <td style={styles.td}>
                  {transaction.isLoanAdjustment
                    ? "-"
                    : transaction.certificateNo || "-"}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>

    </div>
  );
}


/* ==========================================
   DETAIL ITEM
========================================== */

function DetailItem({
  label,
  value,
}) {
  return (
    <div style={styles.detailItem}>

      <div style={styles.detailLabel}>
        {label}
      </div>

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


/* ==========================================
   STYLES
========================================== */

const styles = {

  wrapper: {
    padding: "20px 24px",

    fontFamily:
      '"Open Sans", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',

    backgroundColor: "#f6f9fc",

    minHeight: "100vh",
  },


  pageHeader: {
    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    flexWrap: "wrap",

    gap: "12px",

    marginBottom: "24px",
  },


  pageTitle: {
    fontSize: "26px",

    fontWeight: "700",

    color: "#012970",

    margin:
      "0 0 6px 0",
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


  headerRight: {
    display: "flex",

    alignItems: "flex-start",

    gap: "20px",
  },


  card: {
    backgroundColor: "white",

    borderRadius: "8px",

    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",

    padding: "20px",

    marginBottom: "20px",
  },


  cardTitle: {
    fontSize: "18px",

    fontWeight: "600",

    color: "#012970",

    margin:
      "0 0 20px 0",

    paddingBottom: "10px",

    borderBottom:
      "1px solid #e9ecef",
  },


  detailsGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",

    gap: "0",

    borderTop:
      "1px solid #dee2e6",

    borderLeft:
      "1px solid #dee2e6",
  },


  detailItem: {
    display: "grid",

    gridTemplateColumns:
      "45% 55%",

    minHeight: "48px",

    borderRight:
      "1px solid #dee2e6",

    borderBottom:
      "1px solid #dee2e6",
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

    wordBreak:
      "break-word",
  },


  tableWrapper: {
    overflowX: "auto",
  },


  table: {
    width: "100%",

    borderCollapse:
      "collapse",

    fontSize: "14px",

    tableLayout: "auto",
  },


  theadRow: {
    backgroundColor:
      "#f8f9fa",
  },


  th: {
    border:
      "1px solid #dee2e6",

    padding:
      "10px 14px",

    textAlign: "center",

    fontWeight: "600",

    color: "#444",

    fontSize: "13px",
  },


  td: {
    border:
      "1px solid #dee2e6",

    padding:
      "10px 14px",

    textAlign: "center",

    color: "#333",

    verticalAlign:
      "middle",
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

};