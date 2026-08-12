import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Search, Printer, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function MemberApproval() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  // Search states
  const [memberIdSearch, setMemberIdSearch] = useState("");
  const [membershipNumberSearch, setMembershipNumberSearch] = useState("");
  const [memberNameSearch, setMemberNameSearch] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get("/users/approval-pending-members");

      setMembers(res.data.data || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEARCH / FILTER
  // ==========================================

  const filteredMembers = useMemo(() => {
    const memberId = memberIdSearch.trim().toLowerCase();
    const membershipNumber = membershipNumberSearch.trim().toLowerCase();
    const memberName = memberNameSearch.trim().toLowerCase();

    return members.filter((member) => {
      const currentMemberId = String(
        member.memberId || member._id || ""
      ).toLowerCase();

      const currentMembershipNumber = String(
        member.membershipNumber || ""
      ).toLowerCase();

      const currentMemberName =
        `${member.firstname || ""} ${member.lastname || ""}`
          .trim()
          .toLowerCase();

      const memberIdMatch =
        !memberId || currentMemberId.includes(memberId);

      const membershipNumberMatch =
        !membershipNumber ||
        currentMembershipNumber.includes(membershipNumber);

      const memberNameMatch =
        !memberName || currentMemberName.includes(memberName);

      return (
        memberIdMatch &&
        membershipNumberMatch &&
        memberNameMatch
      );
    });
  }, [
    members,
    memberIdSearch,
    membershipNumberSearch,
    memberNameSearch,
  ]);

  // ==========================================
  // CLEAR SEARCH
  // ==========================================

  const clearSearch = () => {
    setMemberIdSearch("");
    setMembershipNumberSearch("");
    setMemberNameSearch("");
  };

  const hasSearch =
    memberIdSearch ||
    membershipNumberSearch ||
    memberNameSearch;

  // ==========================================
  // PRINT
  // ==========================================

  const handlePrint = async () => {
    if (!filteredMembers.length) {
      toast.error("No members available to print.");
      return;
    }

    try {
      setPrinting(true);

      const res = await api.post(
        "/users/approval-pending-members/print",
        {
          members: filteredMembers,
        },
        {
          responseType: "blob",
        }
      );

      // Create PDF blob
      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const pdfUrl = window.URL.createObjectURL(blob);

      // Open PDF in new tab
      const printWindow = window.open(pdfUrl, "_blank");

      if (!printWindow) {
        toast.error(
          "Popup blocked. Please allow popups for this website."
        );
      }
    } catch (error) {
      console.log(error);

      toast.error(
        "Failed to generate member list PDF."
      );
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div style={styles.pageHeader}>
        <div>
          {role === "admin" ? (
            <>
              <h1 style={styles.pageTitle}>
                Member Approval
              </h1>

              <nav style={styles.breadcrumb}>
                <a
                  href={`/${role}/dashboard`}
                  style={styles.breadLink}
                >
                  Home
                </a>

                <span style={styles.breadSep}>/</span>

                <a
                  href={`/${role}/admin-update`}
                  style={styles.breadLink}
                >
                  Admin Update
                </a>

                <span style={styles.breadSep}>/</span>

                <span style={styles.breadActive}>
                  Member Approval
                </span>
              </nav>
            </>
          ) : (
            <>
              <h1 style={styles.pageTitle}>
                Member Reports
              </h1>

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

                <span style={styles.breadActive}>
                  Member Reports
                </span>
              </nav>
            </>
          )}
        </div>

        <div style={styles.addressBox}>
          <p style={styles.addressText}>
            <strong style={{ fontSize: "15px" }}>
              Regd. 203, Hari Om Commercial Complex
            </strong>
            <br />
            New Dak Bunglow Road, Patna-800001
          </p>
        </div>
      </div>

      {/* ==========================================
          TABLE CARD
      ========================================== */}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>
            Member Approval
          </h5>

          <button
            type="button"
            style={{
              ...styles.printBtn,
              opacity: printing ? 0.7 : 1,
              cursor: printing
                ? "not-allowed"
                : "pointer",
            }}
            onClick={handlePrint}
            disabled={printing}
          >
            <Printer size={16} />

            {printing
              ? "Generating PDF..."
              : "Print List"}
          </button>
        </div>

        {/* ==========================================
            SEARCH SECTION
        ========================================== */}

        <div style={styles.searchContainer}>
          {/* Member ID */}
          <div style={styles.searchBox}>
            <label style={styles.searchLabel}>
              Member ID
            </label>

            <div style={styles.inputWrapper}>
              <Search
                size={16}
                style={styles.searchIcon}
              />

              <input
                type="text"
                placeholder="Search Member ID..."
                value={memberIdSearch}
                onChange={(e) =>
                  setMemberIdSearch(e.target.value)
                }
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Membership Number */}
          <div style={styles.searchBox}>
            <label style={styles.searchLabel}>
              Membership Number
            </label>

            <div style={styles.inputWrapper}>
              <Search
                size={16}
                style={styles.searchIcon}
              />

              <input
                type="text"
                placeholder="Search Membership Number..."
                value={membershipNumberSearch}
                onChange={(e) =>
                  setMembershipNumberSearch(
                    e.target.value
                  )
                }
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Member Name */}
          <div style={styles.searchBox}>
            <label style={styles.searchLabel}>
              Member Name
            </label>

            <div style={styles.inputWrapper}>
              <Search
                size={16}
                style={styles.searchIcon}
              />

              <input
                type="text"
                placeholder="Search Member Name..."
                value={memberNameSearch}
                onChange={(e) =>
                  setMemberNameSearch(e.target.value)
                }
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Clear */}
          {hasSearch && (
            <button
              type="button"
              onClick={clearSearch}
              style={styles.clearBtn}
            >
              <X size={15} />
              Clear
            </button>
          )}
        </div>

        {/* Search Result Count */}

        <div style={styles.resultInfo}>
          Showing{" "}
          <strong>{filteredMembers.length}</strong>{" "}
          of{" "}
          <strong>{members.length}</strong> members
        </div>

        {/* ==========================================
            TABLE
        ========================================== */}

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>
                  Member Id
                </th>

                <th style={styles.th}>
                  Membership Number
                </th>

                <th style={styles.th}>
                  Member Name
                </th>

                <th style={styles.th}>
                  Contact Number
                </th>

                <th style={styles.th}>
                  Email
                </th>

                <th style={styles.th}>
                  Total Loan
                </th>

                <th style={styles.th}>
                  Share Balance
                </th>

                <th style={styles.th}>
                  Thrift Balance
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
                    colSpan="9"
                    style={styles.td}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={styles.td}
                  >
                    No members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map(
                  (member, idx) => (
                    <tr
                      key={member._id}
                      style={{
                        ...styles.tr,
                        backgroundColor:
                          idx % 2 === 0
                            ? "white"
                            : "#f9f9f9",
                      }}
                    >
                      {/* Member Id */}
                      <td style={styles.td}>
                        {member.memberId ||
                          member._id}
                      </td>

                      {/* Membership Number */}
                      <td style={styles.td}>
                        {member.membershipNumber ||
                          "-"}
                      </td>

                      {/* Member Name */}
                      <td style={styles.td}>
                        {member.firstname}{" "}
                        {member.lastname}
                      </td>

                      {/* Contact */}
                      <td style={styles.td}>
                        {member.phoneno || "-"}
                      </td>

                      {/* Email */}
                      <td style={styles.td}>
                        {member.email || "-"}
                      </td>

                      {/* Total Loan */}
                      <td style={styles.td}>
                        ₹
                        {Number(
                          member.totalLoan || 0
                        ).toLocaleString("en-IN")}
                      </td>

                      {/* Share Balance */}
                      <td style={styles.td}>
                        ₹
                        {Number(
                          member.shareBalance || 0
                        ).toLocaleString("en-IN")}
                      </td>

                      {/* Thrift Balance */}
                      <td style={styles.td}>
                        ₹
                        {Number(
                          member.thriftBalance || 0
                        ).toLocaleString("en-IN")}
                      </td>

                      {/* Action */}
                      <td style={styles.td}>
                        <button
                          style={styles.viewBtn}
                          onClick={() =>
                            navigate(
                              `/${role}/member_approval/${member._id}`
                            )
                          }
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
  wrapper: {
    padding: "20px 24px",
    fontFamily:
      '"Open Sans", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: "#f6f9fc",
    minHeight: "100vh",
  },

  // Header
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

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",
    padding: "20px 20px 8px 20px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "16px",
    paddingBottom: "10px",
    borderBottom:
      "1px solid #e9ecef",
  },

  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#012970",
    margin: 0,
  },

  // Search
  searchContainer: {
    display: "flex",
    alignItems: "flex-end",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  searchBox: {
    flex: "1 1 220px",
    minWidth: "200px",
  },

  searchLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#444",
    marginBottom: "6px",
  },

  inputWrapper: {
    position: "relative",
  },

  searchIcon: {
    position: "absolute",
    left: "11px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#777",
    pointerEvents: "none",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    height: "38px",
    border: "1px solid #ced4da",
    borderRadius: "5px",
    padding:
      "8px 10px 8px 34px",
    outline: "none",
    fontSize: "13px",
    fontFamily: "inherit",
  },

  clearBtn: {
    height: "38px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "0 14px",
    border: "1px solid #dc3545",
    backgroundColor: "white",
    color: "#dc3545",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "inherit",
  },

  resultInfo: {
    fontSize: "13px",
    color: "#666",
    marginBottom: "12px",
  },

  // Print
  printBtn: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    backgroundColor: "#0f6e56",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "8px 15px",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "inherit",
  },

  // Table
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
    whiteSpace: "nowrap",
  },

  tr: {
    transition:
      "background-color 0.15s ease",
  },

  td: {
    border: "1px solid #dee2e6",
    padding: "10px 14px",
    textAlign: "center",
    color: "#333",
    verticalAlign: "middle",
  },

  // View
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