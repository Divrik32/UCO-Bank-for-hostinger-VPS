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
  const [dividendBalance, setDividendBalance] = useState(null);
  const [memberCode, setMemberCode] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState("official");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [editingDocument, setEditingDocument] = useState(null);
const [documentValue, setDocumentValue] = useState("");
  const [dividendRate, setDividendRate] = useState(0);
  const [creditPaymentMethods, setCreditPaymentMethods] = useState([]);
  const [debitPaymentMethods, setDebitPaymentMethods] = useState([]);
const [dividendPaidAmount, setDividendPaidAmount] = useState("");
const [dividendPaymentMode, setDividendPaymentMode] = useState("");
const [dividendAccountNumber, setDividendAccountNumber] = useState("");
const [dividendPaymentDate, setDividendPaymentDate] = useState("");

  const [officialForm, setOfficialForm] = useState({ officeName: "", dateOfJoin: "", dateOfAllotment: "", dateOfRetirement: "" });
  const [creditForm, setCreditForm] = useState({
  investmentAmount: "",
  numberOfShares: "",
  paymentMode: creditPaymentMethods[0] || "",
  creditDate: "",
});
  
  const [debitForm, setDebitForm] = useState({
  amount: "",
  remainingShares: "",
  remainingCount: "",
  paymentMode: debitPaymentMethods[0] || "",
  chequeNumber: "",
  transferShareTo: "Members Loan Account",
  certificateNo: "",
  debitDate: "",
});

  const API = "/share";
  const txScrollRef = useRef(null);
useLayoutEffect(() => {
  if (activeTab === "transaction" && txScrollRef.current) {
    txScrollRef.current.scrollTop = 0;
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
const submitDividend = async () => {
  try {
    await api.post(`${API}/dividend-payment`, {
      memberId: member.memberId,
      dividendPaidAmount: Number(dividendPaidAmount),
      paymentTransferTo: dividendPaymentMode,
      accountNumber: dividendAccountNumber,
      paymentDate: dividendPaymentDate,
    });

    toast.success("Dividend paid successfully");

    setDividendPaidAmount("");
    setDividendPaymentMode("");
    setDividendAccountNumber("");
    setDividendPaymentDate("");
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to pay dividend"
    );
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
    setCreditForm((prev) => ({ ...prev, numberOfShares: shares % 1 === 0 ? String(shares) : shares.toFixed(0) }));
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
      remainingShares: remainingBalance >= 0 ? remainingBalance.toFixed(0) : "0.00",
      remainingCount:
  remainingBalance >= 0
    ? remainingSharesCount
    : 0,
    }));
  }, [debitForm.amount, transactions]);

  const dividendAmount = (((currentBalance || 0) * dividendRate) / 100).toFixed(2);

  const handleSearch = async (searchType = "memberCode") => {
  try {
    // ==========================================
    // 1. Get Search Value
    // ==========================================

    const searchValue =
      searchType === "membershipNumber"
        ? membershipNumber.trim()
        : memberCode.trim();

    // ==========================================
    // 2. Validate Search Input
    // ==========================================

    if (!searchValue) {
      toast.error(
        searchType === "membershipNumber"
          ? "Enter membership number"
          : "Enter member code"
      );
      return;
    }

    setLoading(true);

    let data;

    // ==========================================
    // 3. Search By Membership Number
    // SAME AS THRIFT FUND
    // ==========================================

    if (searchType === "membershipNumber") {
      const res = await api.get(
        `/users/membership/${encodeURIComponent(searchValue)}`
      );

      if (!res.data.success) {
        toast.error("Member not found");
        return;
      }

      data = res.data.data;

      // Membership Number search করলে
      // actual Member Code automatically set হবে
      setMemberCode(data.memberId);

      // Actual Membership Number রাখবো
      setMembershipNumber(
        data.membershipNumber || searchValue
      );
    }

    // ==========================================
    // 4. Search By Member Code
    // SAME AS EXISTING SHARE SEARCH
    // ==========================================

    else {
      const res = await api.get(
        `${API}/member/${encodeURIComponent(searchValue)}`
      );

      if (!res.data.success) {
        toast.error("Member not found");
        return;
      }

      data = res.data.data;

      // Member Code search করলে
      // membership number থাকলে সেটাও show করবে
      setMemberCode(data.memberId);

      if (data.membershipNumber) {
        setMembershipNumber(data.membershipNumber);
      }
    }

    // ==========================================
    // 5. Set Member Information
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

      phoneNumber:
        data.phoneNumber ||
        data.phoneno ||
        "",

      email:
        data.email || "",

      profileImage:
        data.profileImage ||
        data.profile_image ||
        "",

      signatureImage:
        data.signatureImage ||
        data.signature_image ||
        "",

      membershipNumber:
        data.membershipNumber ||
        membershipNumber ||
        "",
    });

    // ==========================================
    // IMPORTANT
    // সব financial API-তে actual Member ID যাবে
    // ==========================================

    const searchMemberId = data.memberId;

    // ==========================================
    // 6. Share Balance
    // ==========================================

    const balanceRes = await api.get(
      `${API}/share-balance/${encodeURIComponent(searchMemberId)}`
    );

    setCurrentBalance(
      balanceRes.data.availableBalance || 0
    );

    // ==========================================
    // 7. Dividend Balance
    // ==========================================

    const dividendBalanceRes = await api.get(
      `${API}/dividend-balance/${encodeURIComponent(searchMemberId)}`
    );

    setDividendBalance(
      dividendBalanceRes.data.availableDividendBalance || 0
    );

    // ==========================================
    // 8. Credit Shares
    // ==========================================

    const creditRes = await api.get(
      `${API}/credit-share/${encodeURIComponent(searchMemberId)}`
    );

    // ==========================================
    // 9. Debit Shares
    // ==========================================

    const debitRes = await api.get(
      `${API}/debit-share/${encodeURIComponent(searchMemberId)}`
    );

    // ==========================================
    // 10. Loan Adjustment
    // ==========================================

    const loanAdjustmentRes = await api.get(
      `/loan/loan-adjustment/${encodeURIComponent(searchMemberId)}`
    );

    // ==========================================
    // 11. Credit Transactions
    // ==========================================

