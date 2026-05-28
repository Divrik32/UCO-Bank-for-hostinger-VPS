import axios from "axios";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";


function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);

    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

const Field = ({ label, children, isMobile }) => (
  <div
    style={{
      display: "flex",
      alignItems: isMobile ? "flex-start" : "center",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "4px" : "14px",
      marginBottom: "14px",
    }}
  >
    {!isMobile && (
      <div style={{ flex: "0 0 210px", textAlign: "right" }}>
        <label
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#444",
          }}
        >
          {label}
        </label>
      </div>
    )}

    {isMobile && (
      <label
        style={{
          fontSize: "13px",
          fontWeight: "600",
          color: "#444",
        }}
      >
        {label}
      </label>
    )}

    <div
      style={{
        flex: "1 1 260px",
        width: isMobile ? "100%" : "auto",
      }}
    >
      {children}
    </div>
  </div>
);

export default function UserThrift() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [memberCode, setMemberCode] = useState("");
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState("entry");
  const [interestRate, setInterestRate] = useState("");

  const [entryForm, setEntryForm] = useState({
    totalAmountReceived: "",
    paymentMethod: "Cheque",
    transactionId: "",
    chequeNumber: "",
    yearlyInterestAmount: "",
    entryDate: "",
    receivedBy: "",
  });

  const [withdrawalForm, setWithdrawalForm] = useState({
    withdrawalAmount: "",
    paymentMethod: "Cheque",
    transactionId: "",
    chequeNumber: "",
    withdrawalDate: "",
    approvedBy: "",
  });

  const API = "/api/thrift-fund";
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);

  // Ref for scrollable transaction container
  const txScrollRef = useRef(null);

  // Scroll to bottom after DOM paints — fires synchronously after render
  useLayoutEffect(() => {
    if (activeTab === "transaction" && txScrollRef.current) {
      const el = txScrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [activeTab, transactions]);

  useEffect(() => {
    if (!entryForm.totalAmountReceived || !interestRate) {
      setEntryForm((prev) => ({ ...prev, yearlyInterestAmount: "" }));
      return;
    }
    const interest =
      (Number(entryForm.totalAmountReceived) * Number(interestRate) * 1) / 100;
    setEntryForm((prev) => ({ ...prev, yearlyInterestAmount: interest.toFixed(2) }));
  }, [entryForm.totalAmountReceived, interestRate]);

  useEffect(() => {
    fetchInterestRate();
  }, []);

  const fetchAvailableBalance = async (memberId) => {
    try {
      const res = await axios.get(`${API}/available-balance/${memberId}`);
      setAvailableBalance(res.data.availableBalance || 0);
    } catch (error) {
      toast.error("Failed to fetch balance");
    }
  };

  const fetchInterestRate = async () => {
    try {
      const res = await axios.get(`${API}/interest-rate`);
      setInterestRate(res.data.data.rate);
    } catch (error) {
      console.error("Failed to fetch interest rate");
    }
  };
  const formatDateTime = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

  const handleSearch = async () => {
    try {
      if (!memberCode.trim()) return;
      setLoading(true);
      const res = await axios.get(`${API}/member/${memberCode}`);
      const data = res.data.data;
      setMember({
        memberId: data.memberId,
        firstname: data.name.split(" ")[0],
        lastname: data.name.split(" ").slice(1).join(" "),
        phoneno: data.phoneNumber,
        email: data.email,
        profileImage: data.profileImage,
        signatureImage: data.signatureImage,
      });
      const txRes = await axios.get(`${API}/transaction/${memberCode}`);
      setTransactions(txRes.data.data || []);
      await fetchAvailableBalance(memberCode);
      setActiveTab("entry");
    } catch (error) {
      toast.error(error.response?.data?.message || "Member not found");
    } finally {
      setLoading(false);
    }
  };

  const updateInterest = async () => {
    try {
      await axios.put(`${API}/update-interest`, {
        rate: Number(interestRate),
        updatedBy: "Admin",
        remarks: "Updated from admin panel",
      });
      toast.success("Interest rate updated successfully");
    } catch (error) {
      toast.error("Failed to update interest");
    }
  };

  const submitEntry = async () => {
    try {
      await axios.post(`${API}/thrift-entry`, {
        memberId: member.memberId,
        ...entryForm,
        totalAmountReceived: Number(entryForm.totalAmountReceived),
      });
      toast.success("Entry created successfully");
      await fetchAvailableBalance(member.memberId);
      setEntryForm({
        totalAmountReceived: "",
        paymentMethod: "Cheque",
        transactionId: "",
        chequeNumber: "",
        yearlyInterestAmount: "",
        entryDate: "",
        receivedBy: "",
      });
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const submitWithdrawal = async () => {
    try {
      await axios.post(`${API}/thrift-withdrawal`, {
        memberId: member.memberId,
        ...withdrawalForm,
        withdrawalAmount: Number(withdrawalForm.withdrawalAmount),
      });
      toast.success("Withdrawal successful");
      await fetchAvailableBalance(member.memberId);
      setWithdrawalForm({
        withdrawalAmount: "",
        paymentMethod: "Cheque",
        transactionId: "",
        chequeNumber: "",
        withdrawalDate: "",
        approvedBy: "",
      });
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const tabs = [
    { key: "entry", label: "Thrift Fund Entry" },
    { key: "withdrawal", label: "Thrift Fund Withdrawal" },
    { key: "transaction", label: "Total Transaction Details" },
  ];

  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      padding: isMobile
  ? "16px 12px"
  : isTablet
  ? "20px 18px"
  : "28px 32px",
      fontFamily: "'Inter', sans-serif",
    },
topBar: {
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  justifyContent: "space-between",
  alignItems: isMobile ? "flex-start" : "flex-start",
  gap: isMobile ? "8px" : "0",
  marginBottom: "6px",
},
    pageTitle: {
      fontSize: "26px",
      fontWeight: "700",
      color: "#1a2052",
      margin: 0,
      fontFamily: "'Inter', sans-serif",
      letterSpacing: "0.3px",
    },
    breadcrumb: {
      fontSize: "13px",
      color: "#888",
      marginTop: "5px",
    },
    breadcrumbLink: {
      color: "#1e40af",
      textDecoration: "none",
      fontWeight: "600",
    },
    orgName: {
      margin: 0,
      fontWeight: "700",
      fontSize: "18px",
      color: "#1a2052",
      textAlign: "right",
    },
    orgAddr: {
      margin: 0,
      fontSize: "14px",
      color: "#666",
      textAlign: "right",
    },
    interestBar: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px",
      flexWrap: "wrap",
    },
    interestLabel: {
      fontSize: isMobile ? "14px" : "15px",
      fontWeight: "600",
      color: "#444",
      fontFamily: "'Inter', sans-serif",
      whiteSpace: "nowrap",
    },
    interestInput: {
      padding: "8px 14px",
      fontSize: isMobile ? "14px" : "15px",
      border: "1.5px solid #ced4da",
      borderRadius: "5px",
      fontFamily: "'Inter', sans-serif",
      outline: "none",
      backgroundColor: "#ffffff",
      width: "160px",
    },
    interestBtn: {
      backgroundColor: "#1e40af",
      color: "white",
      border: "none",
      borderRadius: "5px",
      padding: "9px 22px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
    },
    searchWrap: {
  display: "flex",
  justifyContent: isMobile ? "stretch" : "flex-end",
  marginBottom: "14px",
},
    searchInner: {
      display: "flex",
      alignItems: "flex-end",
      gap: "8px",
    },
    searchLabel: {
      fontSize: isMobile ? "14px" : "15px",
      fontWeight: "600",
      color: "#444",
      fontFamily: "'Inter', sans-serif",
      display: "block",
      marginBottom: "4px",
    },
    searchInput: {
      padding: "9px 14px",
      fontSize: isMobile ? "14px" : "15px",
      border: "1.5px solid #ced4da",
      borderRadius: "5px",
      fontFamily: "'Inter', sans-serif",
      outline: "none",
      backgroundColor: "#ffffff",
      width: "200px",
    },
    searchBtn: {
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "5px",
      padding: "9px 22px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
mainLayout: {
  display: "flex",
  flexDirection: isMobile || isTablet ? "column" : "row",
  gap: "18px",
  alignItems: "flex-start",
},
    profileCard: {
  width: isMobile
    ? "100%"
    : isTablet
    ? "100%"
    : "300px",
  flexShrink: 0,
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0 2px 12px rgba(10,25,47,0.12)",
      overflow: "hidden",
    },
    profileHeader: {
      backgroundColor: "#1e40af",
      padding: "12px 16px",
    },
    profileHeaderTitle: {
      fontWeight: "700",
      fontSize: "16px",
      color: "#ffffff",
      margin: 0,
      fontFamily: "'Inter', sans-serif",
      letterSpacing: "0.4px",
    },
    profileBody: {
      padding: "14px 16px 18px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
    },
    avatarWrap: {
      width: "130px",
      height: "130px",
      borderRadius: "50%",
      backgroundColor: "#eff6ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "3px solid #1e40af",
      overflow: "hidden",
      marginTop: "4px",
      marginBottom: "4px",
    },
    avatarFallback: {
      fontSize: "64px",
      color: "#1e40af",
    },
    sigBox: {
      width: "100%",
      border: "1px dashed #e2e8f0",
      borderRadius: "6px",
      minHeight: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8fafc",
    },
    sigText: {
      color: "#aaa",
      fontStyle: "italic",
      fontSize: "13px",
    },
    disabledInput: {
      width: "100%",
      padding: "9px 14px",
      fontSize: isMobile ? "14px" : "15px",
      border: "1px solid #e0e3f0",
      borderRadius: "5px",
      fontFamily: "'Inter', sans-serif",
      outline: "none",
      backgroundColor: "#e2e8f0",
      color: "#555",
      boxSizing: "border-box",
    },
    tabsPanel: {
      flex: "1 1 700px",
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0 2px 12px rgba(10,25,47,0.12)",
      padding: isMobile ? "14px 12px" : "20px 22px",
      minWidth: 0,
    },
    tabBar: {
      display: "flex",
      gap: "0px",
      flexWrap: "wrap",
      borderBottom: "2.5px solid #cbd5e1",
      marginBottom: "20px",
    },
    tabBtnActive: {
      padding: "9px 18px",
      fontSize: "13px",
      fontWeight: "700",
      border: "1.5px solid #cbd5e1",
      borderBottom: "2.5px solid #ffffff",
      borderRadius: "6px 6px 0 0",
      cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
      backgroundColor: "#ffffff",
      color: "#1e40af",
      marginBottom: "-2.5px",
    },
    tabBtnInactive: {
      padding: "9px 18px",
      fontSize: "13px",
      fontWeight: "600",
      border: "1px solid transparent",
      borderBottom: "none",
      borderRadius: "6px 6px 0 0",
      cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
      backgroundColor: "transparent",
      color: "#666",
      marginBottom: "0",
    },
    formSection: {
      maxWidth: "680px",
    },
    sectionTitle: {
      fontWeight: "700",
      marginBottom: "18px",
      fontSize: isMobile ? "14px" : "15px",
      color: "#1a2052",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: "8px",
      borderBottom: "1.5px solid #e2e8f0",
    },
    row: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      marginBottom: "14px",
      flexWrap: "wrap",
    },
    labelCol: {
      flex: "0 0 210px",
      textAlign: "right",
    },
    labelText: {
      fontSize: isMobile ? "14px" : "15px",
      fontWeight: "600",
      color: "#444",
      fontFamily: "'Inter', sans-serif",
    },
    inputCol: {
      flex: "1 1 260px",
    },
    inputStyle: {
      width: "100%",
      padding: "9px 14px",
      fontSize: isMobile ? "14px" : "15px",
      border: "1.5px solid #ced4da",
      borderRadius: "5px",
      fontFamily: "'Inter', sans-serif",
      outline: "none",
      backgroundColor: "#ffffff",
      boxSizing: "border-box",
    },
    inputDisabled: {
      width: "100%",
      padding: "9px 14px",
      fontSize: isMobile ? "14px" : "15px",
      border: "1.5px solid #e0e3f0",
      borderRadius: "5px",
      fontFamily: "'Inter', sans-serif",
      outline: "none",
      backgroundColor: "#e2e8f0",
      color: "#666",
      boxSizing: "border-box",
    },
    submitWrap: {
      textAlign: "center",
      marginTop: "20px",
    },
    btnPrimary: {
      backgroundColor: "#1e40af",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "10px 32px",
      fontSize: isMobile ? "14px" : "15px",
      fontWeight: "700",
      cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
      letterSpacing: "0.3px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "14px",
    },
    th: {
      padding: "11px 14px",
      textAlign: "left",
      fontWeight: "700",
      color: "#1a2052",
      backgroundColor: "#e2e8f0",
      borderBottom: "2px solid #e2e8f0",
      fontFamily: "'Inter', sans-serif",
      fontSize: "13px",
    },
    td: {
      padding: "10px 14px",
      borderBottom: "1px solid #f0f2ff",
      color: "#333",
    },
    badgeCredit: {
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "20px",
      backgroundColor: "#d4f8e8",
      color: "#1a7a4a",
      fontWeight: "600",
      fontSize: "12px",
    },
    badgeDebit: {
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "20px",
      backgroundColor: "#fde8e8",
      color: "#c0392b",
      fontWeight: "600",
      fontSize: "12px",
    },
  };

  return (
    <div style={styles.page}>

      {/* Top Bar */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.pageTitle}>Thrift Funds</h1>
          <nav style={styles.breadcrumb}>
            <a href="/" style={styles.breadcrumbLink}>Home</a>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ fontWeight: "600" }}>Thrift Funds</span>
          </nav>
        </div>
        <div>
          <p style={styles.orgName}>Regd. 203, Hari Om Commercial Complex</p>
          <p style={styles.orgAddr}>New Dak Bunglow Road, Patna-800001</p>
        </div>
      </div>

      {/* Interest Rate + Available Balance Info Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "14px", flexWrap: "wrap" }}>

        {/* Interest Rate — read only */}
        <div style={{ display: "flex", alignItems: "center", gap: "0", borderRadius: "7px", overflow: "hidden", border: "1.5px solid #dbeafe", boxShadow: "0 1px 4px rgba(30,64,175,0.08)" }}>
          <div style={{ backgroundColor: "#1e40af", color: "#fff", fontWeight: "700", fontSize: "14px", fontFamily: "'Inter', sans-serif", padding: "9px 16px", whiteSpace: "nowrap" }}>
            Interest Rate
          </div>
          <div style={{ backgroundColor: "#eff6ff", color: "#1e40af", fontWeight: "800", fontSize: isMobile ? "14px" : "15px", fontFamily: "'Inter', sans-serif", padding: "9px 18px", whiteSpace: "nowrap", minWidth: "60px", textAlign: "center" }}>
            {interestRate !== "" ? `${interestRate}%` : "—"}
          </div>
        </div>

        {/* Available Balance — read only, only when member loaded */}
        {member && (
          <div style={{ display: "flex", alignItems: "center", gap: "0", borderRadius: "7px", overflow: "hidden", border: "1.5px solid #d1fae5", boxShadow: "0 1px 4px rgba(16,185,129,0.08)" }}>
            <div style={{ backgroundColor: "#059669", color: "#fff", fontWeight: "700", fontSize: "14px", fontFamily: "'Inter', sans-serif", padding: "9px 16px", whiteSpace: "nowrap" }}>
              Available Balance
            </div>
            <div style={{ backgroundColor: "#ecfdf5", color: "#065f46", fontWeight: "800", fontSize: isMobile ? "14px" : "15px", fontFamily: "'Inter', sans-serif", padding: "9px 18px", whiteSpace: "nowrap", minWidth: "80px", textAlign: "center" }}>
              ₹{Number(availableBalance).toLocaleString()}
            </div>
          </div>
        )}

      </div>

      {/* Search Bar */}
      <div style={styles.searchWrap}>
        <div>
          <label style={styles.searchLabel}>Member Code:</label>
          <div style={styles.searchInner}>
            <input
              type="text"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
              style={styles.searchInput}
              placeholder="Enter member code"
            />
            <button onClick={handleSearch} style={styles.searchBtn}>Search</button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={styles.mainLayout}>

        {/* Profile Card */}
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <h5 style={styles.profileHeaderTitle}>Profile</h5>
          </div>
          <div style={styles.profileBody}>
            <input
              style={styles.disabledInput}
              disabled
              placeholder={member ? `${member.firstname} ${member.lastname}` : "Name"}
            />
            <input
              style={styles.disabledInput}
              disabled
              placeholder={member?.memberId || "Member Code"}
            />
            <div style={styles.avatarWrap}>
              {member?.profileImage ? (
                <img src={member.profileImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
              ) : (
                <span style={styles.avatarFallback}>👤</span>
              )}
            </div>
            <div style={styles.sigBox}>
              {member?.signatureImage ? (
                <img src={member.signatureImage} style={{ height: "40px", maxWidth: "80%", objectFit: "contain" }} alt="signature" />
              ) : (
                <span style={styles.sigText}>Signature</span>
              )}
            </div>
            <input style={styles.disabledInput} disabled placeholder={member?.phoneno || "Phone"} />
            <input style={styles.disabledInput} disabled placeholder={member?.email || "Email"} />
          </div>
        </div>

        {/* Tabs Panel */}
        {member && (
          <div style={styles.tabsPanel}>

            {/* Tab Buttons */}
            <div style={styles.tabBar}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={activeTab === t.key ? styles.tabBtnActive : styles.tabBtnInactive}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Thrift Fund Entry ── */}
            {activeTab === "entry" && (
              <div style={styles.formSection}>
                <h5 style={styles.sectionTitle}>Thrift Fund Entry</h5>

                <Field label="Total Amount Received" isMobile={isMobile}>
                  <input
                    type="number"
                    style={styles.inputStyle}
                    value={entryForm.totalAmountReceived}
                    onChange={(e) => setEntryForm({ ...entryForm, totalAmountReceived: e.target.value })}
                    placeholder="Enter amount"
                  />
                </Field>

                <Field label="Payment Method" isMobile={isMobile}>
                  <select
                    style={styles.inputStyle}
                    value={entryForm.paymentMethod}
                    onChange={(e) => setEntryForm({ ...entryForm, paymentMethod: e.target.value })}
                  >
                    {["Cash", "Cheque", "UPI", "Bank Transfer"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Transaction ID" isMobile={isMobile}>
                  <input
                    style={styles.inputStyle}
                    value={entryForm.transactionId}
                    onChange={(e) => setEntryForm({ ...entryForm, transactionId: e.target.value })}
                    placeholder="Enter transaction ID"
                  />
                </Field>

                <Field label="Cheque Number" isMobile={isMobile}>
                  <input
                    style={styles.inputStyle}
                    value={entryForm.chequeNumber}
                    onChange={(e) => setEntryForm({ ...entryForm, chequeNumber: e.target.value })}
                    placeholder="If applicable"
                  />
                </Field>

                <Field label="Yearly Interest Amount" isMobile={isMobile}>
                  <input style={styles.inputDisabled} disabled value={entryForm.yearlyInterestAmount} />
                </Field>

                <Field label="Available Balance" isMobile={isMobile}>
                  <input style={styles.inputDisabled} disabled value={availableBalance} />
                </Field>

                <Field label="Balance After Entry" isMobile={isMobile}>
                  <input
                    style={styles.inputDisabled}
                    disabled
                    value={
                      entryForm.totalAmountReceived
                        ? (Number(availableBalance) + Number(entryForm.totalAmountReceived)).toFixed(2)
                        : availableBalance
                    }
                  />
                </Field>

                <Field label="Entry Date" isMobile={isMobile}>
                  <input
                    type="date"
                    style={styles.inputStyle}
                    value={entryForm.entryDate}
                    onChange={(e) => setEntryForm({ ...entryForm, entryDate: e.target.value })}
                  />
                </Field>

                <Field label="Received By" isMobile={isMobile}>
                  <input
                    style={styles.inputStyle}
                    value={entryForm.receivedBy}
                    onChange={(e) => setEntryForm({ ...entryForm, receivedBy: e.target.value })}
                    placeholder="Name of receiver"
                  />
                </Field>

                <div style={styles.submitWrap}>
                  <button style={styles.btnPrimary} onClick={submitEntry}>Update</button>
                </div>
              </div>
            )}

            {/* ── Thrift Fund Withdrawal ── */}
            {activeTab === "withdrawal" && (
              <div style={styles.formSection}>
                <h5 style={styles.sectionTitle}>Thrift Fund Withdrawal</h5>

                <Field label="Withdrawal Amount" isMobile={isMobile}>
                  <input
                    type="number"
                    style={styles.inputStyle}
                    value={withdrawalForm.withdrawalAmount}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, withdrawalAmount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </Field>

                <Field label="Available Balance" isMobile={isMobile}>
                  <input style={styles.inputDisabled} disabled value={availableBalance} />
                </Field>

                <Field label="Remaining Balance" isMobile={isMobile}>
                  <input
                    style={styles.inputDisabled}
                    disabled
                    value={
                      withdrawalForm.withdrawalAmount
                        ? (Number(availableBalance) - Number(withdrawalForm.withdrawalAmount)).toFixed(2)
                        : availableBalance
                    }
                  />
                </Field>

                <Field label="Payment Method" isMobile={isMobile}>
                  <select
                    style={styles.inputStyle}
                    value={withdrawalForm.paymentMethod}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, paymentMethod: e.target.value })}
                  >
                    {["Cash", "Cheque", "UPI", "Bank Transfer"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Transaction ID" isMobile={isMobile}>
                  <input
                    style={styles.inputStyle}
                    value={withdrawalForm.transactionId}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, transactionId: e.target.value })}
                    placeholder="Enter transaction ID"
                  />
                </Field>

                <Field label="Cheque Number" isMobile={isMobile}>
                  <input
                    style={styles.inputStyle}
                    value={withdrawalForm.chequeNumber}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, chequeNumber: e.target.value })}
                    placeholder="If applicable"
                  />
                </Field>

                <Field label="Withdrawal Date" isMobile={isMobile}>
                  <input
                    type="date"
                    style={styles.inputStyle}
                    value={withdrawalForm.withdrawalDate}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, withdrawalDate: e.target.value })}
                  />
                </Field>

                <Field label="Approved By" isMobile={isMobile}>
                  <input
                    style={styles.inputStyle}
                    value={withdrawalForm.approvedBy}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, approvedBy: e.target.value })}
                    placeholder="Approver's name"
                  />
                </Field>

                <div style={styles.submitWrap}>
                  <button style={styles.btnPrimary} onClick={submitWithdrawal}>Submit</button>
                </div>
              </div>
            )}

            {/* ── Total Transaction Details ── */}
            {activeTab === "transaction" && (
              <div>
                <h5 style={styles.sectionTitle}>Total Transaction Details</h5>

                {/* Scrollable container — auto-scrolled to bottom on mount */}
                <div
                  ref={txScrollRef}
                  style={{ overflowX: "auto", overflowY: "auto", height: "380px" }}
                >
                  <table style={styles.table}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        {["#", "Amount", "Credit / Debit", "Date", "Interest", "Transaction ID"].map((h) => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "#aaa" }}>
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((item, i) => (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fdfdfd" }}>
                            <td style={styles.td}>{i + 1}</td>
                            <td style={{ ...styles.td, fontWeight: "600" }}>₹{item.amount.toLocaleString()}</td>
                            <td style={styles.td}>
                              <span style={item.type === "Credit" ? styles.badgeCredit : styles.badgeDebit}>
                                {item.type}
                              </span>
                            </td>
                            <td style={styles.td}>{formatDateTime(item.date)}</td>
                            <td style={styles.td}>
                              {item.interest ? Number(item.interest).toFixed(2) : "-"}
                            </td>
                            <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "13px" }}>
                              {item.transactionId ? item.transactionId : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Available Balance — outside scroll, always visible at bottom */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "0",
                    marginTop: "12px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(30,64,175,0.10)",
                    border: "1.5px solid #dbeafe",
                    width: "fit-content",
                    marginLeft: "auto",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#1e40af",
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: "14px",
                      fontFamily: "'Inter', sans-serif",
                      padding: "10px 20px",
                      letterSpacing: "0.3px",
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
                      fontSize: isMobile ? "14px" : "15px",
                      fontFamily: "'Inter', sans-serif",
                      padding: "10px 22px",
                      whiteSpace: "nowrap",
                      letterSpacing: "0.2px",
                    }}
                  >
                    ₹{availableBalance.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}