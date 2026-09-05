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
  const [membershipNumber, setMembershipNumber] = useState("");
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState("official");
  const [interestRate, setInterestRate] = useState("");
  const [totalLoanInterest, setTotalLoanInterest] = useState(0);

const [officialForm, setOfficialForm] = useState({ 
  loanCode: "", 
  officeName: "BSUCBO", 
  loanDate: new Date().toISOString().split("T")[0], 
  loanType: "Housing", 
  loanAmount: "", 
  tenureMonths: "", 
  emiAmount: "", 
  monthlyInterest: "", 
  interestDays: "",
  interestAmount: "",
  processingFees: "", 
  paymentMode: "", 
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
    transactionDate: new Date().toISOString().split("T")[0],
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    noOfEmi: "",
    amountPaid: "",
    totalAmount: "",
    paymentMode: "Amount given by Member",
    adjustmentAmount: "",
    thriftAdjustmentAmount: "",
    shareAdjustmentAmount: "",
    chequeNumber: "",
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

  const fetchTotalLoanInterest = async (memberId) => {
  try {
    const res = await api.get(`${API}/total-loan-interest/${memberId}`);

    setTotalLoanInterest(res.data.totalLoanInterest || 0);
  } catch (error) {
    toast.error("Failed to fetch total loan interest");
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
  const loanInterest = Number(interestRate); 
  const interestDays = Number(officialForm.interestDays); 
 
  // EMI calculation
  let emiAmount = ""; 
 
  if (loanAmount && tenure) { 
    const factor = emiFactors[tenure]; 
 
    if (factor) { 
      emiAmount = ((loanAmount * factor) / 1000).toFixed(2); 
    } 
  } 
 
  // Monthly Interest calculation
  let monthlyInterest = ""; 
 
  if (loanAmount && loanInterest) { 
    monthlyInterest = ( 
      (loanAmount * 30 * loanInterest) / 36500 
    ).toFixed(2); 
  } 
 
  // Interest Amount calculation
  let interestAmount = ""; 
 
  if (loanAmount && interestDays && loanInterest) { 
    interestAmount = ( 
      (loanAmount * interestDays * loanInterest) / 36500 
    ).toFixed(2); 
  } 
 
  setOfficialForm((prev) => ({ 
    ...prev, 
    emiAmount, 
    monthlyInterest, 
    interestAmount, 
  })); 
}, [ 
  officialForm.loanAmount, 
  officialForm.tenureMonths, 
  officialForm.interestDays, 
  interestRate, 
]);

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
    // ==========================================
    // Validate Search Input
    // ==========================================

    if (!memberCode.trim() && !membershipNumber.trim()) {
      toast.error("Enter Member Code or Membership Number");
      return;
    }

    setLoading(true);

    let data;

    // ==========================================
    // 1. Search By Membership Number
    // ==========================================

    if (membershipNumber.trim()) {
      const res = await api.get(
        `/users/membership/${encodeURIComponent(
          membershipNumber.trim()
        )}`
      );

      data = res.data.data;

      // Membership Number থেকে Member Code automatically set
      setMemberCode(data.memberId);
    }

    // ==========================================
    // 2. Search By Member Code
    // ==========================================

    else {
      const res = await api.get(
        `${API}/member/${encodeURIComponent(memberCode.trim())}`
      );

      data = res.data.data;
    }

    // ==========================================
    // 3. Set Member Information
    // ==========================================

    const fullName = data.name || "";

    setMember({
      memberId: data.memberId,
      firstname:
        data.firstname ||
        fullName.split(" ")[0] ||
        "",
      lastname:
        data.lastname ||
        fullName.split(" ").slice(1).join(" ") ||
        "",
      phoneno:
        data.phoneNumber ||
        data.phoneno ||
        "",
      email: data.email || "",
      profileImage:
        data.profileImage ||
        data.profile_image ||
        "",
      signatureImage:
        data.signatureImage ||
        data.signature_image ||
        "",
      membershipNumber:
        data.membershipNumber || "",
    });

    // ==========================================
    // IMPORTANT
    // All financial APIs use MEMBER ID
    // ==========================================

    const searchMemberId = data.memberId;

    // ==========================================
    // 4. Fetch Loan Transactions
    // ==========================================

    const txRes = await api.get(
      `${API}/transactions/${searchMemberId}`
    );

    setTransactions(txRes.data.data || []);

    // ==========================================
    // 5. Fetch Available Balance
    // ==========================================

    await fetchAvailableBalance(searchMemberId);

    // ==========================================
    // 6. Fetch Total Loan Interest
    // ==========================================

    await fetchTotalLoanInterest(searchMemberId);

    setActiveTab("official");

  } catch (error) {
    console.error("Member search error:", error);

    toast.error(
      error.response?.data?.message ||
        "Member not found"
    );
  } finally {
    setLoading(false);
  }
};