const credits = (
  creditRes.data.data || []
).map((item) => ({
  id: item._id,

  amount: Number(
    item.investmentAmount || 0
  ),

  type: "Credit",

  createdAt:
    item.creditDate || item.createdAt,

  bookNo:
    item.bookNo || "",

  certificateNo:
    item.certificateNo || "",

  isLoanAdjustment: false,
}));

    // ==========================================
    // 12. Debit Transactions
    // ==========================================

const debits = (
  debitRes.data.data || []
).map((item) => ({
  id: item._id,

  amount: Number(
    item.amount || 0
  ),

  type: "Debit",

  createdAt:
    item.debitDate || item.createdAt,

  bookNo:
    item.bookNo || "",

  certificateNo:
    item.certificateNo || "",

  isLoanAdjustment: false,
}));

    // ==========================================
    // 13. Loan Adjustment Transactions
    // ==========================================

    const loanAdjustments = (
      loanAdjustmentRes.data.data || []
    )
      .filter(
        (item) =>
          item.paymentMode ===
            "Amount given from Share A/C" ||
          item.paymentMode === "Both"
      )
      .map((item) => {
        const adjustmentAmount =
          item.paymentMode === "Both"
            ? Number(
                item.shareAdjustmentAmount || 0
              )
            : Number(
                item.adjustmentAmount || 0
              );

        return {
          id: item._id,

          amount: adjustmentAmount,

          type: "Debit",

          createdAt: item.createdAt,

          bookNo: "",

          certificateNo: "",

          isLoanAdjustment: true,
        };
      })
      .filter(
        (item) => item.amount > 0
      );

    // ==========================================
    // 14. Combine Transactions
    // ==========================================

    const allTransactions = [
      ...credits,
      ...debits,
      ...loanAdjustments,
    ];

    // ==========================================
    // 15. Sort Earliest -> Latest
    // ==========================================

    allTransactions.sort((a, b) => {
      const dateA = new Date(
        a.createdAt
      ).getTime();

      const dateB = new Date(
        b.createdAt
      ).getTime();

      return dateA - dateB;
    });

    setTransactions(allTransactions);

    // ==========================================
    // 16. Open Official Tab
    // ==========================================

    setActiveTab("official");

  } catch (error) {
    console.error(
      "Share member search error:",
      error
    );

    if (
      error.response?.status === 404
    ) {
      toast.error("Member not found");
    } else {
      toast.error(
        error.response?.data?.message ||
          "Search failed"
      );
    }

    setMember(null);
    setTransactions([]);
    setCurrentBalance(null);
    setDividendBalance(null);

  } finally {
    setLoading(false);
  }
};

  const updateShareDocument = async (
  item,
  field
) => {
  try {
    const value = documentValue.trim();

    const endpoint =
      item.type === "Credit"
        ? `${API}/credit-share/${item.id}/documents`
        : `${API}/debit-share/${item.id}/documents`;

    await api.put(endpoint, {
      [field]: value,
    });

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === item.id
          ? {
              ...transaction,
              [field]: value,
            }
          : transaction
      )
    );

    setEditingDocument(null);
    setDocumentValue("");

    toast.success(
      `${field === "bookNo" ? "Book No." : "Certificate No."} updated successfully`
    );
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to update"
    );
  }
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
      paymentMode: creditForm.paymentMode,
      creditDate: creditForm.creditDate,
    });

    toast.success("Credit shares updated successfully");

    setCreditForm({
      investmentAmount: "",
      numberOfShares: "",
      paymentMode: creditPaymentMethods[0] || "",
      creditDate: "",
    });

    handleSearch();
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to update"
    );
  }
};

