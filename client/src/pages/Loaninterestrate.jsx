import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = "http://localhost:5000/api/loan";

export default function LoanInterestRate() {
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await axios.get(`${API}/interest-rate`);
        setRate(res.data.data.rate ?? "");
      } catch {
        // no existing rate yet
      }
    };
    fetchRate();
  }, []);

  const handleSubmit = async () => {
    if (rate === "" || isNaN(Number(rate))) {
      toast.error("Please enter a valid interest rate");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/interest-rate`, {
        rate: Number(rate),
        updatedBy: "Admin",
        remarks: "Updated from Interest Rate page",
      });
      toast.success("Loan interest rate updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update interest rate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <InterestRateCard
      title="Loan Interest Rate"
      icon="bi-cash-stack"
      accentColor="#b45309"
      lightColor="#fffbeb"
      borderColor="#fde68a"
      rate={rate}
      setRate={setRate}
      loading={loading}
      onSubmit={handleSubmit}
    />
  );
}

function InterestRateCard({
  title,
  icon,
  accentColor,
  lightColor,
  borderColor,
  rate,
  setRate,
  loading,
  onSubmit,
}) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const isMobile = windowWidth < 640;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 112px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "20px 12px" : "32px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#fff",
          borderRadius: "14px",
          boxShadow: "0 4px 24px rgba(10,25,80,0.10)",
          overflow: "hidden",
          border: `1.5px solid ${borderColor}`,
        }}
      >
        {/* Card Header */}
        <div
          style={{
            backgroundColor: accentColor,
            padding: isMobile ? "16px 20px" : "20px 28px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <i className={`bi ${icon}`} style={{ fontSize: "20px", color: "#fff" }}></i>
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? "15px" : "17px",
              fontWeight: "700",
              color: "#fff",
              fontFamily: "Verdana, sans-serif",
              letterSpacing: "0.3px",
            }}
          >
            {title}
          </h2>
        </div>

        {/* Card Body */}
        <div style={{ padding: isMobile ? "24px 18px 28px" : "32px 28px 36px" }}>
          <label
            style={{
              display: "block",
              fontSize: isMobile ? "13px" : "14px",
              fontWeight: "700",
              color: "#374151",
              fontFamily: "Verdana, sans-serif",
              marginBottom: "8px",
            }}
          >
            Interest Rate{" "}
            <span style={{ color: "#6b7280", fontWeight: "400" }}>(% per annum)</span>
          </label>

          <div style={{ position: "relative", marginBottom: "28px" }}>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 8.5"
              min="0"
              step="0.01"
              style={{
                width: "100%",
                padding: isMobile ? "11px 40px 11px 14px" : "12px 44px 12px 16px",
                fontSize: isMobile ? "15px" : "16px",
                fontFamily: "Verdana, sans-serif",
                border: `1.5px solid ${borderColor}`,
                borderRadius: "8px",
                outline: "none",
                backgroundColor: lightColor,
                color: "#1a2052",
                fontWeight: "600",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = accentColor)}
              onBlur={(e) => (e.target.style.borderColor = borderColor)}
            />
            <span
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                color: accentColor,
                fontWeight: "700",
                fontFamily: "Verdana, sans-serif",
                pointerEvents: "none",
              }}
            >
              %
            </span>
          </div>

          <button
            onClick={onSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: isMobile ? "12px" : "13px",
              backgroundColor: loading ? "#fcd34d" : accentColor,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: isMobile ? "14px" : "15px",
              fontWeight: "700",
              fontFamily: "Verdana, sans-serif",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.4px",
              transition: "background-color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.filter = "brightness(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                ></span>
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle" style={{ fontSize: "16px" }}></i>
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}