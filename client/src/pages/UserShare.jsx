import api from "../api/axios";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const Field = ({ label, children, styles }) => (
  <div style={styles.row}>
    <div style={styles.labelCol}>
      <label style={styles.labelText}>{label}</label>
    </div>
    <div style={styles.inputCol}>{children}</div>
  </div>
);

const PRICE_PER_SHARE = 20; // ₹20 fixed

export default function UserShare() {
  const [currentBalance, setCurrentBalance] = useState(null);
  const [memberCode, setMemberCode] = useState("");
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState("official");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [perShareAmount, setPerShareAmount] = useState(2500);
  

  const [officialForm, setOfficialForm] = useState({
    officeName: "",
    dateOfJoin: "",
    dateOfAllotment: "",
    dateOfRetirement: "",
  });

  const [creditForm, setCreditForm] = useState({
    investmentAmount: "",
    numberOfShares: "", // auto-calculated: investmentAmount / 20
  });

  const [debitForm, setDebitForm] = useState({
    amount: "",
    remainingShares: "",
    remainingCount: "",
    paymentMode: "Cheque",
    chequeNumber: "",
    transactionId: "",
    transferShareTo: "Members Loan Account", // new dropdown
    shareCertificateNumber: "",              // new text field
  });

  const API = "/share";
  const txScrollRef = useRef(null);

  useLayoutEffect(() => {
    if (activeTab === "transaction" && txScrollRef.current) {
      const el = txScrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [activeTab, transactions]);

useEffect(() => {
  fetchInterestRate();
}, []);

const fetchInterestRate = async () => {
  try {
    const res = await api.get(`${API}/share-interest`);
    setDividendRate(res.data.data?.rate || 0);
  } catch (error) {
    console.log(error);
    setDividendRate(0);
  }
};
  
  // Auto-calculate numberOfShares from investmentAmount / PRICE_PER_SHARE
  useEffect(() => {
    if (!creditForm.investmentAmount) {
      setCreditForm((prev) => ({ ...prev, numberOfShares: "" }));
      return;
    }
    const shares = Number(creditForm.investmentAmount) / PRICE_PER_SHARE;
    setCreditForm((prev) => ({
      ...prev,
      numberOfShares: shares % 1 === 0 ? String(shares) : shares.toFixed(2),
    }));
  }, [creditForm.investmentAmount]);

  // Auto-calculate remainingShares & remainingCount for debit
useEffect(() => {
  if (!debitForm.amount) {
    setDebitForm((prev) => ({
      ...prev,
      remainingShares: "",
      remainingCount: "",
    }));
    return;
  }

  const totalCredit = transactions
    .filter((t) => t.type === "Credit")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalDebit = transactions
    .filter((t) => t.type === "Debit")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const availableBalance = totalCredit - totalDebit;
  const remainingBalance = availableBalance - Number(debitForm.amount);

  const remainingSharesCount = remainingBalance / PRICE_PER_SHARE;

  setDebitForm((prev) => ({
    ...prev,
    remainingShares:
      remainingBalance >= 0 ? remainingBalance.toFixed(2) : "0.00",

    remainingCount:
      remainingBalance >= 0
        ? remainingSharesCount % 1 === 0
          ? String(remainingSharesCount)
          : remainingSharesCount.toFixed(2)
        : "0",
  }));
}, [debitForm.amount, transactions]);

  // shareBalance = total credits
  const shareBalance = transactions
    .filter((t) => t.type === "Credit")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const [dividendRate, setDividendRate] = useState(0);

  const dividendAmount = (
  ((currentBalance || 0) * dividendRate) / 100
).toFixed(2);

  const dividendRateDisplay = `${dividendRate}%`;

const handleSearch = async () => {
  if (!memberCode.trim()) {
    toast.error("Enter member code");
    return;
  }

  try {
    setLoading(true);

    // NEW API CALL
    const res = await api.get(
      `${API}/member/${memberCode.trim()}`
    );

    if (!res.data.success) {
      toast.error("Member not found");
      return;
    }

    const data = res.data.data;

    // backend response map
setMember({
  memberId: data.memberId,
  firstname: data.name?.split(" ")[0] || "",
  lastname: data.name?.split(" ").slice(1).join(" ") || "",
  phoneNumber: data.phoneNumber,
  email: data.email,
  profileImage: data.profileImage,
  signatureImage: data.signatureImage,
});

    // first tab open
    setActiveTab("official");

    const balanceRes = await api.get(
  `${API}/share-balance/${memberCode.trim()}`
);

setCurrentBalance(balanceRes.data.availableBalance);


const creditRes = await api.get(
 `${API}/credit-share/${memberCode.trim()}`
);

const debitRes = await api.get(
 `${API}/debit-share/${memberCode.trim()}`
);

const credits =
 creditRes.data.data.map(item=>({
   amount:item.investmentAmount,
   type:"Credit"
 }));

const debits =
 debitRes.data.data.map(item=>({
   amount:item.amount,
   type:"Debit"
 }));

setTransactions([
 ...credits,
 ...debits
]);

  } catch (error) {
    console.log(error);

    if (error.response?.status === 404) {
      toast.error("Member not found");
    } else {
      toast.error(
        error.response?.data?.message || "Search failed"
      );
    }

    setMember(null);
    setTransactions([]);
  } finally {
    setLoading(false);
  }
};

  const submitOfficial = async () => {
    try {
      await api.post(`${API}/official-details`, {
        memberId: member.memberId,
        ...officialForm,
      });
      toast.success("Official details updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    }
  };

  const submitCredit = async () => {
    try {
      await api.post(`${API}/credit-share`, {
        memberId: member.memberId,
        pricePerShare: PRICE_PER_SHARE,
        investmentAmount: Number(creditForm.investmentAmount),
        numberOfShares: Number(creditForm.numberOfShares),
      });
      toast.success("Credit shares updated successfully");
      setCreditForm({ investmentAmount: "", numberOfShares: "" });
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    }
  };

  const submitDebit = async () => {
    try {
      await api.post(`${API}/debit-share`, {
        memberId: member.memberId,
        amount: Number(debitForm.amount),
        paymentMode: debitForm.paymentMode,
        chequeNumber: debitForm.chequeNumber,
        transactionId: debitForm.transactionId,
        transferShareTo: debitForm.transferShareTo,
        shareCertificateNumber: debitForm.shareCertificateNumber,
      });
      toast.success("Debit shares updated successfully");
      setDebitForm({
        amount: "",
        remainingShares: "",
        remainingCount: "",
        paymentMode: "Cheque",
        chequeNumber: "",
        transactionId: "",
        transferShareTo: "Members Loan Account",
        shareCertificateNumber: "",
      });
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    }
  };

  const tabs = [
    { key: "official", label: "Official Details" },
    { key: "credit", label: "Credit Shares" },
    { key: "debit", label: "Debit Shares" },
    { key: "dividend", label: "Dividend Details" },
    { key: "transaction", label: "Total Transaction Details" },
  ];
const [screenSize, setScreenSize] = useState({
  isMobile: window.innerWidth <= 768,
  isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
  isLaptop: window.innerWidth > 1024,
});

useEffect(() => {
  const handleResize = () => {
    setScreenSize({
      isMobile: window.innerWidth <= 768,
      isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
      isLaptop: window.innerWidth > 1024,
    });
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

const { isMobile, isTablet, isLaptop } = screenSize;

  const styles = {
page: {
  minHeight: "100vh",
  backgroundColor: "#f8fafc",
  padding: isMobile ? "12px" : isTablet ? "20px" : "28px 32px",
  fontFamily: "'Inter', sans-serif",
},
topBar: {
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  justifyContent: "space-between",
  alignItems: isMobile ? "flex-start" : "flex-start",
  gap: "15px",
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
    pillsRow: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginTop: "14px",
      flexWrap: "wrap",
    },
    pillWrap: {
      display: "flex",
      alignItems: "stretch",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 1px 6px rgba(10,25,47,0.10)",
    },
    pillLabel: {
      padding: "9px 20px",
      fontSize: "14px",
      fontWeight: "700",
      color: "#ffffff",
      fontFamily: "'Inter', sans-serif",
      letterSpacing: "0.2px",
      whiteSpace: "nowrap",
      display: "flex",
      alignItems: "center",
    },
    pillValue: {
      padding: "9px 20px",
      fontSize: "14px",
      fontWeight: "700",
      fontFamily: "'Inter', sans-serif",
      whiteSpace: "nowrap",
      display: "flex",
      alignItems: "center",
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
searchWrap: {
  display: "flex",
  justifyContent: isMobile ? "flex-start" : "flex-end",
  marginBottom: "14px",
  marginTop: "14px",
},
    searchInner: {
      display: "flex",
      alignItems: "flex-end",
      gap: "8px",
    },
    searchLabel: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#444",
      fontFamily: "'Inter', sans-serif",
      display: "block",
      marginBottom: "4px",
    },
searchInput: {
  padding: "9px 14px",
  fontSize: "15px",
  border: "1.5px solid #ced4da",
  borderRadius: "5px",
  width: isMobile ? "100%" : isTablet ? "250px" : "200px",
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
  flexDirection: isMobile ? "column" : "row",
  gap: "18px",
  flexWrap: "wrap",
  alignItems: "flex-start",
},
profileCard: {
  width: isMobile ? "100%" : "300px",
  flex: isMobile ? "1 1 100%" : "0 0 300px",
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
      fontSize: "15px",
      border: "1px solid #e0e3f0",
      borderRadius: "5px",
      fontFamily: "'Inter', sans-serif",
      outline: "none",
      backgroundColor: "#e2e8f0",
      color: "#555",
      boxSizing: "border-box",
    },
tabsPanel: {
  width: "100%",
  flex: "1",
  backgroundColor: "white",
  borderRadius: "10px",
  boxShadow: "0 2px 12px rgba(10,25,47,0.12)",
  padding: isMobile ? "12px" : "20px 22px",
  minWidth: 0,
},
tabBar: {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
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
      fontSize: "15px",
      color: "#1a2052",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: "8px",
      borderBottom: "1.5px solid #e2e8f0",
    },
row: {
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  alignItems: isMobile ? "flex-start" : "center",
  gap: "14px",
  marginBottom: "14px",
},
labelCol: {
  width: isMobile ? "100%" : "190px",
  textAlign: isMobile ? "left" : "right",
},
    labelText: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#444",
      fontFamily: "'Inter', sans-serif",
    },
inputCol: {
  width: "100%",
  flex: "1",
},
inputStyle: {
  width: "100%",
  padding: isMobile ? "8px" : "9px 14px",
  fontSize: isMobile ? "14px" : "15px",
  border: "1.5px solid #ced4da",
  borderRadius: "5px",
  boxSizing: "border-box",
},
    inputDisabled: {
      width: "100%",
      padding: "9px 14px",
      fontSize: "15px",
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
      fontSize: "15px",
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
    divider: {
      border: "none",
      borderTop: "1.5px solid #e2e8f0",
      margin: "18px 0",
    },
    warningWrap: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      marginTop: "28px",
    },
    warningBox: {
      backgroundColor: "#fff5f5",
      border: "1px solid #fca5a5",
      borderRadius: "6px",
      padding: "12px 20px",
      color: "#dc2626",
      fontSize: "13px",
      fontWeight: "600",
      lineHeight: "1.6",
      fontFamily: "'Inter', sans-serif",
      textAlign: "center",
      maxWidth: "560px",
      width: "100%",
    },
  };

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.pageTitle}>Share Purchase</h1>
          <nav style={styles.breadcrumb}>
            <a href="/" style={styles.breadcrumbLink}>Home</a>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ fontWeight: "600" }}>Share Purchase</span>
          </nav>

          {/* Pill badges */}
          <div style={styles.pillsRow}>
            <div style={styles.pillWrap}>
              <span style={{ ...styles.pillLabel, backgroundColor: "#1e40af" }}>Interest Rate</span>
              <span style={{ ...styles.pillValue, backgroundColor: "#eff6ff", color: "#1e40af" }}>
                {dividendRate}%
              </span>
            </div>
{member && (
  <div style={styles.pillWrap}>
    <span
      style={{
        ...styles.pillLabel,
        backgroundColor: "#059669",
      }}
    >
      Share Balance
    </span>
    <span
      style={{
        ...styles.pillValue,
        backgroundColor: "#ecfdf5",
        color: "#065f46",
      }}
    >
      ₹{Number(currentBalance || 0).toLocaleString("en-IN")}
    </span>
  </div>
)}
          </div>
        </div>

        <div>
          <p style={styles.orgName}>Regd. 203, Hari Om Commercial Complex</p>
          <p style={styles.orgAddr}>New Dak Bunglow Road, Patna-800001</p>
        </div>
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={styles.searchInput}
              placeholder="Enter member code"
            />
            <button onClick={handleSearch} style={styles.searchBtn}>
              {loading ? "..." : "Search"}
            </button>
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
            value={member ? `${member.firstname} ${member.lastname}` : ""}
          />
          <input
            style={styles.disabledInput}
            disabled
            value={member?.memberId || ""}
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
<input
  style={styles.disabledInput}
  disabled
  value={member?.phoneNumber || ""}
/>
<input
  style={styles.disabledInput}
  disabled
  value={member?.email || ""}
/>
          </div>
        </div>

        {/* Tabs Panel */}
        {member && (
          <div style={styles.tabsPanel}>
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

            {/* ── Official Details ── */}
            {activeTab === "official" && (
              <div style={styles.formSection}>
                <h5 style={styles.sectionTitle}>Official Details</h5>
                <Field label="Office Name" styles={styles}>
                  <input
                    style={styles.inputStyle}
                    value={officialForm.officeName}
                    onChange={(e) => setOfficialForm({ ...officialForm, officeName: e.target.value })}
                    placeholder="Head-Office-01"
                  />
                </Field>
                <Field label="Date of Join" styles={styles}>
                  <input
                    type="date"
                    style={styles.inputStyle}
                    value={officialForm.dateOfJoin}
                    onChange={(e) => setOfficialForm({ ...officialForm, dateOfJoin: e.target.value })}
                  />
                </Field>
                <Field label="Date of Allotment" styles={styles}>
                  <input
                    type="date"
                    style={styles.inputStyle}
                    value={officialForm.dateOfAllotment}
                    onChange={(e) => setOfficialForm({ ...officialForm, dateOfAllotment: e.target.value })}
                  />
                </Field>
                <Field label="Date of Retirement" styles={styles}>
                  <input
                    type="date"
                    style={styles.inputStyle}
                    value={officialForm.dateOfRetirement}
                    onChange={(e) => setOfficialForm({ ...officialForm, dateOfRetirement: e.target.value })}
                  />
                </Field>
                <hr style={styles.divider} />
                <h5 style={styles.sectionTitle}>Share Information</h5>
                <Field label="Price per Share" styles={styles}>
                  {/* Always ₹20.00 */}
                  <input style={styles.inputDisabled} disabled value={`₹${PRICE_PER_SHARE.toFixed(2)}`} />
                </Field>
                <Field label="Investment Amount" styles={styles}>
                  <input
                    style={styles.inputDisabled}
                    disabled
                    value={transactions
                      .filter((t) => t.type === "Credit")
                      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                      .toLocaleString()}
                  />
                </Field>
                <Field label="Number of Shares" styles={styles}>
                  <input
                    style={styles.inputDisabled}
                    disabled
                    value={
                      (() => {
                        const total = transactions
                          .filter((t) => t.type === "Credit")
                          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
                        const n = total / PRICE_PER_SHARE;
                        return n % 1 === 0 ? String(n) : n.toFixed(2);
                      })()
                    }
                  />
                </Field>
                <div style={styles.submitWrap}>
                  <button style={styles.btnPrimary} onClick={submitOfficial}>Update</button>
                </div>
              </div>
            )}

            {/* ── Credit Shares ── */}
            {activeTab === "credit" && (
              <div style={styles.formSection}>
                <h5 style={styles.sectionTitle}>Credit Shares</h5>
                <Field label="Price per Share" styles={styles}>
                  {/* Always ₹20.00 */}
                  <input style={styles.inputDisabled} disabled value={`₹${PRICE_PER_SHARE.toFixed(2)}`} />
                </Field>
                <Field label="Investment Amount" styles={styles}>
                  <input
                    type="number"
                    style={styles.inputStyle}
                    value={creditForm.investmentAmount}
                    onChange={(e) => setCreditForm({ ...creditForm, investmentAmount: e.target.value })}
                    placeholder="Enter investment amount"
                  />
                </Field>
                <Field label="Number of Shares" styles={styles}>
                  {/* Auto-calculated: investmentAmount / 20, updates on every keystroke */}
                  <input style={styles.inputDisabled} disabled value={creditForm.numberOfShares} />
                </Field>
                <div style={styles.submitWrap}>
                  <button style={styles.btnPrimary} onClick={submitCredit}>Update</button>
                </div>
              </div>
            )}

            {/* ── Debit Shares ── */}
            {activeTab === "debit" && (
              <div style={styles.formSection}>
                <h5 style={styles.sectionTitle}>Debit Shares</h5>
                <Field label="Amount" styles={styles}>
                  <input
                    type="number"
                    style={styles.inputStyle}
                    value={debitForm.amount}
                    onChange={(e) => setDebitForm({ ...debitForm, amount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </Field>
                <Field label="Remaining Share Balance" styles={styles}>
                  <input style={styles.inputDisabled} disabled value={debitForm.remainingShares} />
                </Field>
                <Field label="Remaining Shares" styles={styles}>
                  <input style={styles.inputDisabled} disabled value={debitForm.remainingCount} />
                </Field>
                <Field label="Payment Mode" styles={styles}>
                  <select
                    style={styles.inputStyle}
                    value={debitForm.paymentMode}
                    onChange={(e) => setDebitForm({ ...debitForm, paymentMode: e.target.value })}
                  >
                    {["Cash", "Cheque", "UPI", "Bank Transfer"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Cheque Number" styles={styles}>
                  <input
                    style={styles.inputStyle}
                    value={debitForm.chequeNumber}
                    onChange={(e) => setDebitForm({ ...debitForm, chequeNumber: e.target.value })}
                    placeholder="If applicable"
                  />
                </Field>
                <Field label="Transaction Id" styles={styles}>
                  <input
                    style={styles.inputStyle}
                    value={debitForm.transactionId}
                    onChange={(e) => setDebitForm({ ...debitForm, transactionId: e.target.value })}
                    placeholder="Enter transaction ID"
                  />
                </Field>
                {/* ── NEW: Transfer Share To ── */}
                <Field label="Transfer Share To" styles={styles}>
                  <select
                    style={styles.inputStyle}
                    value={debitForm.transferShareTo}
                    onChange={(e) => setDebitForm({ ...debitForm, transferShareTo: e.target.value })}
                  >
                    <option value="Members Loan Account">Members Loan Account</option>
                    <option value="Members Account">Members Account</option>
                  </select>
                </Field>
                {/* ── NEW: Share Certificate Number ── */}
                <Field label="Share Certificate No." styles={styles}>
                  <input
                    style={styles.inputStyle}
                    value={debitForm.shareCertificateNumber}
                    onChange={(e) => setDebitForm({ ...debitForm, shareCertificateNumber: e.target.value })}
                    placeholder="Enter certificate number"
                  />
                </Field>
                <div style={styles.submitWrap}>
                  <button style={styles.btnPrimary} onClick={submitDebit}>Update</button>
                </div>
              </div>
            )}

            {/* ── Dividend Details ── */}
            {activeTab === "dividend" && (
              <>
                <div style={styles.formSection}>
                  <h5 style={styles.sectionTitle}>Dividend Details</h5>
                  <Field label="Share Balance" styles={styles}>
                    <input style={styles.inputDisabled} disabled value={Number(currentBalance || 0).toLocaleString()} />
                  </Field>
                  <Field label="Dividend Rate" styles={styles}>
                    <input style={styles.inputDisabled} disabled value={dividendRateDisplay} />
                  </Field>
                  <Field label="Dividend Amount" styles={styles}>
                    <input style={styles.inputDisabled} disabled value={Number(dividendAmount).toLocaleString()} />
                  </Field>
                </div>
                <div style={styles.warningWrap}>
                  <div style={styles.warningBox}>
                    ⚠️ Withdrawal is allowed only after completion of one financial year (1 April to 31 March); otherwise, no dividend will be payable.
                  </div>
                </div>
              </>
            )}

            {/* ── Total Transaction Details ── */}
            {activeTab === "transaction" && (
              <div>
                <h5 style={styles.sectionTitle}>Total Transaction Details</h5>
                <div ref={txScrollRef} style={{ overflowX: "auto", overflowY: "auto", height: "380px" }}>
                  <table style={styles.table}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        {["#", "Amount", "Credit/Debit"].map((h) => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center", padding: "28px", color: "#aaa" }}>
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((item, i) => (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fdfdfd" }}>
                            <td style={styles.td}>{i + 1}</td>
                            <td style={{ ...styles.td, fontWeight: "600" }}>
                              {item.amount != null ? item.amount.toLocaleString() : "None"}
                            </td>
                            <td style={styles.td}>
                              <span style={item.type === "Credit" ? styles.badgeCredit : styles.badgeDebit}>
                                {item.type || "Debit"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}