const submitDebit = async () => {
  try {
    await api.post(`${API}/debit-share`, {
      memberId: member.memberId,
      amount: Number(debitForm.amount),
      paymentMode: debitForm.paymentMode,
      chequeNumber: debitForm.chequeNumber,
      transferShareTo: debitForm.transferShareTo,
      certificateNo: debitForm.certificateNo,
      debitDate: debitForm.debitDate,
    });

    toast.success("Debit shares updated successfully");

    setDebitForm({
      amount: "",
      remainingShares: "",
      remainingCount: "",
      paymentMode: debitPaymentMethods[0] || "",
      chequeNumber: "",
      transferShareTo: "Members Loan Account",
      certificateNo: "",
      debitDate: "",
    });

    handleSearch();
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to update"
    );
  }
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
{/* ── Header ── */}
<div style={{ marginBottom: "6px" }}>

  {/* Title + Address */}
  <div
    style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "flex-start",
      gap: "10px",
    }}
  >
    {/* LEFT: এই অংশ আর কখনও pills-এর জন্য ডানদিকে সরবে না */}
    <div
      style={{
        flexShrink: 0,
        position: "relative",
        left: isMobile ? "0px" : "-18px",
      }}
    >
      <h1
        style={{
          fontSize: isMobile ? "20px" : "26px",
          fontWeight: "700",
          color: "#1a2052",
          margin: 0,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Share Purchase
      </h1>

      <nav
        style={{
          fontSize: "13px",
          color: "#888",
          marginTop: "5px",
        }}
      >
        <a
          href="/"
          style={{
            color: "#1e40af",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          Home
        </a>

        <span style={{ margin: "0 6px" }}>/</span>

        <span style={{ fontWeight: "600" }}>
          Share Purchase
        </span>
      </nav>
    </div>

    {/* RIGHT: Address */}
    {!isMobile && (
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p
          style={{
            margin: 0,
            fontWeight: "700",
            fontSize: "16px",
            color: "#1a2052",
          }}
        >
          Regd. 203, Hari Om Commercial Complex
        </p>

        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#666",
          }}
        >
          New Dak Bunglow Road, Patna-800001
        </p>
      </div>
    )}
  </div>

  {/* Pills — আলাদা row */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginTop: "20px",
      flexWrap: "wrap",
    }}
  >
    {/* Interest Rate */}
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(10,25,47,0.10)",
      }}
    >
      <span
        style={{
          ...pillLabel,
          backgroundColor: "#1e40af",
        }}
      >
        Interest Rate
      </span>

      <span
        style={{
          ...pillValue,
          backgroundColor: "#eff6ff",
          color: "#1e40af",
        }}
      >
        {dividendRate}%
      </span>
    </div>

    {/* Share Balance */}
    {member && (
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 6px rgba(10,25,47,0.10)",
        }}
      >
        <span
          style={{
            ...pillLabel,
            backgroundColor: "#059669",
          }}
        >
          Share Balance
        </span>

        <span
          style={{
            ...pillValue,
            backgroundColor: "#ecfdf5",
            color: "#065f46",
          }}
        >
          ₹{Number(currentBalance || 0).toFixed(0)}
        </span>
      </div>
    )}

    {/* Dividend Balance */}
    {member && (
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 6px rgba(10,25,47,0.10)",
        }}
      >
        <span
          style={{
            ...pillLabel,
            backgroundColor: "#7c3aed",
          }}
        >
          Dividend Balance
        </span>

        <span
          style={{
            ...pillValue,
            backgroundColor: "#f5f3ff",
            color: "#6d28d9",
          }}
        >
          ₹{Number(dividendBalance || 0).toFixed(0)}
        </span>
      </div>
    )}
  </div>