const submitOfficialEntry = async () => {
  try {
    await api.post(
      `${API}/official-entry/${member.memberId}`,
      {
        officeName: "BSUCBO",
        loanType: officialForm.loanType,
        loanAmount: Number(officialForm.loanAmount),
        tenureMonths: Number(officialForm.tenureMonths),
        monthlyInterest: Number(officialForm.monthlyInterest || 0),
        interestDays: Number(officialForm.interestDays || 0),
        interestAmount: Number(officialForm.interestAmount || 0),
        paymentMode: officialForm.paymentMode,

        // ✅ Loan Date → Transaction Date
        transactionDate: officialForm.loanDate,
      }
    );

    toast.success("Official entry updated successfully");

    setOfficialForm({
      loanCode: "",
      officeName: "BSUCBO",
      loanDate: new Date().toISOString().split("T")[0],
      loanType: "Housing",
      loanAmount: "",
      tenureMonths: "",
      emiAmount: "",
      monthlyInterest: "",
      interestDays: "",
      interestAmount: "",
      processingFees: "",
      paymentMode: "",
    });

  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to update"
    );
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

    // if (Number(emiForm.amount) > Number(emiForm.emiAmount)) {
    //    return toast.error("Amount cannot exceed EMI amount");
    // }

    await api.post(`${API}/emi-payment/${member.memberId}`, {
      memberId: member.memberId,
      emiAmount: Number(emiForm.emiAmount),
      paymentMode: emiForm.paymentMode,
      amount: Number(emiForm.amount),
    
      // ✅ Transaction Date
      transactionDate: emiForm.transactionDate,
    });

    toast.success("EMI payment submitted successfully");

    await fetchAvailableBalance(member.memberId);

    setEmiForm({
      emiAmount: officialForm.emiAmount,
      paymentMode: "Amount given by Member",
      amount: officialForm.emiAmount,
      transactionDate: new Date().toISOString().split("T")[0],
    });

    // handleSearch();
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to submit");
  }
};

