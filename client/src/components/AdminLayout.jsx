import { useState, useEffect, useRef, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

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

const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 360;
const SIDEBAR_DEFAULT = 240;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [memberOpen, setMemberOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [hoveredSub, setHoveredSub] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);

  // On mobile/tablet, close sidebar by default
  useEffect(() => {
    if (isMobile || isTablet) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile, isTablet]);

  // ── Drag-to-resize ──
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(SIDEBAR_DEFAULT);

  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      const newW = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW.current + delta));
      setSidebarWidth(newW);
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Touch drag support
  const onTouchStart = useCallback((e) => {
    dragging.current = true;
    startX.current = e.touches[0].clientX;
    startW.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    const onTouchMove = (e) => {
      if (!dragging.current) return;
      const delta = e.touches[0].clientX - startX.current;
      const newW = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW.current + delta));
      setSidebarWidth(newW);
    };
    const onTouchEnd = () => { dragging.current = false; };
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const isActive = (path) => location.pathname === path;
  const admin = JSON.parse(localStorage.getItem("user") || "{}");
  const profileImage = "/assets/admin-profile-avatar.png";

const handleLogout = async () => {
  try {
    await api.post("/users/logout", {}, {
      withCredentials: true,
    });

    localStorage.clear();
    navigate("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

  const effectiveSidebarWidth = isMobile ? Math.min(280, window.innerWidth - 40) : sidebarWidth;

  const navLinkStyle = (path, hovered) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "600",
    padding: "9px 20px",
    fontSize: "14px",
    textDecoration: "none",
    fontFamily: "Verdana, sans-serif",
    whiteSpace: "nowrap",
    borderRadius: "6px",
    transition: "background 0.18s, color 0.18s",
    userSelect: "none",
    backgroundColor: isActive(path) ? "#EAF2FF" : hovered ? "#DCE8FF" : "#F5F7FB",
    color: isActive(path) ? "#1E4DB7" : hovered ? "#163A8A" : "#4A5A7A",
  });

  const subLinkStyle = (path, hovered) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 20px 7px 44px",
    fontSize: "13px",
    textDecoration: "none",
    fontFamily: "Verdana, sans-serif",
    fontWeight: "600",
    borderRadius: "6px",
    transition: "background 0.18s, color 0.18s",
    backgroundColor: isActive(path) ? "#E1F5EE" : hovered ? "#EEEDFE" : "transparent",
    color: isActive(path) ? "#0F6E56" : hovered ? "#534AB7" : "#555",
    textDecorationLine: "underline",
  });

  const collapsibleHeaderStyle = (key, hovered) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 20px",
    fontSize: "14px",
    cursor: "pointer",
    borderRadius: "6px",
    fontWeight: "600",
    fontFamily: "Verdana, sans-serif",
    transition: "background 0.18s, color 0.18s",
    userSelect: "none",
    backgroundColor: hovered ? "#EEEDFE" : "#F5F7FB",
    color: hovered ? "#534AB7" : "#4A5A7A",
  });

  return (
    <div style={{ fontFamily: "Verdana, sans-serif" }}>

      {/* ===== HEADER ===== */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "64px",
        backgroundColor: "#fff", borderBottom: "1px solid #e0e0e0",
        display: "flex", alignItems: "center",
        padding: isMobile ? "0 10px" : "0 16px",
        zIndex: 100, gap: isMobile ? "8px" : "14px",
      }}>

        {/* Logo */}
        <Link to="/dashboard" style={{ flexShrink: 0, textDecoration: "none" }}>
          <img
            src="/assets/img/Logo2.png"
            alt="Logo"
            style={{ height: isMobile ? "48px" : "62px" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div style={{
            display: "none", width: "42px", height: "42px",
            borderRadius: "50%", backgroundColor: "#c00",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "10px", fontWeight: "700",
          }}>AIBOA</div>
        </Link>

        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "6px", display: "flex", flexDirection: "column",
            gap: "5px", flexShrink: 0,
          }}
        >
          {[
            sidebarOpen ? "rotate(45deg) translate(5px, 5px)" : "none",
            null,
            sidebarOpen ? "rotate(-45deg) translate(5px, -5px)" : "none",
          ].map((transform, i) => (
            <span key={i} style={{
              display: "block", width: "22px", height: "2px",
              backgroundColor: "#444",
              transform: transform || "none",
              opacity: i === 1 ? (sidebarOpen ? 0 : 1) : 1,
              transition: i === 1 ? "opacity 0.25s" : "transform 0.25s",
            }} />
          ))}
        </button>

        {/* Title */}
        {!isMobile && (
          <span style={{
            color: "#c00", fontWeight: "700",
            fontSize: isTablet ? "13px" : "17px",
            lineHeight: "1.4", flex: 1,
          }}>
            BIHAR STATE UCO BANK OFFICER'S CREDIT &amp; THRIFT CO-OPERATIVE SOCIETY LTD. (Regd No. 1-Hqr/90).
          </span>
        )}

        {/* ── Profile section ── */}
        <div style={{
          marginLeft: "auto",
          position: "relative",
          flexShrink: 0,
        }}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              padding: "5px 10px",
              borderRadius: "10px",
              transition: "background 0.18s",
              backgroundColor: showProfileMenu ? "#f0f4ff" : "transparent",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f0f4ff"; }}
            onMouseLeave={(e) => { if (!showProfileMenu) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {/* Avatar with ring */}
            <div style={{
              position: "relative",
              flexShrink: 0,
            }}>
              <div style={{
                width: "38px", height: "38px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4154f1, #8b5cf6)",
                padding: "2px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img
                  src={profileImage}
                  alt="Admin"
                  style={{
                    width: "34px", height: "34px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #fff",
                  }}
                  onError={(e) => { e.target.onerror = null; e.target.src = "/assets/admin-profile-avatar.png"; }}
                />
              </div>
              {/* Online dot */}
              <span style={{
                position: "absolute", bottom: "1px", right: "1px",
                width: "9px", height: "9px",
                backgroundColor: "#22c55e",
                borderRadius: "50%",
                border: "2px solid #fff",
              }} />
            </div>

            {/* Name + role stacked — hide on mobile */}
            {!isMobile && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
              }}>
                <span style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#1e293b",
                  fontFamily: "Verdana, sans-serif",
                  maxWidth: "160px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: "1.2",
                }}>
                  {admin?.email || "admin@example.com"}
                </span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#fff",
                  backgroundColor: "#4154f1",
                  borderRadius: "20px",
                  padding: "2px 8px",
                  letterSpacing: "0.5px",
                  fontFamily: "Verdana, sans-serif",
                  textTransform: "uppercase",
                  lineHeight: "1.4",
                }}>
                  <i className="bi bi-shield-fill-check" style={{ fontSize: "9px" }}></i>
                  Admin
                </span>
              </div>
            )}

            <i className="bi bi-chevron-down" style={{
              fontSize: "11px",
              color: "#64748b",
              transition: "transform 0.2s",
              transform: showProfileMenu ? "rotate(180deg)" : "rotate(0deg)",
            }}></i>
          </div>

          {/* Dropdown */}
          {showProfileMenu && (
            <div style={{
              position: "absolute", top: "54px", right: 0,
              width: "160px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 999,
              overflow: "hidden",
            }}>
              {/* Header strip */}
              <div style={{
                padding: "10px 14px",
                background: "linear-gradient(135deg, #4154f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <i className="bi bi-shield-fill-check" style={{ color: "#fff", fontSize: "12px" }}></i>
                <span style={{ color: "#fff", fontSize: "11px", fontWeight: "700", fontFamily: "Verdana, sans-serif" }}>
                  Administrator
                </span>
              </div>

              <div
                onClick={handleLogout}
                style={{
                  padding: "10px 14px", cursor: "pointer", fontSize: "13px",
                  fontWeight: "600", color: "#dc2626",
                  display: "flex", alignItems: "center", gap: "8px",
                  transition: "all 0.2s ease",
                  backgroundColor: "#fff",
                  fontFamily: "Verdana, sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <i className="bi bi-box-arrow-right" style={{ fontSize: "15px" }}></i>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 102,
            background: "rgba(0,0,0,0.35)",
          }}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside style={{
        position: "fixed", top: "64px", left: 0, bottom: 0,
        width: `${effectiveSidebarWidth}px`,
        backgroundColor: "#fff",
        borderRight: "1px solid #e0e0e0",
        overflowY: "auto", overflowX: "hidden",
        zIndex: 103,
        transform: sidebarOpen ? "translateX(0)" : `translateX(-${effectiveSidebarWidth}px)`,
        transition: dragging.current ? "none" : "transform 0.28s ease",
      }}>
        <ul style={{
          listStyle: "none", padding: "12px 8px", margin: 0,
          display: "flex", flexDirection: "column", gap: "2px",
        }}>

          {/* Dashboard */}
          <li>
            <Link
              to="/admin/dashboard"
              onClick={() => isMobile && setSidebarOpen(false)}
              style={navLinkStyle("/dashboard", hoveredNav === "/dashboard")}
              onMouseEnter={() => setHoveredNav("/dashboard")}
              onMouseLeave={() => setHoveredNav(null)}
            >
              <i className="bi bi-grid" style={{ fontSize: "16px" }}></i>
              <span>Dashboard</span>
            </Link>
          </li>

          {/* Member collapsible */}
          <li>
            <div
              onClick={() => setMemberOpen(!memberOpen)}
              onMouseEnter={() => setHoveredNav("member")}
              onMouseLeave={() => setHoveredNav(null)}
              style={collapsibleHeaderStyle("member", hoveredNav === "member")}
            >
              <i className="bi bi-menu-button-wide" style={{ fontSize: "16px" }}></i>
              <span>Member</span>
              <i className="bi bi-chevron-down" style={{
                marginLeft: "auto", fontSize: "12px",
                transform: memberOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }} />
            </div>
            <div style={{ maxHeight: memberOpen ? "300px" : "0", overflow: "hidden", transition: "max-height 0.25s ease" }}>
              <ul style={{ listStyle: "none", padding: "2px 4px", margin: 0 }}>
                {[
                  { path: "/admin/pi1",  label: "Personal Information" },
                  { path: "/admin/mgi2", label: "KYC Form" },
                  { path: "/admin/mbi3", label: "Member Banking Information" },
                  { path: "/admin/ni4",  label: "Nominee Form" },
                  { path: "/admin/edit", label: "Edit Your Details" },
                ].map(({ path, label }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      style={subLinkStyle(path, hoveredSub === path)}
                      onMouseEnter={() => setHoveredSub(path)}
                      onMouseLeave={() => setHoveredSub(null)}
                    >
                      <i className="bi bi-circle" style={{ fontSize: "7px" }}></i>
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>

          {/* Other nav links */}
          {[
            { path: "/admin/thrift",       label: "Thrift Funds",  icon: "bi-piggy-bank" },
            { path: "/admin/share",        label: "Shares",        icon: "bi-bar-chart-line" },
            { path: "/admin/loan",         label: "Loan",          icon: "bi-cash-stack" },
            { path: "/admin/report",       label: "Reports",       icon: "bi-file-earmark-bar-graph" },
            { path: "/admin/admin-update", label: "Admin Updates", icon: "bi-shield-check" },
          ].map(({ path, label, icon }) => (
            <li key={path}>
              <Link
                to={path}
                onClick={() => isMobile && setSidebarOpen(false)}
                style={navLinkStyle(path, hoveredNav === path)}
                onMouseEnter={() => setHoveredNav(path)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                <i className={`bi ${icon}`} style={{ fontSize: "16px" }}></i>
                <span>{label}</span>
              </Link>
            </li>
          ))}

          {/* Interest Rate collapsible */}
          <li>
            <div
              onClick={() => setInterestOpen(!interestOpen)}
              onMouseEnter={() => setHoveredNav("interest")}
              onMouseLeave={() => setHoveredNav(null)}
              style={collapsibleHeaderStyle("interest", hoveredNav === "interest")}
            >
              <i className="bi bi-percent" style={{ fontSize: "16px" }}></i>
              <span>Interest Rate</span>
              <i className="bi bi-chevron-down" style={{
                marginLeft: "auto", fontSize: "12px",
                transform: interestOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }} />
            </div>
            <div style={{ maxHeight: interestOpen ? "200px" : "0", overflow: "hidden", transition: "max-height 0.25s ease" }}>
              <ul style={{ listStyle: "none", padding: "2px 4px", margin: 0 }}>
                {[
                  { path: "/admin/thrift-fund-interest", label: "Thrift Fund Interest Rate" },
                  { path: "/admin/share-interest",       label: "Share Interest Rate" },
                  { path: "/admin/loan-interest",        label: "Loan Interest Rate" },
                ].map(({ path, label }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      style={subLinkStyle(path, hoveredSub === path)}
                      onMouseEnter={() => setHoveredSub(path)}
                      onMouseLeave={() => setHoveredSub(null)}
                    >
                      <i className="bi bi-circle" style={{ fontSize: "7px" }}></i>
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>

        </ul>

        {/* Drag handle */}
        {!isMobile && (
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            title="Drag to resize"
            style={{
              position: "absolute", top: 0, right: 0, bottom: 0,
              width: "6px", cursor: "col-resize",
              background: "transparent",
              zIndex: 10,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(65,84,241,0.18)"; }}
            onMouseLeave={(e) => { if (!dragging.current) e.currentTarget.style.background = "transparent"; }}
          />
        )}
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main style={{
        marginTop: "64px",
        marginLeft: sidebarOpen && !isMobile ? `${effectiveSidebarWidth}px` : "0px",
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#f6f9ff",
        padding: isMobile ? "14px" : isTablet ? "18px" : "24px",
        transition: dragging.current ? "none" : "margin-left 0.28s ease",
        boxSizing: "border-box",
      }}>
        <Outlet />
      </main>

    </div>
  );
}