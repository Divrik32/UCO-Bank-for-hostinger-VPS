import { useState, useEffect } from "react";

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

export default function AdminReport() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const cards = [
    {
      id: "member",
      href: "/admin/member_approval_list",
      img: "/assets/img/team.png",
      title: "Member Report",
      desc: "This Report provides you information about members.",
    },
    {
      id: "thrift",
      href: "/Thrift_Fund_report",
      img: "/assets/img/save-money.png",
      title: "Thrift Fund Report",
      desc: "This Report provides you information about Thrift Fund.",
    },
    {
      id: "business",
      href: "/business",
      img: "/assets/img/report.png",
      title: "Business Report",
      desc: "This Report provides you information about Business Report.",
    },
    {
      id: "loan",
      href: "/Loan_Report",
      img: "/assets/img/loan.png",
      title: "Loan Report",
      desc: "This Report provides you information about Loan.",
    },
    {
      id: "shares",
      href: "/Shares_Report",
      img: "/assets/img/market-share.png",
      title: "Shares Report",
      desc: "This Report provides you information about Shares.",
    },
  ];

  const Card = ({ id, href, img, title, desc }) => (
    <a href={href} style={{ textDecoration: "none", color: "black", display: "block" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow:
            hoveredCard === id
              ? "0 6px 20px rgba(204, 0, 0, 0.15)"
              : "0 2px 10px rgba(0,0,0,0.08)",
          padding: isMobile ? "20px 14px" : "28px 20px",
          cursor: "pointer",
          transition: "all 0.25s ease",
          border: hoveredCard === id ? "1.5px solid #cc0000" : "1.5px solid #f0f0f0",
          transform: hoveredCard === id ? "translateY(-4px)" : "none",
          backgroundColor: hoveredCard === id ? "#fff5f5" : "white",
          minHeight: isMobile ? "160px" : "200px",
          boxSizing: "border-box",
        }}
        onMouseEnter={() => setHoveredCard(id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <img
          src={img}
          alt={title}
          style={{
            width: isMobile ? "64px" : "90px",
            height: isMobile ? "64px" : "90px",
            objectFit: "contain",
            marginBottom: isMobile ? "12px" : "16px",
          }}
        />
        <h5
          style={{
            fontSize: isMobile ? "0.9rem" : "1rem",
            fontWeight: "600",
            color: "rgb(74, 72, 72)",
            margin: "0 0 8px 0",
            fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
          }}
        >
          {title}
        </h5>
        <p
          style={{
            fontSize: isMobile ? "0.78rem" : "0.85rem",
            fontWeight: "300",
            color: "gray",
            margin: 0,
            lineHeight: "1.5",
            fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
          }}
        >
          {desc}
        </p>
      </div>
    </a>
  );

  // Desktop: original 3-column layout with left/mid/right columns
  // Tablet: 2-column grid
  // Mobile: 1-column stack

  const getGridStyle = () => {
    if (isMobile) {
      return {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "16px",
      };
    }
    if (isTablet) {
      return {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "18px",
        alignItems: "start",
      };
    }
    // Desktop — original 3-col
    return {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "20px",
      alignItems: "center",
    };
  };

  return (
    <div
      style={{
        margin: 0,
        padding: isMobile ? "16px 12px" : isTablet ? "20px 18px" : "24px",
        minHeight: "100vh",
        background: "ghostwhite",
        fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* ── Page Title Row ── */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "flex-start",
          flexWrap: "wrap",
          marginBottom: isMobile ? "20px" : "32px",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isMobile ? "1.2rem" : isTablet ? "1.4rem" : "1.6rem",
              fontWeight: "600",
              color: "rgb(74, 72, 72)",
              margin: "0 0 8px 0",
              fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
            }}
          >
            Financial Report of Users
          </h1>
          <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem" }}>
            <a
              href="/index"
              style={{
                color: "#cc0000",
                textDecoration: "none",
                fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
              }}
            >
              Home
            </a>
            <span style={{ color: "gray" }}>/</span>
            <span style={{ color: "gray", fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
              Financial Report
            </span>
          </nav>
        </div>
        {!isMobile && (
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: "0.85rem",
                color: "rgb(74, 72, 72)",
                lineHeight: "1.6",
                margin: 0,
                fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
              }}
            >
              <strong>Regd. 203, Hari Om Commercial Complex</strong>
              <br />
              New Dak Bunglow Road, Patna-800001
            </p>
          </div>
        )}
      </div>

      {/* ── Card Grid ── */}
      {isMobile || isTablet ? (
        // Mobile: single column | Tablet: 2-column grid (all 5 cards flat)
        <div style={getGridStyle()}>
          {cards.map((c) => (
            <Card key={c.id} {...c} />
          ))}
        </div>
      ) : (
        // Desktop: original 3-column layout
        <div style={getGridStyle()}>
          {/* Left column — 2 cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignSelf: "stretch", justifyContent: "space-between" }}>
            <Card {...cards[0]} />
            <Card {...cards[1]} />
          </div>

          {/* Middle column — 1 card centered */}
          <div style={{ display: "flex", flexDirection: "column", alignSelf: "center", justifyContent: "center" }}>
            <Card {...cards[2]} />
          </div>

          {/* Right column — 2 cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignSelf: "stretch", justifyContent: "space-between" }}>
            <Card {...cards[3]} />
            <Card {...cards[4]} />
          </div>
        </div>
      )}
    </div>
  );
}