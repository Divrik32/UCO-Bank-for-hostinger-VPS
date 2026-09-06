import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function DividendRate() {
  const [dividendRate, setDividendRate] = useState("");
  const [currentRate, setCurrentRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch current dividend rate
  const fetchDividendRate = async () => {
    try {
      setFetching(true);

      const res = await api.get("/share/dividend-rate");

      if (res.data?.success) {
        setCurrentRate(res.data.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Fetch Dividend Rate Error:", error);
        toast.error("Failed to fetch dividend rate");
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchDividendRate();
  }, []);

  // Create / Change dividend rate
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (dividendRate === "") {
      toast.error("Please enter dividend rate");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/share/dividend-rate", {
        dividendRate: Number(dividendRate),
      });

      if (res.data?.success) {
        toast.success("Dividend rate changed successfully");

        setDividendRate("");
        setCurrentRate(res.data.data);
      }
    } catch (error) {
      console.error("Create Dividend Rate Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to change dividend rate"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "Verdana, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2
          style={{
            margin: "0 0 22px",
            color: "#1e293b",
            fontSize: "20px",
          }}
        >
          Dividend Rate
        </h2>

        {/* Current Rate */}
        <div
          style={{
            background: "#f0f4ff",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginBottom: "6px",
              fontWeight: "600",
            }}
          >
            Current Dividend Rate
          </div>

          {fetching ? (
            <div style={{ color: "#64748b" }}>Loading...</div>
          ) : (
            <div
              style={{
                fontSize: "26px",
                fontWeight: "700",
                color: "#1e4db7",
              }}
            >
              {currentRate
                ? `${currentRate.dividendRate}%`
                : "Not Set"}
            </div>
          )}
        </div>

        {/* Change Rate */}
        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Change Dividend Rate (%)
          </label>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <input
              type="number"
              step="0.01"
              min="0"
              value={dividendRate}
              onChange={(e) => setDividendRate(e.target.value)}
              placeholder="Enter dividend rate"
              style={{
                flex: 1,
                padding: "11px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "7px",
                outline: "none",
                fontSize: "14px",
                fontFamily: "Verdana, sans-serif",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "11px 20px",
                border: "none",
                borderRadius: "7px",
                backgroundColor: loading ? "#94a3b8" : "#4154f1",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "Verdana, sans-serif",
              }}
            >
              {loading ? "Saving..." : "Change Rate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}