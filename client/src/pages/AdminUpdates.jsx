export default function AdminUpdates() {
  const cards = [
    {
      href: "/admin/member_approval_list",
      icon: "/assets/img/team.png",
      iconFallback: "👥",
      title: "Tickets for Member approval",
    },
    {
      href: "/admin/share_approval_list",
      icon: "/assets/img/market-share.png",
      iconFallback: "📊",
      title: "Tickets for Share Approval",
    },
    {
      href: "/admin/loan_approval_list",
      icon: "/assets/img/loan.png",
      iconFallback: "📋",
      title: "Tickets For Loan Approval",
    },
    {
      href: "/admin/Global_update",
      icon: "/assets/img/world.png",
      iconFallback: "🌐",
      title: "Global Updates",
    },
  ];

  return (
    <div style={styles.page}>
      {/* Top row */}
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.pageTitle}>Admin Updates</h1>
          <nav style={styles.breadcrumb}>
            <a href="/index" style={styles.breadcrumbLink}>Home</a>
            <span style={styles.breadcrumbSep}>/</span>
            <span style={styles.breadcrumbActive}>Admin Updates</span>
          </nav>
        </div>
        <div style={styles.addressBlock}>
          <p style={styles.addressLine1}>
            <strong>Regd. 203, Hari Om Commercial Complex</strong>
          </p>
          <p style={styles.addressLine2}>New Dak Bunglow Road, Patna-800001</p>
        </div>
      </div>

      {/* 2×2 card grid */}
      <div style={styles.grid}>
        {cards.map((card) => (
          <a key={card.href} href={card.href} style={styles.cardLink}>
            <div
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 40px rgba(1,41,112,0.18)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0px 0 30px rgba(1,41,112,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <img
                src={card.icon}
                alt={card.title}
                style={styles.cardImg}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span style={{ display: "none", fontSize: "72px", lineHeight: 1 }}>
                {card.iconFallback}
              </span>
              <div style={styles.cardBody}>
                <h5 style={styles.cardTitle}>{card.title}</h5>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f6f9ff",
    padding: "20px 30px",
    fontFamily: '"Open Sans", sans-serif',
    color: "#444444",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#012970",
    fontFamily: '"Nunito", sans-serif',
    marginBottom: "4px",
  },
  breadcrumb: {
    fontSize: "13px",
    fontFamily: '"Nunito", sans-serif',
    fontWeight: "600",
    color: "#899bbd",
  },
  breadcrumbLink: {
    color: "#899bbd",
    textDecoration: "none",
    transition: "color 0.3s",
  },
  breadcrumbSep: {
    margin: "0 6px",
    color: "#899bbd",
  },
  breadcrumbActive: {
    color: "#51678f",
    fontWeight: "600",
  },
  addressBlock: {
    textAlign: "right",
  },
  addressLine1: {
    margin: 0,
    fontSize: "15px",
    color: "#333",
    fontWeight: "700",
  },
  addressLine2: {
    margin: 0,
    fontSize: "13px",
    color: "#555",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
  },
  cardLink: {
    textDecoration: "none",
    color: "black",
    display: "block",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0px 0 30px rgba(1,41,112,0.1)",
    textAlign: "center",
    padding: "24px 16px 20px",
    transition: "box-shadow 0.2s, transform 0.15s",
    cursor: "pointer",
  },
  cardImg: {
    height: "100px",
    width: "100px",
    objectFit: "contain",
    display: "block",
    margin: "0 auto 8px",
  },
  cardBody: {
    padding: "10px 0 4px",
  },
  cardTitle: {
    fontSize: "17px",
    fontWeight: "600",
    color: "#012970",
    fontFamily: '"Nunito", sans-serif',
    margin: 0,
  },
};