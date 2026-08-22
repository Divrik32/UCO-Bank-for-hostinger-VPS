import api from "../api/axios";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────
//  Responsive hook
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  Field component
// ─────────────────────────────────────────────
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
    {isMobile ? (
      <label style={{ fontSize: "13px", fontWeight: "600", color: "#444", fontFamily: "'Inter', sans-serif" }}>
        {label}
      </label>
    ) : (
      <div style={{ flex: "0 0 190px", textAlign: "right" }}>
        <label style={{ fontSize: "14px", fontWeight: "600", color: "#444", fontFamily: "'Inter', sans-serif" }}>
          {label}
        </label>
      </div>
    )}
    <div style={{ flex: "1 1 260px", width: isMobile ? "100%" : "auto" }}>
      {children}
    </div>
  </div>
);

const PRICE_PER_SHARE = 20;

export default function SharePurchase() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [currentBalance, setCurrentBalance] = useState(null);
  const [memberCode, setMemberCode] = useState("");
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState("official");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [dividendRate, setDividendRate] = useState(0);
  const [creditPaymentMethods, setCreditPaymentMethods] = useState([]);
  const [debitPaymentMethods, setDebitPaymentMethods] = useState([]);

  const [officialForm, setOfficialForm] = useState({ officeName: "", dateOfJoin: "", dateOfAllotment: "", dateOfRetirement: "" });
  const [creditForm, setCreditForm] = useState({
    investmentAmount: "",
    numberOfShares: "",
    paymentMode: creditPaymentMethods[0] || "",
  });
  
  const [debitForm, setDebitForm] = useState({
    amount: "",
    remainingShares: "",
    remainingCount: "",
    paymentMode: debitPaymentMethods[0] || "",
    chequeNumber: "",
    transferShareTo: "Members Loan Account",
    shareCertificateNumber: "",
  });

  const API = "/share";
  const txScrollRef = useRef(null);

  useLayoutEffect(() => {
    if (activeTab === "transaction" && txScrollRef.current) {
      const el = txScrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [activeTab, transactions]);

  useEffect(() => { fetchInterestRate(); fetchSharePaymentMethods(); }, []);

  const fetchInterestRate = async () => {
    try {
      const res = await api.get(`${API}/share-interest`);
      setDividendRate(res.data.data?.rate || 0);
    } catch { setDividendRate(0); }
  };

  const fetchSharePaymentMethods = async () => {
    try {
      const res = await api.get(`${API}/payment-methods`);
  
      setCreditPaymentMethods(res.data.data?.creditMethods || []);
      setDebitPaymentMethods(res.data.data?.debitMethods || []);
    } catch (error) {
      console.error("Failed to fetch payment methods");
      toast.error("Failed to fetch payment methods");
    }
  };

    const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });
  };

  useEffect(() => {
    if (!creditForm.investmentAmount) { setCreditForm((prev) => ({ ...prev, numberOfShares: "" })); return; }
    const shares = Number(creditForm.investmentAmount) / PRICE_PER_SHARE;
    setCreditForm((prev) => ({ ...prev, numberOfShares: shares % 1 === 0 ? String(shares) : shares.toFixed(2) }));
  }, [creditForm.investmentAmount]);

  useEffect(() => {
    if (!debitForm.amount) { setDebitForm((prev) => ({ ...prev, remainingShares: "", remainingCount: "" })); return; }
    const totalCredit = transactions.filter((t) => t.type === "Credit").reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalDebit = transactions.filter((t) => t.type === "Debit").reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const availableBalance = totalCredit - totalDebit;
    const remainingBalance = availableBalance - Number(debitForm.amount);
    const remainingSharesCount = remainingBalance / PRICE_PER_SHARE;
    setDebitForm((prev) => ({
      ...prev,
      remainingShares: remainingBalance >= 0 ? remainingBalance.toFixed(2) : "0.00",
      remainingCount: remainingBalance >= 0 ? (remainingSharesCount % 1 === 0 ? String(remainingSharesCount) : remainingSharesCount.toFixed(2)) : "0",
    }));
  }, [debitForm.amount, transactions]);

  const dividendAmount = (((currentBalance || 0) * dividendRate) / 100).toFixed(2);

  const handleSearch = async () => {
    if (!memberCode.trim()) { toast.error("Enter member code"); return; }
    try {
      setLoading(true);
      const res = await api.get(`${API}/member/${memberCode.trim()}`);
      if (!res.data.success) { toast.error("Member not found"); return; }
      const data = res.data.data;
      setMember({ memberId: data.memberId, firstname: data.name?.split(" ")[0] || "", lastname: data.name?.split(" ").slice(1).join(" ") || "", phoneNumber: data.phoneNumber, email: data.email, profileImage: data.profileImage, signatureImage: data.signatureImage });
      setActiveTab("official");
      const balanceRes = await api.get(`${API}/share-balance/${memberCode.trim()}`);
      setCurrentBalance(balanceRes.data.availableBalance);
      const creditRes = await api.get(`${API}/credit-share/${memberCode.trim()}`);
      const debitRes = await api.get(`${API}/debit-share/${memberCode.trim()}`);
      const credits = creditRes.data.data.map((item) => ({ amount: item.investmentAmount, type: "Credit", createdAt: item.createdAt, }));
      const debits = debitRes.data.data.map((item) => ({ amount: item.amount, type: "Debit", createdAt: item.createdAt, }));
      setTransactions([...credits, ...debits]);
    } catch (error) {
      if (error.response?.status === 404) toast.error("Member not found");
      else toast.error(error.response?.data?.message || "Search failed");
      setMember(null); setTransactions([]);
    } finally { setLoading(false); }
  };

  const submitOfficial = async () => {
    try {
      await api.post(`${API}/official-details`, { memberId: member.memberId, ...officialForm });
      toast.success("Official details updated successfully");
    } catch (error) { toast.error(error.response?.data?.message || "Failed to update"); }
  };

  const submitCredit = async () => {
    try {
      await api.post(`${API}/credit-share`, {
        memberId: member.memberId,
        pricePerShare: PRICE_PER_SHARE,
        investmentAmount: Number(creditForm.investmentAmount),
        numberOfShares: Number(creditForm.numberOfShares),
        paymentMode: creditForm.paymentMode
      });
  
      toast.success("Credit shares updated successfully");
  
      setCreditForm({
        investmentAmount: "",
        numberOfShares: "",
        paymentMode: creditPaymentMethods[0] || ""
      });
  
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    }
  };

  const submitDebit = async () => {
    try {
      await api.post(`${API}/debit-share`, { memberId: member.memberId, amount: Number(debitForm.amount), paymentMode: debitForm.paymentMode, chequeNumber: debitForm.chequeNumber, transferShareTo: debitForm.transferShareTo, shareCertificateNumber: debitForm.shareCertificateNumber });
      toast.success("Debit shares updated successfully");
      setDebitForm({ amount: "", remainingShares: "", remainingCount: "", paymentMode: debitPaymentMethods[0] || "", chequeNumber: "", transferShareTo: "Members Loan Account", shareCertificateNumber: "" });
      handleSearch();
    } catch (error) { toast.error(error.response?.data?.message || "Failed to update"); }
  };

  const tabs = [
    { key: "official",    label: "Official Details" },
    { key: "credit",      label: "Credit Shares" },
    { key: "debit",       label: "Debit Shares" },
    { key: "dividend",    label: "Dividend Details" },
    { key: "transaction", label: "Total Transaction Details" },
  ];

  // ── Shared input styles ──
  const inputStyle = {
    width: "100%", padding: "9px 14px",
    fontSize: isMobile ? "14px" : "15px",
    border: "1.5px solid #ced4da", borderRadius: "5px",
    fontFamily: "'Inter', sans-serif", outline: "none",
    backgroundColor: "#ffffff", boxSizing: "border-box",
  };
  const inputDisabled = {
    ...inputStyle, border: "1.5px solid #e0e3f0",
    backgroundColor: "#e2e8f0", color: "#666",
  };
  const disabledInput = {
    width: "100%", padding: "9px 14px",
    fontSize: isMobile ? "13px" : "15px",
    border: "1px solid #e0e3f0", borderRadius: "5px",
    fontFamily: "'Inter', sans-serif", outline: "none",
    backgroundColor: "#e2e8f0", color: "#555", boxSizing: "border-box",
  };
  const btnPrimary = {
    backgroundColor: "#1e40af", color: "white", border: "none",
    borderRadius: "6px", padding: isMobile ? "10px 24px" : "10px 32px",
    fontSize: isMobile ? "14px" : "15px", fontWeight: "700",
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
    width: isMobile ? "100%" : "auto",
  };
  const sectionTitle = {
    fontWeight: "700", marginBottom: "18px", fontSize: "15px",
    color: "#1a2052", fontFamily: "'Inter', sans-serif",
    paddingBottom: "8px", borderBottom: "1.5px solid #e2e8f0",
  };
  const th = {
    padding: isMobile ? "8px 10px" : "11px 14px", textAlign: "center",
    fontWeight: "700", color: "#1a2052", backgroundColor: "#e2e8f0",
    borderBottom: "2px solid #e2e8f0", fontFamily: "'Inter', sans-serif",
    fontSize: isMobile ? "12px" : "13px", whiteSpace: "nowrap",
  };
  const td = {
    padding: isMobile ? "8px 10px" : "10px 14px",
    borderBottom: "1px solid #f0f2ff", color: "#333",
    fontSize: isMobile ? "12px" : "14px",
  };

  const pillLabel = { padding: "9px 16px", fontSize: "13px", fontWeight: "700", color: "#ffffff", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center" };
  const pillValue = { padding: "9px 16px", fontSize: "13px", fontWeight: "700", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: isMobile ? "16px 12px" : isTablet ? "20px 18px" : "28px 32px", fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}>

      {/* ── Top Bar ── */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: isMobile ? "10px" : "0", marginBottom: "6px" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "20px" : "26px", fontWeight: "700", color: "#1a2052", margin: 0, fontFamily: "'Inter', sans-serif" }}>Share Purchase</h1>
          <nav style={{ fontSize: "13px", color: "#888", marginTop: "5px" }}>
            <a href="/" style={{ color: "#1e40af", textDecoration: "none", fontWeight: "600" }}>Home</a>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ fontWeight: "600" }}>Share Purchase</span>
          </nav>

          {/* Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "stretch", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 6px rgba(10,25,47,0.10)" }}>
              <span style={{ ...pillLabel, backgroundColor: "#1e40af" }}>Interest Rate</span>
              <span style={{ ...pillValue, backgroundColor: "#eff6ff", color: "#1e40af" }}>{dividendRate}%</span>
            </div>
            {member && (
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 6px rgba(10,25,47,0.10)" }}>
                <span style={{ ...pillLabel, backgroundColor: "#059669" }}>Share Balance</span>
                <span style={{ ...pillValue, backgroundColor: "#ecfdf5", color: "#065f46" }}>₹{Number(currentBalance || 0).toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>
        </div>

        {!isMobile && (
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontWeight: "700", fontSize: "16px", color: "#1a2052" }}>Regd. 203, Hari Om Commercial Complex</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>New Dak Bunglow Road, Patna-800001</p>
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div style={{ display: "flex", justifyContent: isMobile ? "stretch" : "flex-end", marginBottom: "14px", marginTop: "14px" }}>
        <div style={{ width: isMobile ? "100%" : "auto" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#444", fontFamily: "'Inter', sans-serif", display: "block", marginBottom: "4px" }}>Member Code:</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text" value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ padding: "9px 14px", fontSize: "14px", border: "1.5px solid #ced4da", borderRadius: "5px", fontFamily: "'Inter', sans-serif", outline: "none", backgroundColor: "#fff", flex: isMobile ? 1 : "none", width: isMobile ? "auto" : "200px" }}
              placeholder="Enter member code"
            />
            <button onClick={handleSearch} style={{ backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "5px", padding: "9px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}>
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ display: "flex", flexDirection: isMobile || isTablet ? "column" : "row", gap: "18px", alignItems: "flex-start" }}>

        {/* Profile Card */}
        <div style={{ width: isMobile ? "100%" : isTablet ? "100%" : "300px", flexShrink: 0, backgroundColor: "white", borderRadius: "10px", boxShadow: "0 2px 12px rgba(10,25,47,0.12)", overflow: "hidden" }}>
          <div style={{ backgroundColor: "#1e40af", padding: "12px 16px" }}>
            <h5 style={{ fontWeight: "700", fontSize: "15px", color: "#fff", margin: 0, fontFamily: "'Inter', sans-serif" }}>Profile</h5>
          </div>
          <div style={{ padding: "14px 16px 18px", display: isTablet ? "grid" : "flex", gridTemplateColumns: isTablet ? "1fr 1fr" : undefined, flexDirection: isTablet ? undefined : "column", alignItems: isTablet ? "start" : "center", gap: "10px" }}>
            <input style={disabledInput} disabled value={member ? `${member.firstname} ${member.lastname}` : ""} placeholder="Name" />
            <input style={disabledInput} disabled value={member?.memberId || ""} placeholder="Member Code" />
            <div style={{ display: "flex", flexDirection: isTablet ? "row" : "column", gap: "10px", alignItems: "center", gridColumn: isTablet ? "1 / -1" : undefined }}>
              <div style={{ width: "110px", height: "110px", borderRadius: "50%", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #1e40af", overflow: "hidden", flexShrink: 0 }}>
                {member?.profileImage ? (
                  <img src={member.profileImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
                ) : (
                  <span style={{ fontSize: "52px" }}>👤</span>
                )}
              </div>
              <div style={{ border: "1px dashed #e2e8f0", borderRadius: "6px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", flex: 1, width: isTablet ? "auto" : "100%", padding: "6px" }}>
                {member?.signatureImage ? (
                  <img src={member.signatureImage} style={{ height: "40px", maxWidth: "80%", objectFit: "contain" }} alt="signature" />
                ) : (
                  <span style={{ color: "#aaa", fontStyle: "italic", fontSize: "13px" }}>Signature</span>
                )}
              </div>
            </div>
            <input style={disabledInput} disabled value={member?.phoneNumber || ""} placeholder="Phone" />
            <input style={disabledInput} disabled value={member?.email || ""} placeholder="Email" />
          </div>
        </div>

        {/* Tabs Panel */}
        {member && (
          <div style={{ flex: 1, backgroundColor: "white", borderRadius: "10px", boxShadow: "0 2px 12px rgba(10,25,47,0.12)", padding: isMobile ? "14px 12px" : "20px 22px", minWidth: 0, width: "100%" }}>

            {/* Tab Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", borderBottom: "2.5px solid #cbd5e1", marginBottom: "20px" }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={activeTab === t.key
                    ? { padding: isMobile ? "6px 8px" : "9px 18px", fontSize: isMobile ? "11px" : "13px", fontWeight: "700", border: "1.5px solid #cbd5e1", borderBottom: "2.5px solid #ffffff", borderRadius: "6px 6px 0 0", cursor: "pointer", fontFamily: "'Inter', sans-serif", backgroundColor: "#ffffff", color: "#1e40af", marginBottom: "-2.5px" }
                    : { padding: isMobile ? "6px 8px" : "9px 18px", fontSize: isMobile ? "11px" : "13px", fontWeight: "600", border: "1px solid transparent", borderBottom: "none", borderRadius: "6px 6px 0 0", cursor: "pointer", fontFamily: "'Inter', sans-serif", backgroundColor: "transparent", color: "#666" }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Official Details ── */}
            {activeTab === "official" && (
              <div style={{ maxWidth: "680px" }}>
                <h5 style={sectionTitle}>Official Details</h5>
                <Field label="Office Name" isMobile={isMobile}><input style={inputStyle} value={officialForm.officeName} onChange={(e) => setOfficialForm({ ...officialForm, officeName: e.target.value })} placeholder="Head-Office-01" /></Field>
                <Field label="Date of Join" isMobile={isMobile}><input type="date" style={inputStyle} value={officialForm.dateOfJoin} onChange={(e) => setOfficialForm({ ...officialForm, dateOfJoin: e.target.value })} /></Field>
                <Field label="Date of Allotment" isMobile={isMobile}><input type="date" style={inputStyle} value={officialForm.dateOfAllotment} onChange={(e) => setOfficialForm({ ...officialForm, dateOfAllotment: e.target.value })} /></Field>
                <Field label="Date of Retirement" isMobile={isMobile}><input type="date" style={inputStyle} value={officialForm.dateOfRetirement} onChange={(e) => setOfficialForm({ ...officialForm, dateOfRetirement: e.target.value })} /></Field>
                <hr style={{ border: "none", borderTop: "1.5px solid #e2e8f0", margin: "18px 0" }} />
                <h5 style={sectionTitle}>Share Information</h5>
                <Field label="Price per Share" isMobile={isMobile}><input style={inputDisabled} disabled value={`₹${PRICE_PER_SHARE.toFixed(2)}`} /></Field>
                <Field label="Investment Amount" isMobile={isMobile}><input style={inputDisabled} disabled value={transactions.filter((t) => t.type === "Credit").reduce((sum, t) => sum + Number(t.amount || 0), 0).toLocaleString()} /></Field>
                <Field label="Number of Shares" isMobile={isMobile}>
                  <input style={inputDisabled} disabled value={(() => { const total = transactions.filter((t) => t.type === "Credit").reduce((sum, t) => sum + Number(t.amount || 0), 0); const n = total / PRICE_PER_SHARE; return n % 1 === 0 ? String(n) : n.toFixed(2); })()} />
                </Field>
                <div style={{ textAlign: "center", marginTop: "20px" }}><button style={btnPrimary} onClick={submitOfficial}>Update</button></div>
              </div>
            )}

            {/* ── Credit Shares ── */}
{activeTab === "credit" && (
  <div style={{ maxWidth: "680px" }}>
    <h5
      style={{
        fontWeight: "700",
        marginBottom: "18px",
        fontSize: "15px",
        color: "#1a2052",
        fontFamily: "'Inter', sans-serif",
        paddingBottom: "8px",
        borderBottom: "1.5px solid #e2e8f0",
      }}
    >
      Credit Shares
    </h5>

    <Field label="Price per Share" isMobile={isMobile}>
      <input
        style={inputDisabled}
        disabled
        value={`₹${PRICE_PER_SHARE.toFixed(2)}`}
      />
    </Field>

    <Field label="Investment Amount" isMobile={isMobile}>
      <input
        type="number"
        style={inputStyle}
        value={creditForm.investmentAmount}
        onChange={(e) =>
          setCreditForm({
            ...creditForm,
            investmentAmount: e.target.value,
          })
        }
        placeholder="Enter investment amount"
      />
    </Field>

    <Field label="Number of Shares" isMobile={isMobile}>
      <input
        style={inputDisabled}
        disabled
        value={creditForm.numberOfShares}
      />
    </Field>

    <Field label="Payment Mode" isMobile={isMobile}>
      <select
        style={inputStyle}
        value={creditForm.paymentMode}
        onChange={(e) =>
          setCreditForm({
            ...creditForm,
            paymentMode: e.target.value,
          })
        }
      >
        {creditPaymentMethods.map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </select>
    </Field>

    {/* <Field label="Transaction ID" isMobile={isMobile}>
      <input
        style={inputStyle}
        value={creditForm.transactionId}
        onChange={(e) =>
          setCreditForm({
            ...creditForm,
            transactionId: e.target.value,
          })
        }
        placeholder="Enter transaction ID"
      />
    </Field> */}

    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <button style={btnPrimary} onClick={submitCredit}>
        Update
      </button>
    </div>
  </div>
)}

            {/* ── Debit Shares ── */}
            {activeTab === "debit" && (
              <div style={{ maxWidth: "680px" }}>
                <h5 style={sectionTitle}>Debit Shares</h5>
                <Field label="Amount" isMobile={isMobile}><input type="number" style={inputStyle} value={debitForm.amount} onChange={(e) => setDebitForm({ ...debitForm, amount: e.target.value })} placeholder="Enter amount" /></Field>
                <Field label="Remaining Share Balance" isMobile={isMobile}><input style={inputDisabled} disabled value={debitForm.remainingShares} /></Field>
                <Field label="Remaining Shares" isMobile={isMobile}><input style={inputDisabled} disabled value={debitForm.remainingCount} /></Field>
                <Field label="Payment Mode" isMobile={isMobile}>
                  <select
                    style={inputStyle}
                    value={debitForm.paymentMode}
                    onChange={(e) =>
                      setDebitForm({
                        ...debitForm,
                        paymentMode: e.target.value
                      })
                    }
                  >
                    {debitPaymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Cheque Number" isMobile={isMobile}><input style={inputStyle} value={debitForm.chequeNumber} onChange={(e) => setDebitForm({ ...debitForm, chequeNumber: e.target.value })} placeholder="If applicable" /></Field>
                {/* <Field label="Transaction Id" isMobile={isMobile}><input style={inputStyle} value={debitForm.transactionId} onChange={(e) => setDebitForm({ ...debitForm, transactionId: e.target.value })} placeholder="Enter transaction ID" /></Field> */}
                <Field label="Transfer Share To" isMobile={isMobile}>
                  <select style={inputStyle} value={debitForm.transferShareTo} onChange={(e) => setDebitForm({ ...debitForm, transferShareTo: e.target.value })}>
                    <option value="Members Loan Account">Members Loan Account</option>
                    <option value="Members Account">Members Account</option>
                  </select>
                </Field>
                <Field label="Share Certificate No." isMobile={isMobile}><input style={inputStyle} value={debitForm.shareCertificateNumber} onChange={(e) => setDebitForm({ ...debitForm, shareCertificateNumber: e.target.value })} placeholder="Enter certificate number" /></Field>
                <div style={{ textAlign: "center", marginTop: "20px" }}><button style={btnPrimary} onClick={submitDebit}>Update</button></div>
              </div>
            )}

            {/* ── Dividend Details ── */}
            {activeTab === "dividend" && (
              <>
                <div style={{ maxWidth: "680px" }}>
                  <h5 style={sectionTitle}>Dividend Details</h5>
                  <Field label="Share Balance" isMobile={isMobile}><input style={inputDisabled} disabled value={Number(currentBalance || 0).toLocaleString()} /></Field>
                  <Field label="Dividend Rate" isMobile={isMobile}><input style={inputDisabled} disabled value={`${dividendRate}%`} /></Field>
                  <Field label="Dividend Amount" isMobile={isMobile}><input style={inputDisabled} disabled value={Number(dividendAmount).toLocaleString()} /></Field>
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginTop: "28px" }}>
                  <div style={{ backgroundColor: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "12px 20px", color: "#dc2626", fontSize: "13px", fontWeight: "600", lineHeight: "1.6", fontFamily: "'Inter', sans-serif", textAlign: "center", maxWidth: "560px", width: "100%" }}>
                    ⚠️ Withdrawal is allowed only after completion of one financial year (1 April to 31 March); otherwise, no dividend will be payable.
                  </div>
                </div>
              </>
            )}

            {/* ── Transaction Details ── */}
            {activeTab === "transaction" && (
              <div>
                <h5 style={sectionTitle}>Total Transaction Details</h5>
                <div ref={txScrollRef} style={{ overflowX: "auto", overflowY: "auto", height: "340px", borderRadius: "6px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        {["#", "Amount", "Credit/Debit", "Date"].map((h) => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr><td colSpan={3} style={{ textAlign: "center", padding: "28px", color: "#aaa" }}>No transactions found</td></tr>
                      ) : (
                        transactions.map((item, i) => (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fdfdfd" }}>
                            <td style={td}>{i + 1}</td>
                            <td style={{ ...td, fontWeight: "600" }}>{item.amount != null ? item.amount.toLocaleString() : "None"}</td>
                            <td style={td}>
                              <span style={item.type === "Credit"
                                ? { display: "inline-block", padding: "2px 10px", borderRadius: "20px", backgroundColor: "#d4f8e8", color: "#1a7a4a", fontWeight: "600", fontSize: "12px" }
                                : { display: "inline-block", padding: "2px 10px", borderRadius: "20px", backgroundColor: "#fde8e8", color: "#c0392b", fontWeight: "600", fontSize: "12px" }
                              }>
                                {item.type || "Debit"}
                              </span>
                            </td>
                            <td style={td}>{formatDateTime(item.createdAt)}</td>
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