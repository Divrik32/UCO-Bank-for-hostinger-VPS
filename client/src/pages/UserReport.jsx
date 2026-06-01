import { useState } from "react";

export default function UserReport() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const Card = ({ id, href, img, title, desc }) => (
    <a href={href} style={styles.cardLink}>
      <div
        style={{
          ...styles.card,
          ...(hoveredCard === id ? styles.cardHover : {}),
        }}
        onMouseEnter={() => setHoveredCard(id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <img src={img} alt={title} style={styles.cardImg} />
        <h5 style={styles.cardTitle}>{title}</h5>
        <p style={styles.cardText}>{desc}</p>
      </div>
    </a>
  );

  return (
    <div style={styles.body}>
      {/* Page Title Row */}
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.pageTitle}>Financial Report of Users</h1>
          <nav style={styles.breadcrumb}>
            <a href="/index" style={styles.breadcrumbLink}>Home</a>
            <span style={styles.breadcrumbSep}>/</span>
            <span style={styles.breadcrumbActive}>Financial Report</span>
          </nav>
        </div>
        <div style={styles.addressBox}>
          <p style={styles.addressText}>
            <strong>Regd. 203, Hari Om Commercial Complex</strong>
            <br />
            New Dak Bunglow Road, Patna-800001
          </p>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div style={styles.gridWrapper}>
      <div style={styles.grid}>

        {/* Left Column - 2 cards stacked */}
        <div style={styles.column}>
          <Card
            id="member"
            href="/user/member_approval_list"
            img="/assets/img/team.png"
            title="Member Report"
            desc="This Report provides you information about members."
          />
          <Card
            id="thrift"
            href="/Thrift_Fund_report"
            img="/assets/img/save-money.png"
            title="Thrift Fund Report"
            desc="This Report provides you information about Thrift Fund."
          />
        </div>

        {/* Middle Column - 1 card vertically centered */}
        {/* <div style={{ ...styles.column, ...styles.middleColumn }}>
          <Card
            id="business"
            href="/business"
            img="/assets/img/report.png"
            title="Business Report"
            desc="This Report provides you information about Business Report."
          />
        </div> */}

        {/* Right Column - 2 cards stacked */}
        <div style={styles.column}>
          <Card
            id="loan"
            href="/Loan_Report"
            img="/assets/img/loan.png"
            title="Loan Report"
            desc="This Report provides you information about Loan."
          />
          <Card
            id="shares"
            href="/Shares_Report"
            img="/assets/img/market-share.png"
            title="Shares Report"
            desc="This Report provides you information about Shares."
          />
        </div>

      </div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    margin: 0,
    padding: "24px",
    minHeight: "100vh",
    background: "ghostwhite",
    fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
  },

  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "32px",
    gap: "16px",
  },
  pageTitle: {
    fontSize: "1.6rem",
    fontWeight: "600",
    color: "rgb(74, 72, 72)",
    margin: "0 0 8px 0",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.9rem",
  },
  breadcrumbLink: {
    color: "#cc0000",
    textDecoration: "none",
  },
  breadcrumbSep: {
    color: "gray",
  },
  breadcrumbActive: {
    color: "gray",
  },
  addressBox: {
    textAlign: "right",
  },
  addressText: {
    fontSize: "0.85rem",
    color: "rgb(74, 72, 72)",
    lineHeight: "1.6",
    margin: 0,
  },

gridWrapper: {
  display: "flex",
  justifyContent: "center",
  width: "100%",
},

grid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  width: "100%",
  maxWidth: "900px",
},

  column: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },

  middleColumn: {
    alignSelf: "center",
    justifyContent: "center",
  },

  cardLink: {
    textDecoration: "none",
    color: "black",
  },

  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    padding: "28px 20px",
    cursor: "pointer",
    transition: "all 0.25s ease",
    border: "1.5px solid #f0f0f0",
    minHeight: "200px",
  },

  cardHover: {
    backgroundColor: "#fff5f5",
    boxShadow: "0 6px 20px rgba(204, 0, 0, 0.15)",
    border: "1.5px solid #cc0000",
    transform: "translateY(-4px)",
  },

  cardImg: {
    width: "90px",
    height: "90px",
    objectFit: "contain",
    marginBottom: "16px",
  },

  cardTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "rgb(74, 72, 72)",
    margin: "0 0 8px 0",
  },

  cardText: {
    fontSize: "0.85rem",
    fontWeight: "300",
    color: "gray",
    margin: 0,
    lineHeight: "1.5",
  },
};