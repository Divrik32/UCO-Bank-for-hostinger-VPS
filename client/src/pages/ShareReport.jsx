import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ShareReport() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [memberCodeSearch, setMemberCodeSearch] =
    useState("");

  const [memberNameSearch, setMemberNameSearch] =
    useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ================================
  // Fetch Share Reports
  // ================================
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get(
        "/share/member-share-transactions"
      );

      setReports(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // Filter Reports
  // ================================
  const filteredReports = reports.filter(
    (report) => {

      // ================================
      // Member Code
      // ================================
      const matchMemberCode =
        report.memberId
          ?.toLowerCase()
          .includes(
            memberCodeSearch.toLowerCase()
          );

      // ================================
      // Member Name
      // ================================
      const matchMemberName =
        report.memberName
          ?.toLowerCase()
          .includes(
            memberNameSearch.toLowerCase()
          );

      // ================================
      // Date Filter
      // ================================
      let matchDate = true;

      if (fromDate || toDate) {

        const transactionDate =
          new Date(report.transactionDate);

        if (
          isNaN(transactionDate.getTime())
        ) {
          matchDate = false;
        } else {

          // From Date
          if (
            fromDate &&
            transactionDate <
              new Date(fromDate)
          ) {
            matchDate = false;
          }

          // To Date
          if (toDate) {

            const endDate =
              new Date(toDate);

            endDate.setHours(
              23,
              59,
              59,
              999
            );

            if (
              transactionDate >
              endDate
            ) {
              matchDate = false;
            }
          }
        }
      }

      return (
        matchMemberCode &&
        matchMemberName &&
        matchDate
      );
    }
  );

  // ================================
  // Format Date
  // ================================
  const formatDate = (date) => {

    if (!date) return "-";

    const parsedDate =
      new Date(date);

    if (
      isNaN(parsedDate.getTime())
    ) {
      return "-";
    }

    const day = String(
      parsedDate.getDate()
    ).padStart(2, "0");

    const month = String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");

    const year =
      parsedDate.getFullYear();

    return `${day}-${month}-${year}`;
  };

  return (
    <div style={styles.wrapper}>

      {/* ================================
          Page Header
      ================================= */}

      <div style={styles.pageHeader}>

        <div>

          <h1 style={styles.pageTitle}>
            Share Report
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

            <span style={styles.breadActive}>
              Share Report
            </span>

          </nav>

        </div>


        <div style={styles.addressBox}>

          <p style={styles.addressText}>

            <strong
              style={{
                fontSize: "15px",
              }}
            >
              Regd. 203, Hari Om Commercial
              Complex
            </strong>

            <br />

            New Dak Bunglow Road,
            Patna-800001

          </p>

        </div>

      </div>


      {/* ================================
          Search / Filter Section
      ================================= */}

      <div
        style={{
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >

        {/* Member Code */}

        <input
          type="text"
          placeholder="Search Member Code"
          value={memberCodeSearch}
          onChange={(e) =>
            setMemberCodeSearch(
              e.target.value
            )
          }
          style={styles.searchInput}
        />


        {/* Member Name */}

        <input
          type="text"
          placeholder="Search Member Name"
          value={memberNameSearch}
          onChange={(e) =>
            setMemberNameSearch(
              e.target.value
            )
          }
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

          <label>
            From
          </label>

          <input
            type="date"
            value={fromDate}
            onChange={(e) =>
              setFromDate(
                e.target.value
              )
            }
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

          <label>
            To
          </label>

          <input
            type="date"
            value={toDate}
            onChange={(e) =>
              setToDate(
                e.target.value
              )
            }
            style={styles.searchInput}
          />

        </div>

      </div>


      {/* ================================
          Table Card
      ================================= */}

      <div style={styles.card}>

        <h5 style={styles.cardTitle}>
          Share Report
        </h5>


        <div style={styles.tableWrapper}>

          <table style={styles.table}>

            <thead>

              <tr style={styles.theadRow}>

                <th style={styles.th}>
                  Sl.
                </th>

                <th style={styles.th}>
                  Member Code
                </th>

                <th style={styles.th}>
                  Member Name
                </th>

                <th style={styles.th}>
                  Transaction Date
                </th>

                <th style={styles.th}>
                  Amount
                </th>

                <th style={styles.th}>
                  Payment Mode
                </th>

                <th style={styles.th}>
                  Transaction ID
                </th>

                <th style={styles.th}>
                  Type
                </th>

                <th style={styles.th}>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={9}
                    style={styles.td}
                  >
                    Loading...
                  </td>

                </tr>

              ) : filteredReports.length === 0 ? (

                <tr>

                  <td
                    colSpan={9}
                    style={styles.td}
                  >
                    No share report found.
                  </td>

                </tr>

              ) : (

                filteredReports.map(
                  (report, index) => (

                    <tr
                      key={`${report.memberId}-${report.transactionId}-${index}`}
                    >

                      {/* Sl. */}

                      <td style={styles.td}>
                        {index + 1}
                      </td>


                      {/* Member Code */}

                      <td style={styles.td}>
                        {report.memberId || "-"}
                      </td>


                      {/* Member Name */}

                      <td style={styles.td}>
                        {report.memberName || "-"}
                      </td>


                      {/* Transaction Date */}

                      <td style={styles.td}>
                        {formatDate(
                          report.transactionDate
                        )}
                      </td>


                      {/* Amount */}

                      <td style={styles.td}>
                        ₹
                        {Number(
                          report.shareAmount || 0
                        ).toLocaleString()}
                      </td>


                      {/* Payment Mode */}

                      <td style={styles.td}>
                        {report.paymentMode || "-"}
                      </td>


                      {/* Transaction ID */}

                      <td style={styles.td}>
                        {report.transactionId || "-"}
                      </td>


                      {/* Transaction Type */}

                      <td style={styles.td}>
                        {report.transactionType || "-"}
                      </td>


                      {/* Action */}

                      <td style={styles.td}>

                        <button
                          style={styles.viewBtn}
                          onClick={() => {

                            navigate(
                              `/${role}/share-details/${report.memberId}`
                            );

                          }}
                        >
                          View
                        </button>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


const styles = {

  // ================================
  // Wrapper
  // ================================

  wrapper: {
    padding: "20px 24px",

    fontFamily:
      '"Open Sans", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',

    backgroundColor: "#f6f9fc",

    minHeight: "100vh",
  },


  // ================================
  // Header
  // ================================

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


  // ================================
  // Card
  // ================================

  card: {
    backgroundColor: "white",

    borderRadius: "8px",

    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",

    padding: "20px 20px 8px 20px",
  },


  cardTitle: {
    fontSize: "18px",

    fontWeight: "600",

    color: "#012970",

    margin: "0 0 16px 0",

    paddingBottom: "10px",

    borderBottom:
      "1px solid #e9ecef",
  },


  // ================================
  // Table
  // ================================

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
    border:
      "1px solid #dee2e6",

    padding: "10px 14px",

    textAlign: "center",

    fontWeight: "600",

    color: "#444",

    fontSize: "13px",
  },


  td: {
    border:
      "1px solid #dee2e6",

    padding: "10px 14px",

    textAlign: "center",

    color: "#333",

    verticalAlign: "middle",
  },


  // ================================
  // Search Input
  // ================================

  searchInput: {
    padding: "8px 12px",

    border:
      "1px solid #ced4da",

    borderRadius: "6px",

    fontSize: "14px",

    minWidth: "180px",

    outline: "none",
  },


  // ================================
  // View Button
  // ================================

  viewBtn: {
    backgroundColor:
      "transparent",

    color: "#0f6e56",

    border:
      "1.5px solid #0f6e56",

    borderRadius: "5px",

    padding: "5px 16px",

    fontSize: "13px",

    fontWeight: "500",

    cursor: "pointer",

    transition:
      "all 0.2s ease",

    fontFamily: "inherit",
  },

};