const submitAdjustment = async () => {
  try {
    if (!member?.memberId) {
      return toast.error("Search member first");
    }

    const paymentMode = adjustmentForm.paymentMode;

    // ─────────────────────────────────────
    // Both
    // ─────────────────────────────────────
    if (paymentMode === "Both") {
      const thriftAmount = Number(
        adjustmentForm.thriftAdjustmentAmount || 0
      );

      const shareAmount = Number(
        adjustmentForm.shareAdjustmentAmount || 0
      );

      if (thriftAmount <= 0 && shareAmount <= 0) {
        return toast.error(
          "Enter thrift or share adjustment amount"
        );
      }

      await api.post(`${API}/loan-adjustment/${member.memberId}`, {
        paymentMode,
        thriftAdjustmentAmount: thriftAmount,
        shareAdjustmentAmount: shareAmount,
        chequeNumber: adjustmentForm.chequeNumber,
      });
    }

    // ─────────────────────────────────────
    // Member / Thrift / Share
    // ─────────────────────────────────────
    else {
      const adjustmentAmount = Number(
        adjustmentForm.adjustmentAmount || 0
      );

      if (adjustmentAmount <= 0) {
        return toast.error("Enter adjustment amount");
      }

      await api.post(`${API}/loan-adjustment/${member.memberId}`, {
        paymentMode,
        adjustmentAmount,
        chequeNumber: adjustmentForm.chequeNumber,
      });
    }

    toast.success("Loan adjustment submitted successfully");

    await handleSearch();

  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to submit"
    );
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

        {/* Total Loan Interest pill */}
{member && (
  <div
    style={{
      display: "flex",
      alignItems: "stretch",
      borderRadius: "7px",
      overflow: "hidden",
      border: "1.5px solid #fef3c7",
      boxShadow: "0 1px 4px rgba(245,158,11,0.08)",
    }}
  >
    <div
      style={{
        backgroundColor: "#d97706",
        color: "#fff",
        fontWeight: "700",
        fontSize: isMobile ? "12px" : "13px",
        fontFamily: "'Inter', sans-serif",
        padding: isMobile ? "7px 10px" : "8px 14px",
        whiteSpace: "nowrap",
      }}
    >
      Total Loan Interest
    </div>

    <div
      style={{
        backgroundColor: "#fffbeb",
        color: "#92400e",
        fontWeight: "800",
        fontSize: isMobile ? "13px" : "14px",
        fontFamily: "'Inter', sans-serif",
        padding: isMobile ? "7px 10px" : "8px 14px",
        whiteSpace: "nowrap",
        minWidth: "70px",
        textAlign: "center",
      }}
    >
₹{Math.round(Number(totalLoanInterest)).toLocaleString("en-IN")}
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
  <div
    style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "14px",
      width: isMobile ? "100%" : "auto",
    }}
  >
    {/* ==========================================
        Membership Number Search
    ========================================== */}

    <div
      style={{
        width: isMobile ? "100%" : "auto",
      }}
    >
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
        Membership Number:
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <input
          type="text"
          value={membershipNumber}
          onChange={(e) => {
            setMembershipNumber(e.target.value);

            // Membership Number দিলে Member Code clear হবে
            if (e.target.value) {
              setMemberCode("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          style={{
            padding: "9px 14px",
            fontSize: "14px",
            border: "1.5px solid #ced4da",
            borderRadius: "5px",
            fontFamily: "'Inter', sans-serif",
            outline: "none",
            backgroundColor: "#fff",
            width: isMobile ? "100%" : "200px",
            boxSizing: "border-box",
          }}
          placeholder="Enter membership number"
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

    {/* ==========================================
        Member Code Search
    ========================================== */}

    <div
      style={{
        width: isMobile ? "100%" : "auto",
      }}
    >
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <input
          type="text"
          value={memberCode}
          onChange={(e) => {
            setMemberCode(e.target.value);

            // Member Code দিলে Membership Number clear হবে
            if (e.target.value) {
              setMembershipNumber("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          style={{
            padding: "9px 14px",
            fontSize: "14px",
            border: "1.5px solid #ced4da",
            borderRadius: "5px",
            fontFamily: "'Inter', sans-serif",
            outline: "none",
            backgroundColor: "#fff",
            width: isMobile ? "100%" : "200px",
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
    style={inputDisabled}
    disabled
    value="BSUCBO"
  />
</Field>

<Field label="Loan Date" isMobile={isMobile}> 
  <input 
    type="date" 
    style={inputStyle} 
    value={officialForm.loanDate}
    onChange={(e) => 
      setOfficialForm({
        ...officialForm,
        loanDate: e.target.value,
      })
    }
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
                    {[  "Housing",
  "Personal",
  "Education",
  "Repair of House",
  "Dwelling of House",
  "Medical"].map(
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

                <Field label="Monthly Interest" isMobile={isMobile}>
                  <input
                    type="number"
                    style={inputDisabled}
                    readOnly
                    value={officialForm.monthlyInterest}
                    placeholder="Auto-calculated"
                  />
                </Field>

<Field label="Interest Days" isMobile={isMobile}>
  <input
    type="number"
    style={inputStyle}
    value={officialForm.interestDays}
    onChange={(e) => {
      const value = e.target.value;

      if (value === "" || Number(value) <= 31) {
        setOfficialForm({
          ...officialForm,
          interestDays: value,
        });
      }
    }}
    placeholder="Enter interest days"
    min="0"
    max="31"
  />
</Field>

<Field label="Interest Amount" isMobile={isMobile}> 
  <input 
    type="number" 
    style={inputDisabled} 
    readOnly 
    value={officialForm.interestAmount} 
    placeholder="Auto-calculated" 
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

{/* <Field label="Transaction ID" isMobile={isMobile}>
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
</Field> */}

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

                <Field label="Witness Name" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={guaranteerForm.employeeName}
                    onChange={(e) =>
                      setGuaranteerForm({ ...guaranteerForm, employeeName: e.target.value })
                    }
                    placeholder="Enter witness name"
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
                      // 'Amount given from thrift A/C',
                      // 'Amount given from Share A/C',
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

                {/* ✅ Transaction Date */}
<Field label="Transaction Date" isMobile={isMobile}>
  <input
    type="date"
    style={inputStyle}
    value={emiForm.transactionDate}
    onChange={(e) =>
      setEmiForm({
        ...emiForm,
        transactionDate: e.target.value,
      })
    }
  />
</Field>

                {/* <Field label="Transaction ID" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={emiForm.transactionId}
                    onChange={(e) =>
                      setEmiForm({ ...emiForm, transactionId: e.target.value })
                    }
                    placeholder="Enter transaction ID"
                  />
                </Field> */}

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
                      'Both'
                    ].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>

{adjustmentForm.paymentMode !== "Both" ? (
  <Field label="Adjustment Amount" isMobile={isMobile}>
    <input
      type="number"
      style={inputStyle}
      value={adjustmentForm.adjustmentAmount}
      onChange={(e) =>
        setAdjustmentForm({
          ...adjustmentForm,
          adjustmentAmount: e.target.value,
        })
      }
      placeholder="Enter adjustment amount"
      min="0"
    />
  </Field>
) : (
  <>
    <Field label="Thrift Adjustment Amount" isMobile={isMobile}>
      <input
        type="number"
        style={inputStyle}
        value={adjustmentForm.thriftAdjustmentAmount}
        onChange={(e) =>
          setAdjustmentForm({
            ...adjustmentForm,
            thriftAdjustmentAmount: e.target.value,
          })
        }
        placeholder="Enter thrift adjustment amount"
        min="0"
      />
    </Field>

    <Field label="Share Adjustment Amount" isMobile={isMobile}>
      <input
        type="number"
        style={inputStyle}
        value={adjustmentForm.shareAdjustmentAmount}
        onChange={(e) =>
          setAdjustmentForm({
            ...adjustmentForm,
            shareAdjustmentAmount: e.target.value,
          })
        }
        placeholder="Enter share adjustment amount"
        min="0"
      />
    </Field>
  </>
)}

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

                {/* <Field label="Transaction Id" isMobile={isMobile}>
                  <input
                    style={inputStyle}
                    value={adjustmentForm.transactionId}
                    onChange={(e) =>
                      setAdjustmentForm({ ...adjustmentForm, transactionId: e.target.value })
                    }
                    placeholder="Enter transaction ID"
                  />
                </Field> */}

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
      "Interest",
      "Product",
      "Interest Charge",
      "Interest Balance",
    ].map((header) => (
      <th
        key={header}
        style={{
          ...th,
          position: "sticky",
          top: 0,
          zIndex: 2,
          background: "#f8f9fa",
          whiteSpace: "nowrap",
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
          ...td,
          textAlign: "center",
          padding: "20px",
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
          item.type || item.transactionType || ""
        ).toUpperCase();

        const amount = Number(item.amount || item.Amount || 0);

        const currentDate = new Date(
          item.TransactionDate ||
            item.transactionDate ||
            item.date
        );

        // ─────────────────────────────────────
        // NO OF DAYS
        // ─────────────────────────────────────
        let noOfDays = "-";

        if (i < transactions.length - 1) {
          const nextItem = transactions[i + 1];

          const nextDate = new Date(
            nextItem.TransactionDate ||
              nextItem.transactionDate ||
              nextItem.date
          );

          const diffTime =
            nextDate.getTime() - currentDate.getTime();

          const diffDays = Math.floor(
            diffTime / (1000 * 60 * 60 * 24)
          );

          noOfDays = Math.max(diffDays, 0);
        }

        // ─────────────────────────────────────
        // DEBIT → ADD TO BALANCE
        // ─────────────────────────────────────
        if (transactionType === "DEBIT") {
          runningBalance += amount;
        }

        // ─────────────────────────────────────
        // INTEREST CHARGE
        // ─────────────────────────────────────
        let interestCharge = 0;

        if (noOfDays !== "-") {
          interestCharge =
            (runningBalance *
              Number(item.interestRate || 0) *
              Number(noOfDays || 0)) /
            36500;
        }

        runningInterestBalance += interestCharge;

        // ─────────────────────────────────────
        // CREDIT → FIRST CLEAR INTEREST
        // THEN REDUCE BALANCE
        // ─────────────────────────────────────
        if (transactionType === "CREDIT") {
          if (amount <= runningInterestBalance) {
            runningInterestBalance -= amount;
          } else {
            const remainingCredit =
              amount - runningInterestBalance;

            runningInterestBalance = 0;

            runningBalance = Math.max(
              runningBalance - remainingCredit,
              0
            );
          }
        }

        // ─────────────────────────────────────
        // PRODUCT
        // ─────────────────────────────────────
const displayBalance = Math.round(runningBalance);

const product =
  noOfDays !== "-"
    ? displayBalance * Number(noOfDays)
    : "-";

        return (
          <tr key={item._id || i}>
            {/* Sl No */}
            <td style={td}>{i + 1}</td>

            {/* Transaction Date */}
            <td style={td}>
              {formatDateTime(
                item.TransactionDate ||
                  item.transactionDate ||
                  item.date
              )}
            </td>

            {/* Particulars */}
            <td style={td}>
              {item.PaymentMode ||
                item.paymentMode ||
                "-"}
            </td>

            {/* Debit */}
            <td style={td}>
              {transactionType === "DEBIT" ? Math.round(amount) : "-"}
            </td>

            {/* Credit */}
            <td style={td}>
              {transactionType === "CREDIT" ? Math.round(amount) : "-"}
            </td>

            {/* Balance */}
            <td style={td}>
              {Math.round(runningBalance)}
            </td>

            {/* No of Days */}
            <td style={td}>{noOfDays}</td>

            {/* Interest Rate */}
            <td style={td}>
              {item.interestRate !== undefined &&
              item.interestRate !== null &&
              item.interestRate !== ""
                ? `${Number(item.interestRate).toFixed(2)}%`
                : "-"}
            </td>

            {/* Product */}
            <td style={td}>
              {product !== "-" ? Math.round(product) : "-"}
            </td>

            {/* Interest Charge */}
            <td style={td}>
              {noOfDays !== "-" ? Math.round(interestCharge) : "-"}
            </td>

            {/* Interest Balance */}
            <td style={td}>
              {Math.round(runningInterestBalance)}
            </td>
          </tr>
        );
      });
    })()
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
                    ₹{Math.round(Number(availableBalance)).toLocaleString("en-IN")}
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