</div>

{/* ── Search Bar ── */}
<div
  style={{
    display: "flex",
    justifyContent: isMobile
      ? "stretch"
      : "flex-end",
    marginBottom: "14px",
    marginTop: "14px",
  }}
>
  <div
    style={{
      display: "flex",
      flexDirection: isMobile
        ? "column"
        : "row",
      gap: "14px",
      width: isMobile
        ? "100%"
        : "auto",
    }}
  >

    {/* ==========================================
        Membership Number Search
    ========================================== */}

    <div
      style={{
        width: isMobile
          ? "100%"
          : "auto",
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
            const value = e.target.value;

            setMembershipNumber(value);

            // Membership Number type করলে
            // Member Code clear হবে
            if (value) {
              setMemberCode("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch("membershipNumber");
            }
          }}
          style={{
            padding: "0 14px",
            fontSize: "14px",
            border: "1.5px solid #ced4da",
            borderRadius: "5px",
            fontFamily: "'Inter', sans-serif",
            outline: "none",
            backgroundColor: "#fff",

            width: isMobile
              ? "100%"
              : "200px",

            height: "45px",

            boxSizing: "border-box",
          }}
          placeholder="Enter membership number"
        />

        <button
          type="button"
          onClick={() =>
            handleSearch("membershipNumber")
          }
          disabled={loading}
          style={{
            backgroundColor: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "5px",

            padding: "0 20px",

            fontSize: "14px",
            fontWeight: "600",
            fontFamily: "'Inter', sans-serif",

            cursor: loading
              ? "not-allowed"
              : "pointer",

            whiteSpace: "nowrap",

            height: "44px",

            minHeight: "38px",

            boxSizing: "border-box",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            opacity: loading ? 0.7 : 1,
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
        width: isMobile
          ? "100%"
          : "auto",
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
            const value = e.target.value;

            setMemberCode(value);

            // Member Code type করলে
            // Membership Number clear হবে
            if (value) {
              setMembershipNumber("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch("memberCode");
            }
          }}
          style={{
            padding: "0 14px",
            fontSize: "14px",
            border: "1.5px solid #ced4da",
            borderRadius: "5px",
            fontFamily: "'Inter', sans-serif",
            outline: "none",
            backgroundColor: "#fff",

            width: isMobile
              ? "100%"
              : "200px",

            height: "45px",

            boxSizing: "border-box",
          }}
          placeholder="Enter member code"
        />

        <button
          type="button"
          onClick={() =>
            handleSearch("memberCode")
          }
          disabled={loading}
          style={{
            backgroundColor: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "5px",

            padding: "0 20px",

            fontSize: "14px",
            fontWeight: "600",
            fontFamily: "'Inter', sans-serif",

            cursor: loading
              ? "not-allowed"
              : "pointer",

            whiteSpace: "nowrap",

            height: "44px",

            minHeight: "38px",

            boxSizing: "border-box",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "..." : "Search"}
        </button>
      </div>
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
                <Field label="Investment Amount" isMobile={isMobile}><input style={inputDisabled} disabled value={transactions
  .filter((t) => t.type === "Credit")
  .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  .toFixed(0)} /></Field>
                <Field label="Number of Shares" isMobile={isMobile}>
                  <input style={inputDisabled} disabled value={(() => { const total = transactions.filter((t) => t.type === "Credit").reduce((sum, t) => sum + Number(t.amount || 0), 0); const n = total / PRICE_PER_SHARE; return n % 1 === 0 ? String(n) : n.toFixed(0); })()} />
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
        value={
  creditForm.numberOfShares !== ""
    ? Number(creditForm.numberOfShares).toFixed(0)
    : ""
}
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
    <Field label="Credit Date" isMobile={isMobile}>
  <input
    type="date"
    style={inputStyle}
    value={creditForm.creditDate}
    onChange={(e) =>
      setCreditForm({
        ...creditForm,
        creditDate: e.target.value,
      })
    }
  />
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
                <Field label="Remaining Share Balance" isMobile={isMobile}><input style={inputDisabled} disabled value={
  debitForm.remainingShares !== ""
    ? Number(debitForm.remainingShares).toFixed(0)
    : ""
} /></Field>
                <Field label="Remaining Shares" isMobile={isMobile}><input style={inputDisabled} disabled value={
  debitForm.remainingCount !== ""
    ? Number(debitForm.remainingCount).toFixed(0)
    : ""
} /></Field>
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
                <Field label="Certificate No." isMobile={isMobile}>
  <input
    style={inputStyle}
    value={debitForm.certificateNo}
    onChange={(e) =>
      setDebitForm({
        ...debitForm,
        certificateNo: e.target.value
      })
    }
    placeholder="Enter certificate number"
  />
</Field>
<Field label="Debit Date" isMobile={isMobile}>
  <input
    type="date"
    style={inputStyle}
    value={debitForm.debitDate}
    onChange={(e) =>
      setDebitForm({
        ...debitForm,
        debitDate: e.target.value,
      })
    }
  />
</Field>
                <div style={{ textAlign: "center", marginTop: "20px" }}><button style={btnPrimary} onClick={submitDebit}>Update</button></div>
              </div>
            )}

            {/* ── Dividend Details ── */}
            {activeTab === "dividend" && (
              <>
                <div style={{ maxWidth: "680px" }}>
                  <h5 style={sectionTitle}>Dividend Details</h5>
                  <Field label="Share Balance" isMobile={isMobile}><input style={inputDisabled} disabled value={Number(currentBalance || 0).toFixed(0)} /></Field>
                  <Field label="Dividend Rate" isMobile={isMobile}><input style={inputDisabled} disabled value={`${dividendRate}%`} /></Field>

<Field label="Dividend Amount" isMobile={isMobile}>
  <input
    style={inputDisabled}
    disabled
    value={Number(dividendAmount).toFixed(0)}
  />
</Field>

<Field label="Amount Paid From Dividend" isMobile={isMobile}>
  <input
    type="number"
    style={inputStyle}
    value={dividendPaidAmount}
    onChange={(e) => setDividendPaidAmount(e.target.value)}
    placeholder="Enter amount"
  />
</Field>

<Field label="Payment Transfer To" isMobile={isMobile}>
  <select
    style={inputStyle}
    value={dividendPaymentMode}
    onChange={(e) => {
      setDividendPaymentMode(e.target.value);

      // Members Account select na korle account number clear
      if (e.target.value !== "Paid to Members Account") {
        setDividendAccountNumber("");
      }
    }}
  >
    <option value="">Select Payment Account</option>
    <option value="Paid to Thrift Account">
      Paid to Thrift Account
    </option>
    <option value="Paid to Loan Account">
      Paid to Loan Account
    </option>
    <option value="Paid to Members Account">
      Paid to Members Account
    </option>
  </select>
</Field>

<Field label="Payment Date" isMobile={isMobile}>
  <input
    type="date"
    style={inputStyle}
    value={dividendPaymentDate}
    onChange={(e) =>
      setDividendPaymentDate(e.target.value)
    }
  />
</Field>

{dividendPaymentMode === "Paid to Members Account" && (
  <Field label="Account Number" isMobile={isMobile}>
    <input
      type="text"
      style={inputStyle}
      value={dividendAccountNumber}
      onChange={(e) => setDividendAccountNumber(e.target.value)}
      placeholder="Enter account number"
    />
  </Field>
)}                </div>
<div style={{ textAlign: "center", marginTop: "20px" }}>
  <button style={btnPrimary} onClick={submitDividend}>
    Pay Dividend
  </button>
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
{[
  "Sl No",
  "Date",
  "Particulars",
  "Amount",
  "Credit/Debit",
  "Balance Amount",
  "No. (s) of Share Remained",
  "Book No.",
  "Certificate No.",
].map((h) => (
  <th key={h} style={th}>
    {h}
  </th>
))}
                      </tr>
                    </thead>
<tbody>
  {transactions.length === 0 ? (
    <tr>
      <td
        colSpan={9}
        style={{
          textAlign: "center",
          padding: "28px",
          color: "#aaa",
        }}
      >
        No transactions found
      </td>
    </tr>
  ) : (
    (() => {
      let runningBalance = 0;

      return transactions.map((item, i) => {
        // ─────────────────────────────────────
        // Running Balance
        // Credit = Add
        // Debit  = Minus
        // ─────────────────────────────────────
        if (item.type === "Credit") {
          runningBalance += Number(item.amount || 0);
        } else if (item.type === "Debit") {
          runningBalance -= Number(item.amount || 0);
        }

        const remainingShares =
          runningBalance / PRICE_PER_SHARE;

        return (
          <tr
            key={`${item.id}-${i}`}
            style={{
              backgroundColor:
                i % 2 === 0 ? "#ffffff" : "#fdfdfd",
            }}
          >
            {/* ─────────────────────────────
                Sl No
            ───────────────────────────── */}
            <td style={td}>
              {i + 1}
            </td>

            {/* ─────────────────────────────
                Date
            ───────────────────────────── */}
            <td
              style={{
                ...td,
                whiteSpace: "nowrap",
              }}
            >
              {formatDateTime(item.createdAt)}
            </td>

            {/* ─────────────────────────────
                Particulars
            ───────────────────────────── */}
            <td
              style={{
                ...td,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {item.amount != null
                ? `By ${
                    Number(item.amount) / PRICE_PER_SHARE
                  } shares`
                : "-"}
            </td>

            {/* ─────────────────────────────
                Amount
            ───────────────────────────── */}
            <td
              style={{
                ...td,
                fontWeight: "600",
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              {item.amount != null
  ? Number(item.amount).toFixed(0)
  : "None"}
            </td>

            {/* ─────────────────────────────
                Credit / Debit
            ───────────────────────────── */}
            <td style={td}>
              <span
                style={
                  item.type === "Credit"
                    ? {
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: "20px",
                        backgroundColor: "#d4f8e8",
                        color: "#1a7a4a",
                        fontWeight: "600",
                        fontSize: "12px",
                      }
                    : {
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: "20px",
                        backgroundColor: "#fde8e8",
                        color: "#c0392b",
                        fontWeight: "600",
                        fontSize: "12px",
                      }
                }
              >
                {item.isLoanAdjustment
                  ? "Paid to Loan Account"
                  : item.type || "Debit"}
              </span>
            </td>

            {/* ─────────────────────────────
                Balance Amount
            ───────────────────────────── */}
            <td
              style={{
                ...td,
                textAlign: "right",
                fontWeight: "700",
                whiteSpace: "nowrap",
              }}
            >
              ₹{Number(runningBalance).toFixed(0)}
            </td>

            {/* ─────────────────────────────
                No. (s) of Share Remained
            ───────────────────────────── */}
            <td
              style={{
                ...td,
                textAlign: "center",
                fontWeight: "700",
                whiteSpace: "nowrap",
              }}
            >
              {Number(remainingShares).toFixed(0)}
            </td>

            {/* ─────────────────────────────
                Book No.
            ───────────────────────────── */}
            <td
              style={{
                ...td,
                cursor: item.isLoanAdjustment
                  ? "default"
                  : "pointer",
                minWidth: "130px",
                textAlign: "center",
              }}
              onClick={() => {
                if (item.isLoanAdjustment) return;

                if (
                  editingDocument?.id === item.id &&
                  editingDocument?.field === "bookNo"
                ) {
                  return;
                }

                setEditingDocument({
                  id: item.id,
                  field: "bookNo",
                });

                setDocumentValue(item.bookNo || "");
              }}
            >
              {item.isLoanAdjustment ? (
                "-"
              ) : editingDocument?.id === item.id &&
                editingDocument?.field === "bookNo" ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    autoFocus
                    type="text"
                    value={documentValue}
                    onChange={(e) =>
                      setDocumentValue(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateShareDocument(
                          item,
                          "bookNo"
                        );
                      }

                      if (e.key === "Escape") {
                        setEditingDocument(null);
                        setDocumentValue("");
                      }
                    }}
                    style={{
                      width: "100px",
                      padding: "5px 7px",
                      border: "1px solid #ced4da",
                      borderRadius: "4px",
                      outline: "none",
                      fontSize: "13px",
                    }}
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateShareDocument(
                        item,
                        "bookNo"
                      );
                    }}
                    style={{
                      border: "none",
                      backgroundColor: "#16a34a",
                      color: "#fff",
                      borderRadius: "4px",
                      padding: "4px 7px",
                      cursor: "pointer",
                      fontWeight: "700",
                    }}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <span
                  style={{
                    color: item.bookNo
                      ? "#333"
                      : "#aaa",
                    cursor: "pointer",
                  }}
                >
                  {item.bookNo || "Click to add"}
                </span>
              )}
            </td>

            {/* ─────────────────────────────
                Certificate No.
            ───────────────────────────── */}
            <td
              style={{
                ...td,
                cursor: item.isLoanAdjustment
                  ? "default"
                  : "pointer",
                minWidth: "150px",
                textAlign: "center",
              }}
              onClick={() => {
                if (item.isLoanAdjustment) return;

                if (
                  editingDocument?.id === item.id &&
                  editingDocument?.field === "certificateNo"
                ) {
                  return;
                }

                setEditingDocument({
                  id: item.id,
                  field: "certificateNo",
                });

                setDocumentValue(
                  item.certificateNo || ""
                );
              }}
            >
              {item.isLoanAdjustment ? (
                "-"
              ) : editingDocument?.id === item.id &&
                editingDocument?.field ===
                  "certificateNo" ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    autoFocus
                    type="text"
                    value={documentValue}
                    onChange={(e) =>
                      setDocumentValue(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateShareDocument(
                          item,
                          "certificateNo"
                        );
                      }

                      if (e.key === "Escape") {
                        setEditingDocument(null);
                        setDocumentValue("");
                      }
                    }}
                    style={{
                      width: "120px",
                      padding: "5px 7px",
                      border: "1px solid #ced4da",
                      borderRadius: "4px",
                      outline: "none",
                      fontSize: "13px",
                    }}
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateShareDocument(
                        item,
                        "certificateNo"
                      );
                    }}
                    style={{
                      border: "none",
                      backgroundColor: "#16a34a",
                      color: "#fff",
                      borderRadius: "4px",
                      padding: "4px 7px",
                      cursor: "pointer",
                      fontWeight: "700",
                    }}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <span
                  style={{
                    color: item.certificateNo
                      ? "#333"
                      : "#aaa",
                    cursor: "pointer",
                  }}
                >
                  {item.certificateNo ||
                    "Click to add"}
                </span>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}