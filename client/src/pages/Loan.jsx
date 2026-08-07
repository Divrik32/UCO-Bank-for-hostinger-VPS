import api from "../api/axios";
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

export default function Loan() {
  const { isMobile, isTablet, isDesktop, width } = useBreakpoint();

  const [memberCode, setMemberCode] = useState("");
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState("official");
  const [interestRate, setInterestRate] = useState("");

const [officialForm, setOfficialForm] = useState({
  loanCode: "",
  officeName: "",
  loanDate: new Date().toISOString().split("T")[0],
  loanType: "Housing",
  loanAmount: "",
  tenureMonths: "",
  emiAmount: "",
  processingFees: "",
  paymentMode: "",
  transactionId: "",
});

  const [guaranteerForm, setGuaranteerForm] = useState({
    employeeName: "",
    employeeCode: "",
    employeePhoneNo: "",
    memberName: "",
    memberCode: "",
    memberPhoneNo: "",
  });

  const [emiForm, setEmiForm] = useState({
    emiAmount: "",
    paymentMode: "Amount given by Member",
    amount: "",
    transactionId: "",
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    noOfEmi: "",
    amountPaid: "",
    totalAmount: "",
    paymentMode: "Amount given by Member",
    chequeNumber: "",
    transactionId: "",
  });

  const API = "/loan";
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const txScrollRef = useRef(null);
  const [paymentModes, setPaymentModes] = useState([]);

  const fetchPaymentModes = async () => {
    try {
      const res = await api.get("/loan/payment-modes");
      setPaymentModes(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };
  
  useEffect(() => {
    fetchPaymentModes();
  }, []);

  useLayoutEffect(() => {
    if (activeTab === "transaction" && txScrollRef.current) {
      const el = txScrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [activeTab, transactions]);

useEffect(() => {
  const emiFactors = {
    84: 16.86,
    96: 15.44,
    108: 14.35,
    120: 13.49,
    132: 12.8,
    144: 12.24,
    156: 11.78,
    168: 11.38,
    180: 11.05,
  };

  const loanAmount = Number(officialForm.loanAmount);
  const tenure = Number(officialForm.tenureMonths);

  if (!loanAmount || !tenure) {
    setOfficialForm((prev) => ({
      ...prev,
      emiAmount: "",
    }));
    return;
  }

  const factor = emiFactors[tenure];

  if (!factor) return;

  const emi = ((loanAmount * factor) / 1000).toFixed(2);

  setOfficialForm((prev) => ({
    ...prev,
    emiAmount: emi,
  }));
}, [officialForm.loanAmount, officialForm.tenureMonths]);

  useEffect(() => {
    fetchInterestRate();
  }, []);

  const fetchAvailableBalance = async (memberId) => {
    try {
      const res = await api.get(`${API}/available-balance/${memberId}`);
      setAvailableBalance(res.data.availableBalance || 0);
    } catch {
      toast.error("Failed to fetch balance");
    }
  };

  const fetchInterestRate = async () => {
    try {
      const res = await api.get(`${API}/interest-rate`);      
      setInterestRate(res.data.data.rate);
    } catch {
      console.error("Failed to fetch interest rate");
    }
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
        loanCode: data.loanCode || data.memberId,
        currentBalance: data.currentBalance || 0,
      });
      console.log("Profile Image:", data.profileImage);
console.log("Signature Image:", data.signatureImage);

      // if (data.loanData) {
      //   setOfficialForm({
      //     loanCode: data.loanCode || data.memberId,
      //     officeName: data.loanData.officeName || "",
      //     loanDate: data.loanData.loanDate || "",
      //     loanType: data.loanData.loanType || "Housing",
      //     loanAmount: data.loanData.loanAmount || "",
      //     tenureMonths: data.loanData.tenureMonths || "",
      //     emiAmount: data.loanData.emiAmount || "",
      //     processingFees: data.loanData.processingFees || "",
      //   });
      //   setEmiForm((prev) => ({ ...prev, emiAmount: data.loanData.emiAmount || "" }));
      // }

// latest official entry
const officialRes = await api.get(
  `${API}/official-entry/${memberCode}`
);

const officialData = officialRes.data.data;


// ✅ 1. Official form = ALWAYS EMPTY
setOfficialForm({
  loanCode: "",
  officeName: "",
  loanDate: new Date().toISOString().split("T")[0],
  loanType: "Housing",
  loanAmount: "",
  tenureMonths: "",
  emiAmount: "",
  processingFees: "",
  paymentMode: "",
  transactionId: "",
});

// ✅ 2. Guarantee form = ALWAYS EMPTY
setGuaranteerForm({
  employeeName: "",
  employeeCode: "",
  employeePhoneNo: "",
  memberName: "",
  memberCode: "",
  memberPhoneNo: "",
});

// ✅ 3. EMI TAB AUTOFILL (FROM BACKEND)
setEmiForm({
  emiAmount: officialData?.emiAmount || "",
  paymentMode: "Amount given by Member",
  amount: officialData?.emiAmount || "",
  transactionId: "",
});

// ✅ 4. ADJUSTMENT TAB AUTOFILL
setAdjustmentForm({
  noOfEmi: officialData?.tenureMonths || "",
  amountPaid: 0,
  totalAmount: officialData?.loanAmount || "",
  paymentMode: "Amount given by Member",
  chequeNumber: "",
  transactionId: "",
});

// ✅ EMI form autofill (FINAL FIX)
setEmiForm((prev) => ({
  ...prev,
  emiAmount: officialData?.emiAmount || 0,
  amount: officialData?.emiAmount || 0,
}));

// EMI paid total
const emiRes = await api.get(
  `${API}/emi-payment/${memberCode}`
);

const emiPayments = emiRes.data.data || [];

const totalPaid = emiPayments.reduce(
  (sum, item) => sum + Number(item.amount || 0),
  0
);

// loan adjustment autofill
setAdjustmentForm((prev) => ({
  ...prev,
  totalAmount: officialData?.loanAmount || 0,
  noOfEmi: officialData?.tenureMonths || "",  
}));

      await fetchAvailableBalance(memberCode);
      setActiveTab("official");
    } catch (error) {
      toast.error(error.response?.data?.message || "Member not found");
    } finally {
      setLoading(false);
    }
  };

const submitOfficialEntry = async () => {
  try {
await api.post(
  `${API}/official-entry/${member.memberId}`,
  {
    officeName: officialForm.officeName,
    loanType: officialForm.loanType,
    loanAmount: Number(officialForm.loanAmount),
    tenureMonths: Number(officialForm.tenureMonths),
    processingFees: Number(officialForm.processingFees || 0),

    paymentMode: officialForm.paymentMode,
    transactionId: officialForm.transactionId,
  }
);

    toast.success("Official entry updated successfully");

    setOfficialForm({
      loanCode: "",
      officeName: "",
      loanDate: new Date().toISOString().split("T")[0],
      loanType: "Housing",
      loanAmount: "",
      tenureMonths: "",
      emiAmount: "",
      processingFees: "",
    });

    // handleSearch();
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update");
  }
};

const submitGuaranteer = async () => {
  try {
    await api.post(`${API}/guaranteer/${member.memberId}`, {
      ...guaranteerForm,
    });

    toast.success("Guaranteer details submitted successfully");

    setGuaranteerForm({
      employeeName: "",
      employeeCode: "",
      employeePhoneNo: "",
      memberName: "",
      memberCode: "",
      memberPhoneNo: "",
    });

  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update");
  }
};

const fetchTransactions = async (memberId) => {
  try {
    const res = await api.get(`${API}/transactions/${memberId}`);
    setTransactions(res.data.data || []);
  } catch (error) {
    toast.error("Failed to fetch transactions");
  }
};

useEffect(() => {
  if (activeTab === "transaction" && member?.memberId) {
    fetchTransactions(member.memberId);
  }
}, [activeTab, member]);

const fetchTotalPaid = async (memberId) => {
  try {
    const res = await api.get(`${API}/emi-total/${memberId}`);

    setAdjustmentForm((prev) => ({
      ...prev,
      amountPaid: res.data.totalPaid || 0,
    }));
  } catch (error) {
    toast.error("Failed to fetch total paid");
  }
};

useEffect(() => {
  if (activeTab === "adjustment" && member?.memberId) {
    fetchTotalPaid(member.memberId);
  }
}, [activeTab, member]);



const submitEmiPayment = async () => {
  try {
    if (!member?.memberId) {
      return toast.error("Search member first");
    }

    if (!emiForm.amount) {
      return toast.error("Enter amount");
    }

    // if (
    //   emiForm.paymentMode === "Amount given by Member" &&
    //   !emiForm.transactionId.trim()
    // ) {
    //   return toast.error("Transaction ID required");
    // }

    if (Number(emiForm.amount) > Number(emiForm.emiAmount)) {
       return toast.error("Amount cannot exceed EMI amount");
    }

    await api.post(`${API}/emi-payment/${member.memberId}`, {
      memberId: member.memberId,
      emiAmount: Number(emiForm.emiAmount),
      paymentMode: emiForm.paymentMode,
      amount: Number(emiForm.amount),
      transactionId: emiForm.transactionId,
    });

    toast.success("EMI payment submitted successfully");

    await fetchAvailableBalance(member.memberId);

    setEmiForm({
      emiAmount: officialForm.emiAmount,
      paymentMode: "Amount given by Member",
      amount: officialForm.emiAmount,
      transactionId: "",
    });

    // handleSearch();
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to submit");
  }
};

const submitAdjustment = async () => {
  try {
    await api.post(`${API}/loan-adjustment/${member.memberId}`, {
      paymentMode: adjustmentForm.paymentMode,
      chequeNumber: adjustmentForm.chequeNumber,
      transactionId: adjustmentForm.transactionId,
    });

    toast.success("Loan adjustment submitted successfully");
    handleSearch();
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to submit");
  }
};

  const tabs = [
    { key: "official",    label: "Official Entry" },
    { key: "guaranteer",  label: "Guaranteer Member Details" },
    { key: "emi",         label: "Loan Payment For EMI Details" },
    { key: "adjustment",  label: "Loan Adjustment" },
    { key: "transaction", label: "Total Transaction Details" },
  ];

  // ── Shared styles ──
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
    padding: isMobile ? "8px 8px" : "11px 14px",
    textAlign: "left",
    fontWeight: "700",
    color: "#1a2052",
    backgroundColor: "#e2e8f0",
    borderBottom: "2px solid #e2e8f0",
    fontFamily: "'Inter', sans-serif",
    fontSize: isMobile ? "11px" : "13px",
    whiteSpace: "nowrap",
  };

  const td = {
    padding: isMobile ? "8px 8px" : "10px 14px",
    borderBottom: "1px solid #f0f2ff",
    color: "#333",
    fontSize: isMobile ? "11px" : "14px",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: isMobile ? "14px 10px" : isTablet ? "20px 18px" : "28px 32px",
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
          alignItems: "flex-start",
          gap: isMobile ? "8px" : "0",
          marginBottom: "6px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isMobile ? "18px" : isTablet ? "22px" : "26px",
              fontWeight: "700",
              color: "#1a2052",
              margin: 0,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            LOAN MASTER ENTRY
          </h1>
          <nav style={{ fontSize: "13px", color: "#888", marginTop: "5px" }}>
            <a href="/" style={{ color: "#1e40af", textDecoration: "none", fontWeight: "600" }}>
              Home
            </a>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ fontWeight: "600" }}>LOAN MASTER ENTRY</span>
          </nav>
        </div>
        {!isMobile && (
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontWeight: "700", fontSize: isTablet ? "13px" : "16px", color: "#1a2052" }}>
              Regd. 203, Hari Om Commercial Complex
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
              New Dak Bunglow Road, Patna-800001
            </p>
          </div>
        )}
      </div>

      {/* ── Info Pills ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        {/* Interest Rate pill */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderRadius: "7px",
            overflow: "hidden",
            border: "1.5px solid #dbeafe",
            boxShadow: "0 1px 4px rgba(30,64,175,0.08)",
          }}
        >
          <div
            style={{
              backgroundColor: "#1e40af",
              color: "#fff",
              fontWeight: "700",
              fontSize: isMobile ? "12px" : "13px",
              fontFamily: "'Inter', sans-serif",
              padding: isMobile ? "7px 10px" : "8px 14px",
              whiteSpace: "nowrap",
            }}
          >
            Interest Rate
          </div>
          <div
            style={{
              backgroundColor: "#eff6ff",
              color: "#1e40af",
              fontWeight: "800",
              fontSize: isMobile ? "13px" : "14px",
              fontFamily: "'Inter', sans-serif",
              padding: isMobile ? "7px 10px" : "8px 14px",
              whiteSpace: "nowrap",
              minWidth: "50px",
              textAlign: "center",
            }}
          >
            {interestRate !== "" ? `${interestRate}%` : "—"}
          </div>
        </div>

        {/* Available Balance pill */}
        {member && (
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              borderRadius: "7px",
              overflow: "hidden",
              border: "1.5px solid #d1fae5",
              boxShadow: "0 1px 4px rgba(16,185,129,0.08)",
            }}
          >
            <div
              style={{
                backgroundColor: "#059669",
                color: "#fff",
                fontWeight: "700",
                fontSize: isMobile ? "12px" : "13px",
                fontFamily: "'Inter', sans-serif",
                padding: isMobile ? "7px 10px" : "8px 14px",
                whiteSpace: "nowrap",
              }}
            >
              Available Balance
            </div>
            <div
              style={{
                backgroundColor: "#ecfdf5",
                color: "#065f46",
                fontWeight: "800",
                fontSize: isMobile ? "13px" : "14px",
                fontFamily: "'Inter', sans-serif",
                padding: isMobile ? "7px 10px" : "8px 14px",
                whiteSpace: "nowrap",
                minWidth: "70px",
                textAlign: "center",
              }}
            >
              ₹{Number(availableBalance).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: isMobile ? "stretch" : "flex-end",
          marginBottom: "14px",
        }}
      >
        <div style={{ width: isMobile ? "100%" : "auto" }}>
          <label
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#444",
              fontFamily: "'Inter', sans-serif",
              display: "block",
              marginBottom: "4px",
            }}
          >
            Member Code:
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                padding: "9px 14px",
                fontSize: "14px",
                border: "1.5px solid #ced4da",
                borderRadius: "5px",
                fontFamily: "'Inter', sans-serif",
                outline: "none",
                backgroundColor: "#fff",
                flex: isMobile ? 1 : "none",
                width: isMobile ? "auto" : "200px",
                boxSizing: "border-box",
              }}
              placeholder="Enter member code"
            />
            <button
              onClick={handleSearch}
              style={{
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "9px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
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
        {/* ── Profile Card ── */}
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
            <h5
              style={{
                fontWeight: "700",
                fontSize: "15px",
                color: "#fff",
                margin: 0,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Profile
            </h5>
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
            <input
              style={disabledInput}
              disabled
              placeholder={member ? `${member.firstname} ${member.lastname}` : "Name"}
            />
            <input
              style={disabledInput}
              disabled
              placeholder={member?.memberId || "Member Code"}
            />

            {/* Avatar + Signature */}
            <div
              style={{
                display: "flex",
                flexDirection: isTablet ? "row" : "column",
                gap: "10px",
                alignItems: "center",
                gridColumn: isTablet ? "1 / -1" : undefined,
              }}
            >
              <div
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "50%",
                  backgroundColor: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid #1e40af",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {member?.profileImage ? (
                  <img
                    src={member.profileImage}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    alt="avatar"
                  />
                ) : (
                  <span style={{ fontSize: "52px" }}>👤</span>
                )}
              </div>
              <div
                style={{
                  border: "1px dashed #e2e8f0",
                  borderRadius: "6px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8fafc",
                  flex: 1,
                  width: isTablet ? "auto" : "100%",
                  padding: "6px",
                }}
              >
                {member?.signatureImage ? (
                  <img
                    src={member.signatureImage}
                    style={{ height: "40px", maxWidth: "80%", objectFit: "contain" }}
                    alt="signature"
                  />
                ) : (
                  <span style={{ color: "#aaa", fontStyle: "italic", fontSize: "13px" }}>
                    Signature
                  </span>
                )}
              </div>
            </div>

            <input
              style={disabledInput}
              disabled
              placeholder={member?.phoneno || "Phone"}
            />
            <input
              style={disabledInput}
              disabled
              placeholder={member?.email || "Email"}
            />
          </div>
        </div>

        {/* ── Tabs Panel ── */}
        {member && (
          <div
            style={{
              flex: 1,
              backgroundColor: "white",
              borderRadius: "10px",
              boxShadow: "0 2px 12px rgba(10,25,47,0.12)",
              padding: isMobile ? "12px 10px" : "20px 22px",
              minWidth: 0,
              width: "100%",
            }}
          >
            {/* Tab Buttons — horizontally scrollable on mobile */}
            <div
              style={{
                display: "flex",
                flexWrap: isMobile ? "nowrap" : "wrap",
                gap: "4px",
                borderBottom: "2.5px solid #cbd5e1",
                marginBottom: "20px",
                overflowX: isMobile ? "auto" : "visible",
                WebkitOverflowScrolling: "touch",
                paddingBottom: isMobile ? "1px" : "0",
              }}
            >
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={
                    activeTab === t.key
                      ? {
                          padding: isMobile ? "7px 10px" : isTablet ? "8px 12px" : "9px 16px",
                          fontSize: isMobile ? "11px" : isTablet ? "12px" : "13px",
                          fontWeight: "700",
                          border: "1.5px solid #cbd5e1",
                          borderBottom: "2.5px solid #ffffff",
                          borderRadius: "6px 6px 0 0",
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                          backgroundColor: "#ffffff",
                          color: "#1e40af",
                          marginBottom: "-2.5px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }
                      : {
                          padding: isMobile ? "7px 10px" : isTablet ? "8px 12px" : "9px 16px",
                          fontSize: isMobile ? "11px" : isTablet ? "12px" : "13px",
                          fontWeight: "600",
                          border: "1px solid transparent",
                          borderBottom: "none",
                          borderRadius: "6px 6px 0 0",
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                          backgroundColor: "transparent",
                          color: "#666",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ────────────────────────────────────
                Tab 1 — Official Entry
            ──────────────────────────────────── */}
            {activeTab === "official" && (
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
                  Official Entry
                </h5>

                <Field label="Loan Code" isMobile={isMobile}>
                  <input
                    style={inputDisabled}
                    disabled
                    value={officialForm.loanCode}
                    placeholder="Auto-generated on submit"
                  />
                </Field>

                <Field label="Office Name" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={officialForm.officeName}
                    onChange={(e) =>
                      setOfficialForm({ ...officialForm, officeName: e.target.value })
                    }
                    placeholder="Enter office name"
                  />
                </Field>

  <Field label="Loan Date" isMobile={isMobile}>
    <input
      type="date"
      style={inputDisabled}
      disabled
      value={officialForm.loanDate}
    />
  </Field>

                <Field label="Loan Type" isMobile={isMobile}>
                  <select
                    style={inputStyle}
                    value={officialForm.loanType}
                    onChange={(e) =>
                      setOfficialForm({ ...officialForm, loanType: e.target.value })
                    }
                  >
                    {["Housing", "Personal", "Vehicle", "Education", "Business", "Gold"].map(
                      (t) => (
                        <option key={t}>{t}</option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Loan Amount" isMobile={isMobile}>
                  <input
                    type="number"
                    style={inputStyle}
                    value={officialForm.loanAmount}
                    onChange={(e) =>
                      setOfficialForm({ ...officialForm, loanAmount: e.target.value })
                    }
                    placeholder="Enter loan amount"
                  />
                </Field>

  <Field label="Tenure (months)" isMobile={isMobile}>
    <select
      style={inputStyle}
      value={officialForm.tenureMonths}
      onChange={(e) =>
        setOfficialForm({
          ...officialForm,
          tenureMonths: e.target.value
        })
      }
    >
      <option value="">Select Tenure</option>
      {[84, 96, 108, 120, 132, 144, 156, 168, 180].map((month) => (
        <option key={month} value={month}>
          {month} Months
        </option>
      ))}
    </select>
  </Field>

                <Field label="EMI Amount" isMobile={isMobile}>
                  <input
                    style={inputDisabled}
                    disabled
                    value={officialForm.emiAmount}
                    placeholder="Auto-calculated"
                  />
                </Field>

                <Field label="Processing Fees" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={officialForm.processingFees}
                    placeholder="0"
                  />
                </Field>

                <Field label="Payment Mode" isMobile={isMobile}>
  <select
    style={inputStyle}
    value={officialForm.paymentMode}
    onChange={(e) =>
      setOfficialForm({
        ...officialForm,
        paymentMode: e.target.value,
      })
    }
  >
    <option value="">Select Payment Mode</option>
  
    {paymentModes.map((mode) => (
      <option key={mode} value={mode}>
        {mode}
      </option>
    ))}
  </select>
</Field>

<Field label="Transaction ID" isMobile={isMobile}>
  <input
    style={inputStyle}
    value={officialForm.transactionId}
    onChange={(e) =>
      setOfficialForm({
        ...officialForm,
        transactionId: e.target.value,
      })
    }
    placeholder="Enter transaction ID"
  />
</Field>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <button style={btnPrimary} onClick={submitOfficialEntry}>
                    Update
                  </button>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────
                Tab 2 — Guaranteer Member Details
            ──────────────────────────────────── */}
            {activeTab === "guaranteer" && (
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
                  Guaranteer Member Details
                </h5>

                <Field label="Employee Name" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={guaranteerForm.employeeName}
                    onChange={(e) =>
                      setGuaranteerForm({ ...guaranteerForm, employeeName: e.target.value })
                    }
                    placeholder="Enter employee name"
                  />
                </Field>

                <Field label="Employee Code" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={guaranteerForm.employeeCode}
                    onChange={(e) =>
                      setGuaranteerForm({ ...guaranteerForm, employeeCode: e.target.value })
                    }
                    placeholder="Enter employee code"
                  />
                </Field>

                <Field label="Employee Phone No" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={guaranteerForm.employeePhoneNo}
                    onChange={(e) =>
                      setGuaranteerForm({ ...guaranteerForm, employeePhoneNo: e.target.value })
                    }
                    placeholder="Enter employee phone"
                  />
                </Field>

                <Field label="Member Name" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={guaranteerForm.memberName}
                    onChange={(e) =>
                      setGuaranteerForm({ ...guaranteerForm, memberName: e.target.value })
                    }
                    placeholder="Enter member name"
                  />
                </Field>

                <Field label="Member Code" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={guaranteerForm.memberCode}
                    onChange={(e) =>
                      setGuaranteerForm({ ...guaranteerForm, memberCode: e.target.value })
                    }
                    placeholder="Enter member code"
                  />
                </Field>

                <Field label="Member Phone No" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={guaranteerForm.memberPhoneNo}
                    onChange={(e) =>
                      setGuaranteerForm({ ...guaranteerForm, memberPhoneNo: e.target.value })
                    }
                    placeholder="Enter member phone"
                  />
                </Field>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <button style={btnPrimary} onClick={submitGuaranteer}>
                    Update
                  </button>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────
                Tab 3 — Loan Payment For EMI Details
            ──────────────────────────────────── */}
            {activeTab === "emi" && (
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
                  Loan Payment For EMI Details
                </h5>

                <Field label="EMI Amount" isMobile={isMobile}>
                  <input
                    style={inputDisabled}
                    disabled
                    value={emiForm.emiAmount}
                    placeholder="EMI Amount"
                  />
                </Field>

                <Field label="Payment Mode" isMobile={isMobile}>
                  <select
                    style={inputStyle}
                    value={emiForm.paymentMode}
                    onChange={(e) =>
                      setEmiForm({ ...emiForm, paymentMode: e.target.value })
                    }
                  >
                    {[
                      'Amount given by Member', 
                      'Amount given from thrift A/C',
                      'Amount given from Share A/C',
                    ].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Amount" isMobile={isMobile}>
                  <input
                    type="number"
                    style={inputStyle}
                    value={emiForm.amount}
                    onChange={(e) => setEmiForm({ ...emiForm, amount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </Field>

                <Field label="Transaction ID" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={emiForm.transactionId}
                    onChange={(e) =>
                      setEmiForm({ ...emiForm, transactionId: e.target.value })
                    }
                    placeholder="Enter transaction ID"
                  />
                </Field>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <button style={btnPrimary} onClick={submitEmiPayment}>
                    Submit
                  </button>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────
                Tab 4 — Loan Adjustment
            ──────────────────────────────────── */}
            {activeTab === "adjustment" && (
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
                  Loan Adjustment
                </h5>

                <Field label="No of EMI" isMobile={isMobile}>
                  <input
                    style={inputDisabled}
                    disabled
                    value={adjustmentForm.noOfEmi}
                    placeholder="0"
                  />
                </Field>

                <Field label="Amount Paid" isMobile={isMobile}>
                  <input
                    style={inputDisabled}
                    disabled
                    value={adjustmentForm.amountPaid}
                    placeholder="0"
                  />
                </Field>

                <Field label="Total Amount" isMobile={isMobile}>
                  <input
                    style={inputDisabled}
                    disabled
                    value={adjustmentForm.totalAmount}
                    placeholder="0"
                  />
                </Field>

                {/* Sub-section header */}
                <div
                  style={{
                    borderTop: "1.5px solid #e2e8f0",
                    paddingTop: "16px",
                    marginBottom: "14px",
                  }}
                >
                  <h6
                    style={{
                      fontWeight: "700",
                      fontSize: "14px",
                      color: "#1a2052",
                      margin: "0 0 14px",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Payment Fees Details
                  </h6>
                </div>

                <Field label="Payment Mode" isMobile={isMobile}>
                  <select
                    style={inputStyle}
                    value={adjustmentForm.paymentMode}
                    onChange={(e) =>
                      setAdjustmentForm({ ...adjustmentForm, paymentMode: e.target.value })
                    }
                  >
                    {[
                      'Amount given by Member', 
                      'Amount given from thrift A/C',
                      'Amount given from Share A/C',
                    ].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Cheque Number" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={adjustmentForm.chequeNumber}
                    onChange={(e) =>
                      setAdjustmentForm({ ...adjustmentForm, chequeNumber: e.target.value })
                    }
                    placeholder="If applicable"
                  />
                </Field>

                <Field label="Transaction Id" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={adjustmentForm.transactionId}
                    onChange={(e) =>
                      setAdjustmentForm({ ...adjustmentForm, transactionId: e.target.value })
                    }
                    placeholder="Enter transaction ID"
                  />
                </Field>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <button style={btnPrimary} onClick={submitAdjustment}>
                    Submit
                  </button>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────
                Tab 5 — Total Transaction Details
            ──────────────────────────────────── */}
            {activeTab === "transaction" && (
              <div>
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
                  Total Transaction Details
                </h5>

                <div
                  ref={txScrollRef}
                  style={{
                    overflowX: "auto",
                    overflowY: "auto",
                    maxHeight: "340px",
                    borderRadius: "6px",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <table
                    style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}
                  >
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        {["#", "Amount", "Payment Mode", "Transaction Date", "Interest", "Credit/Debit"].map(
                          (h) => (
                            <th key={h} style={th}>
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              textAlign: "center",
                              padding: "28px",
                              color: "#aaa",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((item, i) => (
                          <tr
                            key={i}
                            style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fdfdfd" }}
                          >
                            <td style={td}>{i + 1}</td>
                            <td style={{ ...td, fontWeight: "600" }}>
                              ₹{Number(item.Amount || item.amount || 0).toLocaleString()}
                            </td>
                            <td style={td}>
                              {item.PaymentMode || item.paymentMode || "-"}
                            </td>
                            <td style={td}>
                              {formatDateTime(
                                item.TransactionDate || item.transactionDate || item.date
                              )}
                            </td>
                            <td style={td}>
  {!isNaN(item.Interest || item.interest)
    ? Number(item.Interest || item.interest).toFixed(2)
    : "Included in EMI"}
</td>
                            <td style={td}>
                              {item.type || "-"}  
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Balance footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(30,64,175,0.10)",
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
                      fontFamily: "'Inter', sans-serif",
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
                      fontFamily: "'Inter', sans-serif",
                      padding: "10px 18px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ₹{Number(availableBalance).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no member loaded */}
        {!member && (
          <div
            style={{
              flex: 1,
              backgroundColor: "white",
              borderRadius: "10px",
              boxShadow: "0 2px 12px rgba(10,25,47,0.12)",
              padding: isMobile ? "12px 10px" : "20px 22px",
              minWidth: 0,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "160px",
            }}
          >
            <p
              style={{
                color: "#aaa",
                fontStyle: "italic",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Search a member to view loan details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}