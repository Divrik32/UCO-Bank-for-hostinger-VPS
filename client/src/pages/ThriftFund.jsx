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
//  Field component — responsive label/input layout
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
    {!isMobile && (
      <div style={{ flex: "0 0 210px", textAlign: "right" }}>
        <label style={{ fontSize: "14px", fontWeight: "600", color: "#444", fontFamily: "'Inter', sans-serif" }}>
          {label}
        </label>
      </div>
    )}
    {isMobile && (
      <label style={{ fontSize: "13px", fontWeight: "600", color: "#444", fontFamily: "'Inter', sans-serif" }}>
        {label}
      </label>
    )}
    <div style={{ flex: "1 1 260px", width: isMobile ? "100%" : "auto" }}>
      {children}
    </div>
  </div>
);

export default function ThriftFund() {
  const { isMobile, isTablet, isDesktop, width } = useBreakpoint();
  const [memberCode, setMemberCode] = useState("");
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState("entry");
  const [interestRate, setInterestRate] = useState("");
  const [entryPaymentMethods, setEntryPaymentMethods] = useState([]);
  const [withdrawalPaymentMethods, setWithdrawalPaymentMethods] = useState([]);

  const [entryForm, setEntryForm] = useState({
    totalAmountReceived: "",
    paymentMethod: entryPaymentMethods[0] || "",
    chequeNumber: "",
    yearlyInterestAmount: "",
    entryDate: "",
    receivedBy: "",
  });

  const [withdrawalForm, setWithdrawalForm] = useState({
    withdrawalAmount: "",
    paymentMethod: withdrawalPaymentMethods[0] || "",
    chequeNumber: "",
    withdrawalDate: "",
    approvedBy: "",
  });

  const API = "/thrift-fund";
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const txScrollRef = useRef(null);

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
    const interest = (Number(entryForm.totalAmountReceived) * Number(interestRate) * 1) / 100;
    setEntryForm((prev) => ({ ...prev, yearlyInterestAmount: interest.toFixed(2) }));
  }, [entryForm.totalAmountReceived, interestRate]);

  useEffect(() => {
    fetchInterestRate();
    fetchThriftPaymentMethods();
  }, []);

  const fetchAvailableBalance = async (memberId) => {
    try {
      const res = await api.get(`${API}/available-balance/${memberId}`);
      setAvailableBalance(res.data.availableBalance || 0);
    } catch { toast.error("Failed to fetch balance"); }
  };

  const fetchInterestRate = async () => {
    try {
      const res = await api.get(`${API}/interest-rate`);
      setInterestRate(res.data.data.rate);
    } catch { console.error("Failed to fetch interest rate"); }
  };

  const fetchThriftPaymentMethods = async () => {
    try {
      const res = await api.get(`${API}/payment-methods`);
  
      setEntryPaymentMethods(res.data.data.entryMethods || []);
      setWithdrawalPaymentMethods(res.data.data.withdrawalMethods || []);
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

  const handleSearch = async () => {
    try {
      if (!memberCode.trim()) return;
      setLoading(true);
      const res = await api.get(`${API}/member/${memberCode}`);
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
      const txRes = await api.get(`${API}/transaction/${memberCode}`);
      setTransactions(txRes.data.data || []);
      await fetchAvailableBalance(memberCode);
      setActiveTab("entry");
    } catch (error) {
      toast.error(error.response?.data?.message || "Member not found");
    } finally {
      setLoading(false);
    }
  };

  const submitEntry = async () => {
    try {
      await api.post(`${API}/thrift-entry`, {
        memberId: member.memberId,
        ...entryForm,
        totalAmountReceived: Number(entryForm.totalAmountReceived),
      });
      toast.success("Entry created successfully");
      await fetchAvailableBalance(member.memberId);
      setEntryForm({ totalAmountReceived: "", paymentMethod: entryPaymentMethods[0] || "", chequeNumber: "", yearlyInterestAmount: "", entryDate: "", receivedBy: "" });
      handleSearch();
    } catch (error) { toast.error(error.response?.data?.message); }
  };

  const submitWithdrawal = async () => {
    try {
      await api.post(`${API}/thrift-withdrawal`, {
        memberId: member.memberId,
        ...withdrawalForm,
        withdrawalAmount: Number(withdrawalForm.withdrawalAmount),
      });
      toast.success("Withdrawal successful");
      await fetchAvailableBalance(member.memberId);
      setWithdrawalForm({ withdrawalAmount: "", paymentMethod: withdrawalPaymentMethods[0] || "", chequeNumber: "", withdrawalDate: "", approvedBy: "" });
      handleSearch();
    } catch (error) { toast.error(error.response?.data?.message); }
  };

  const tabs = [
    { key: "entry",       label: "Thrift Fund Entry" },
    { key: "withdrawal",  label: "Thrift Fund Withdrawal" },
    { key: "transaction", label: "Total Transaction Details" },
  ];

  // ── Shared input styles ──
  const inputStyle = {
    width: "100%",
    padding: "9px 14px",
    fontSize: isMobile ? "14px" : "15px",
    border: "1.5px solid #ced4da",
    borderRadius: "5px",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
  };

  const inputDisabled = {
    ...inputStyle,
    border: "1.5px solid #e0e3f0",
    backgroundColor: "#e2e8f0",
    color: "#666",
  };

  const disabledInput = {
    width: "100%",
    padding: "9px 14px",
    fontSize: isMobile ? "13px" : "15px",
    border: "1px solid #e0e3f0",
    borderRadius: "5px",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    backgroundColor: "#e2e8f0",
    color: "#555",
    boxSizing: "border-box",
  };

  const btnPrimary = {
    backgroundColor: "#1e40af",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: isMobile ? "10px 24px" : "10px 32px",
    fontSize: isMobile ? "14px" : "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    width: isMobile ? "100%" : "auto",
  };

  const th = {
    padding: isMobile ? "8px 10px" : "11px 14px",
    textAlign: "left",
    fontWeight: "700",
    color: "#1a2052",
    backgroundColor: "#e2e8f0",
    borderBottom: "2px solid #e2e8f0",
    fontFamily: "'Inter', sans-serif",
    fontSize: isMobile ? "12px" : "13px",
    whiteSpace: "nowrap",
  };

  const td = {
    padding: isMobile ? "8px 10px" : "10px 14px",
    borderBottom: "1px solid #f0f2ff",
    color: "#333",
    fontSize: isMobile ? "12px" : "14px",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: isMobile ? "16px 12px" : isTablet ? "20px 18px" : "28px 32px",
        fontFamily: "'Inter', sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "flex-start",
          gap: isMobile ? "8px" : "0",
          marginBottom: "6px",
        }}
      >
        <div>
          <h1 style={{ fontSize: isMobile ? "20px" : "26px", fontWeight: "700", color: "#1a2052", margin: 0, fontFamily: "'Inter', sans-serif" }}>
            Thrift Funds
          </h1>
          <nav style={{ fontSize: "13px", color: "#888", marginTop: "5px" }}>
            <a href="/" style={{ color: "#1e40af", textDecoration: "none", fontWeight: "600" }}>Home</a>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ fontWeight: "600" }}>Thrift Funds</span>
          </nav>
        </div>
        {!isMobile && (
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontWeight: "700", fontSize: "16px", color: "#1a2052" }}>Regd. 203, Hari Om Commercial Complex</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>New Dak Bunglow Road, Patna-800001</p>
          </div>
        )}
      </div>

      {/* ── Info Pills ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "stretch", borderRadius: "7px", overflow: "hidden", border: "1.5px solid #dbeafe", boxShadow: "0 1px 4px rgba(30,64,175,0.08)" }}>
          <div style={{ backgroundColor: "#1e40af", color: "#fff", fontWeight: "700", fontSize: "13px", fontFamily: "'Inter', sans-serif", padding: "8px 14px", whiteSpace: "nowrap" }}>
            Interest Rate
          </div>
          <div style={{ backgroundColor: "#eff6ff", color: "#1e40af", fontWeight: "800", fontSize: "14px", fontFamily: "'Inter', sans-serif", padding: "8px 14px", whiteSpace: "nowrap", minWidth: "50px", textAlign: "center" }}>
            {interestRate !== "" ? `${interestRate}%` : "—"}
          </div>
        </div>
        {member && (
          <div style={{ display: "flex", alignItems: "stretch", borderRadius: "7px", overflow: "hidden", border: "1.5px solid #d1fae5", boxShadow: "0 1px 4px rgba(16,185,129,0.08)" }}>
            <div style={{ backgroundColor: "#059669", color: "#fff", fontWeight: "700", fontSize: "13px", fontFamily: "'Inter', sans-serif", padding: "8px 14px", whiteSpace: "nowrap" }}>
              Available Balance
            </div>
            <div style={{ backgroundColor: "#ecfdf5", color: "#065f46", fontWeight: "800", fontSize: "14px", fontFamily: "'Inter', sans-serif", padding: "8px 14px", whiteSpace: "nowrap", minWidth: "70px", textAlign: "center" }}>
              ₹{Number(availableBalance).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div style={{ display: "flex", justifyContent: isMobile ? "stretch" : "flex-end", marginBottom: "14px" }}>
        <div style={{ width: isMobile ? "100%" : "auto" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#444", fontFamily: "'Inter', sans-serif", display: "block", marginBottom: "4px" }}>
            Member Code:
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                padding: "9px 14px", fontSize: "14px",
                border: "1.5px solid #ced4da", borderRadius: "5px",
                fontFamily: "'Inter', sans-serif", outline: "none",
                backgroundColor: "#fff",
                flex: isMobile ? 1 : "none",
                width: isMobile ? "auto" : "200px",
              }}
              placeholder="Enter member code"
            />
            <button
              onClick={handleSearch}
              style={{ backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "5px", padding: "9px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile || isTablet ? "column" : "row",
          gap: "18px",
          alignItems: "flex-start",
        }}
      >
        {/* Profile Card */}
        <div
          style={{
            width: isMobile ? "100%" : isTablet ? "100%" : "300px",
            flexShrink: 0,
            backgroundColor: "white",
            borderRadius: "10px",
            boxShadow: "0 2px 12px rgba(10,25,47,0.12)",
            overflow: "hidden",
          }}
        >
          <div style={{ backgroundColor: "#1e40af", padding: "12px 16px" }}>
            <h5 style={{ fontWeight: "700", fontSize: "15px", color: "#fff", margin: 0, fontFamily: "'Inter', sans-serif" }}>Profile</h5>
          </div>
          <div
            style={{
              padding: "14px 16px 18px",
              display: isTablet ? "grid" : "flex",
              gridTemplateColumns: isTablet ? "1fr 1fr" : undefined,
              flexDirection: isTablet ? undefined : "column",
              alignItems: isTablet ? "start" : "center",
              gap: "10px",
            }}
          >
            <input style={disabledInput} disabled placeholder={member ? `${member.firstname} ${member.lastname}` : "Name"} />
            <input style={disabledInput} disabled placeholder={member?.memberId || "Member Code"} />

            {/* Avatar + Signature — always center on tablet */}
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

            <input style={disabledInput} disabled placeholder={member?.phoneno || "Phone"} />
            <input style={disabledInput} disabled placeholder={member?.email || "Email"} />
          </div>
        </div>

        {/* Tabs Panel */}
        {member && (
          <div
            style={{
              flex: 1,
              backgroundColor: "white",
              borderRadius: "10px",
              boxShadow: "0 2px 12px rgba(10,25,47,0.12)",
              padding: isMobile ? "14px 12px" : "20px 22px",
              minWidth: 0,
              width: "100%",
            }}
          >
            {/* Tab Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", borderBottom: "2.5px solid #cbd5e1", marginBottom: "20px" }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={
                    activeTab === t.key
                      ? { padding: isMobile ? "7px 10px" : "9px 18px", fontSize: isMobile ? "12px" : "13px", fontWeight: "700", border: "1.5px solid #cbd5e1", borderBottom: "2.5px solid #ffffff", borderRadius: "6px 6px 0 0", cursor: "pointer", fontFamily: "'Inter', sans-serif", backgroundColor: "#ffffff", color: "#1e40af", marginBottom: "-2.5px" }
                      : { padding: isMobile ? "7px 10px" : "9px 18px", fontSize: isMobile ? "12px" : "13px", fontWeight: "600", border: "1px solid transparent", borderBottom: "none", borderRadius: "6px 6px 0 0", cursor: "pointer", fontFamily: "'Inter', sans-serif", backgroundColor: "transparent", color: "#666" }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Entry Tab ── */}
            {activeTab === "entry" && (
              <div style={{ maxWidth: "680px" }}>
                <h5 style={{ fontWeight: "700", marginBottom: "18px", fontSize: "15px", color: "#1a2052", fontFamily: "'Inter', sans-serif", paddingBottom: "8px", borderBottom: "1.5px solid #e2e8f0" }}>
                  Thrift Fund Entry
                </h5>
                <Field label="Total Amount Received" isMobile={isMobile}>
                  <input type="number" style={inputStyle} value={entryForm.totalAmountReceived} onChange={(e) => setEntryForm({ ...entryForm, totalAmountReceived: e.target.value })} placeholder="Enter amount" />
                </Field>
                <Field label="Payment Method" isMobile={isMobile}>
                  <select
                    style={inputStyle}
                    value={entryForm.paymentMethod}
                    onChange={(e) =>
                      setEntryForm({
                        ...entryForm,
                        paymentMethod: e.target.value,
                      })
                    }
                  >
                    {entryPaymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </Field>
                {/* <Field label="Transaction ID" isMobile={isMobile}>
                  <input style={inputStyle} value={entryForm.transactionId} onChange={(e) => setEntryForm({ ...entryForm, transactionId: e.target.value })} placeholder="Enter transaction ID" />
                </Field> */}
                <Field label="Cheque Number" isMobile={isMobile}>
                  <input style={inputStyle} value={entryForm.chequeNumber} onChange={(e) => setEntryForm({ ...entryForm, chequeNumber: e.target.value })} placeholder="If applicable" />
                </Field>
                <Field label="Yearly Interest Amount" isMobile={isMobile}>
                  <input style={inputDisabled} disabled value={entryForm.yearlyInterestAmount} />
                </Field>
                <Field label="Available Balance" isMobile={isMobile}>
                  <input style={inputDisabled} disabled value={availableBalance} />
                </Field>
                <Field label="Balance After Entry" isMobile={isMobile}>
                  <input style={inputDisabled} disabled value={entryForm.totalAmountReceived ? (Number(availableBalance) + Number(entryForm.totalAmountReceived)).toFixed(2) : availableBalance} />
                </Field>
                <Field label="Entry Date" isMobile={isMobile}>
                  <input type="date" style={inputStyle} value={entryForm.entryDate} onChange={(e) => setEntryForm({ ...entryForm, entryDate: e.target.value })} />
                </Field>
                <Field label="Received By" isMobile={isMobile}>
                  <input style={inputStyle} value={entryForm.receivedBy} onChange={(e) => setEntryForm({ ...entryForm, receivedBy: e.target.value })} placeholder="Name of receiver" />
                </Field>
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <button style={btnPrimary} onClick={submitEntry}>Update</button>
                </div>
              </div>
            )}

            {/* ── Withdrawal Tab ── */}
            {activeTab === "withdrawal" && (
              <div style={{ maxWidth: "680px" }}>
                <h5 style={{ fontWeight: "700", marginBottom: "18px", fontSize: "15px", color: "#1a2052", fontFamily: "'Inter', sans-serif", paddingBottom: "8px", borderBottom: "1.5px solid #e2e8f0" }}>
                  Thrift Fund Withdrawal
                </h5>
                <Field label="Withdrawal Amount" isMobile={isMobile}>
                  <input type="number" style={inputStyle} value={withdrawalForm.withdrawalAmount} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, withdrawalAmount: e.target.value })} placeholder="Enter amount" />
                </Field>
                <Field label="Available Balance" isMobile={isMobile}>
                  <input style={inputDisabled} disabled value={availableBalance} />
                </Field>
                <Field label="Remaining Balance" isMobile={isMobile}>
                  <input style={inputDisabled} disabled value={withdrawalForm.withdrawalAmount ? (Number(availableBalance) - Number(withdrawalForm.withdrawalAmount)).toFixed(2) : availableBalance} />
                </Field>
                <Field label="Payment Method" isMobile={isMobile}>
                  <select
                    style={inputStyle}
                    value={withdrawalForm.paymentMethod}
                    onChange={(e) =>
                      setWithdrawalForm({
                        ...withdrawalForm,
                        paymentMethod: e.target.value,
                      })
                    }
                  >
                    {withdrawalPaymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </Field>
                {/* <Field label="Transaction ID" isMobile={isMobile}>
                  <input style={inputStyle} value={withdrawalForm.transactionId} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, transactionId: e.target.value })} placeholder="Enter transaction ID" />
                </Field> */}
                <Field label="Cheque Number" isMobile={isMobile}>
                  <input style={inputStyle} value={withdrawalForm.chequeNumber} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, chequeNumber: e.target.value })} placeholder="If applicable" />
                </Field>
                <Field label="Withdrawal Date" isMobile={isMobile}>
                  <input type="date" style={inputStyle} value={withdrawalForm.withdrawalDate} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, withdrawalDate: e.target.value })} />
                </Field>
                <Field label="Approved By" isMobile={isMobile}>
                  <input style={inputStyle} value={withdrawalForm.approvedBy} onChange={(e) => setWithdrawalForm({ ...withdrawalForm, approvedBy: e.target.value })} placeholder="Approver's name" />
                </Field>
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <button style={btnPrimary} onClick={submitWithdrawal}>Submit</button>
                </div>
              </div>
            )}

            {/* ── Transaction Tab ── */}
            {activeTab === "transaction" && (
              <div>
                <h5 style={{ fontWeight: "700", marginBottom: "18px", fontSize: "15px", color: "#1a2052", fontFamily: "'Inter', sans-serif", paddingBottom: "8px", borderBottom: "1.5px solid #e2e8f0" }}>
                  Total Transaction Details
                </h5>
                <div ref={txScrollRef} style={{ overflowX: "auto", overflowY: "auto", height: "340px", borderRadius: "6px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        {["#", "Amount", "Credit / Debit", "Date", "Interest", "Transaction ID"].map((h) => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "#aaa" }}>No transactions found</td>
                        </tr>
                      ) : (
                        transactions.map((item, i) => (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fdfdfd" }}>
                            <td style={td}>{i + 1}</td>
                            <td style={{ ...td, fontWeight: "600" }}>₹{item.amount.toLocaleString()}</td>
                            <td style={td}>
                              <span style={item.type === "Credit"
                                ? { display: "inline-block", padding: "2px 10px", borderRadius: "20px", backgroundColor: "#d4f8e8", color: "#1a7a4a", fontWeight: "600", fontSize: "12px" }
                                : { display: "inline-block", padding: "2px 10px", borderRadius: "20px", backgroundColor: "#fde8e8", color: "#c0392b", fontWeight: "600", fontSize: "12px" }
                              }>
                                {item.type}
                              </span>
                            </td>
                            <td style={td}>{formatDateTime(item.date)}</td>
                            <td style={td}>{item.interest ? Number(item.interest).toFixed(2) : "-"}</td>
                            <td style={{ ...td, fontFamily: "monospace", fontSize: "12px" }}>{item.transactionId || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", alignItems: "stretch", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(30,64,175,0.10)", border: "1.5px solid #dbeafe", width: "fit-content", marginLeft: "auto", marginTop: "12px" }}>
                  <div style={{ backgroundColor: "#1e40af", color: "#fff", fontWeight: "700", fontSize: "13px", fontFamily: "'Inter', sans-serif", padding: "10px 18px", whiteSpace: "nowrap" }}>Available Balance</div>
                  <div style={{ backgroundColor: "#eff6ff", color: "#1e40af", fontWeight: "800", fontSize: "14px", fontFamily: "'Inter', sans-serif", padding: "10px 18px", whiteSpace: "nowrap" }}>
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