import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

function StatCard({ title, value, icon, color, bgColor }) {
  return (
    <div style={{
      flex: "1 1 180px",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      padding: "20px",
      textAlign: "center",
      border: "1px solid #f0f0f0",
    }}>
      <p style={{
        fontSize: "13px", fontWeight: "700", letterSpacing: "1px",
        color: "#666", marginBottom: "14px", fontFamily: "Cambria, serif",
      }}>
        {title}
      </p>
      <div style={{
        width: "56px", height: "56px", borderRadius: "50%",
        backgroundColor: bgColor, display: "flex",
        alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
      }}>
        <i className={`bi ${icon}`} style={{ fontSize: "24px", color: color }}></i>
      </div>
      <h5 style={{
        fontSize: "20px", fontWeight: "700", color: "#333",
        fontFamily: "Cambria, serif", margin: 0,
      }}>
        {value}
      </h5>
    </div>
  );
}

export default function Dashboard() {
  const [officialEntryCount, setOfficialEntryCount] = useState(0);
  const [thriftFundCount, setThriftFundCount] = useState(0);
  const [creditShareCount, setCreditShareCount] = useState(0);
  const [approvedMemberCount, setApprovedMemberCount] = useState(0);
  const [activeMemberCount, setActiveMemberCount] = useState(0);
  const [inactiveMemberCount, setInactiveMemberCount] = useState(0);

useEffect(() => {
  const fetchDashboardStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");

      if (res.data.success) {
        setOfficialEntryCount(
          res.data.data.officialEntryCount
        );

        setThriftFundCount(
          res.data.data.thriftFundCount
        );

        setCreditShareCount(
          res.data.data.creditShareCount
        );

        setApprovedMemberCount(
          res.data.data.approvedMemberCount
        );

        setActiveMemberCount(
          res.data.data.activeMemberCount
        );

        setInactiveMemberCount(
          res.data.data.inactiveMemberCount
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch dashboard stats:",
        error
      );
    }
  };

  fetchDashboardStats();
}, []);

const barData = [
  { name: "Official Entry", value: officialEntryCount },
  { name: "Thrift Fund", value: thriftFundCount },
  { name: "Members", value: approvedMemberCount },
  { name: "Credit Shares", value: creditShareCount },
];

const pieData = [
  {
    name: "Active Members",
    value: activeMemberCount,
  },
  {
    name: "Inactive Members",
    value: inactiveMemberCount,
  },
];

  const PIE_COLORS = ["#4154f1", "#2eca6a"];

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#f6f9ff",
      fontFamily: "Cambria, serif", padding: "24px",
    }}>

      {/* ── top bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#333", margin: 0 }}>Dashboard</h1>
          <nav style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>
            <a href="/" style={{ color: "#4154f1", textDecoration: "none" }}>Home</a>
            <span style={{ margin: "0 6px" }}>/</span>
            <span>Dashboard</span>
          </nav>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: "#333" }}>
            Regd. 203, Hari Om Commercial Complex
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
            New Dak Bunglow Road, Patna-800001
          </p>
        </div>
      </div>

      {/* ── main content ── */}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>

        {/* ── left ── */}
        <div style={{ flex: "2 1 600px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* stat cards */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
<StatCard
  title="OFFICIAL ENTRY"
  value={officialEntryCount}
  icon="bi-bank"
  color="#4154f1"
  bgColor="#e8eaff"
/>
<StatCard
  title="THRIFT FUND"
  value={thriftFundCount}
  icon="bi-currency-dollar"
  color="#2eca6a"
  bgColor="#e0f7ea"
/>
<StatCard
  title="MEMBERS"
  value={approvedMemberCount}
  icon="bi-people"
  color="#ff771d"
  bgColor="#fff0e5"
/>
<StatCard
  title="SHARES"
  value={creditShareCount}
  icon="bi-bar-chart-line"
  color="#ee6c74"
  bgColor="#fde9ea"
/>
          </div>

          {/* bar chart */}
          <div style={{
            backgroundColor: "white", borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "20px",
          }}>
            <h5 style={{ fontSize: "16px", fontWeight: "700", color: "#333", marginBottom: "16px" }}>
              Reports
            </h5>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 12 }}  />
                <Tooltip />
                <Bar dataKey="value" fill="#4154f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* ── right ── */}
        <div style={{ flex: "1 1 280px" }}>
          <div style={{
            backgroundColor: "white", borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "20px",
          }}>
            <h5 style={{ fontSize: "16px", fontWeight: "700", color: "#333", marginBottom: "16px" }}>
              Members
            </h5>
            <PieChart width={280} height={380}>
              <Pie
                data={pieData}
                cx="50%" cy="45%"
                innerRadius={85} outerRadius={140}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </div>
        </div>

      </div>
    </div>
  );
}