import React from "react";

const loans = [
  { userid: "2023070001", loanAmount: 1000 },
  { userid: "2023070001", loanAmount: 1000 },
  { userid: "2023070008", loanAmount: 450000 },
  { userid: "2023080018", loanAmount: 451045 },
  { userid: "2023080001", loanAmount: 1519413 },
  { userid: "2023080003", loanAmount: 388671 },
  { userid: "2023080004", loanAmount: 321892 },
  { userid: "2023080005", loanAmount: 553830 },
  { userid: "2023080006", loanAmount: 273676 },
];

export default function LoanApproval() {
  return (
    <>
      <style>{`
        .loan-main {
          padding: 10px 30px;
          font-family: "Open Sans", sans-serif;
          background: #f6f9ff;
          min-height: 100vh;
          color: #444444;
        }
        .loan-main .pagetitle h1 {
          font-size: 24px;
          margin-bottom: 0;
          font-weight: 600;
          color: #012970;
          font-family: "Nunito", sans-serif;
        }
        .loan-main .breadcrumb {
          font-size: 14px;
          font-family: "Nunito", sans-serif;
          color: #899bbd;
          font-weight: 600;
          list-style: none;
          display: flex;
          gap: 0;
          padding: 0;
          margin: 0;
          flex-wrap: wrap;
        }
        .loan-main .breadcrumb-item + .breadcrumb-item::before {
          content: "/";
          padding: 0 6px;
          color: #899bbd;
        }
        .loan-main .breadcrumb-item a {
          color: #899bbd;
          text-decoration: none;
          transition: 0.3s;
        }
        .loan-main .breadcrumb-item a:hover {
          color: #51678f;
        }
        .loan-main .breadcrumb-item.active {
          color: #51678f;
          font-weight: 600;
        }
        .loan-main .top-address {
          text-align: end;
          font-size: 14px;
          color: #333;
        }
        .loan-main .card {
          margin-bottom: 30px;
          border: none;
          border-radius: 5px;
          box-shadow: 0px 0 30px rgba(1, 41, 112, 0.1);
          background: #fff;
        }
        .loan-main .card-body {
          padding: 0 20px 20px 20px;
          overflow-x: auto;
        }
        .loan-main .card-title {
          padding: 20px 0 15px 0;
          font-size: 18px;
          font-weight: 500;
          color: #012970;
          font-family: "Poppins", sans-serif;
        }
        .loan-main table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
          font-size: 14px;
        }
        .loan-main table th,
        .loan-main table td {
          border: 1px solid #dee2e6;
          padding: 10px 12px;
          vertical-align: middle;
        }
        .loan-main table thead th {
          font-weight: 600;
          color: #333;
        }
        .loan-main .btn-view {
          display: inline-block;
          border: 1.5px solid #198754;
          color: #198754;
          background: transparent;
          border-radius: 4px;
          padding: 5px 14px;
          font-size: 13px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, color 0.2s;
        }
        .loan-main .btn-view:hover {
          background: #198754;
          color: #fff;
        }
        @media (max-width: 1199px) {
          .loan-main { padding: 20px; }
        }
        @media (max-width: 450px) {
          .loan-main .top-address { display: none; }
        }
      `}</style>

      <main id="main" className="loan-main">
        {/* Top row */}
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: "16px" }}>
          <div style={{ flex: "0 0 66.66%", maxWidth: "66.66%" }}>
            <div className="pagetitle" style={{ marginBottom: "10px" }}>
              <h1 style={{textAlign:"start"}}>Loan Approval</h1>
              <nav>
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="/index">Home</a></li>
                  <li className="breadcrumb-item"><a href="/admin_update">Admin Update</a></li>
                  <li className="breadcrumb-item active">Loan Approval</li>
                </ol>
              </nav>
            </div>
          </div>
          <div style={{ flex: "0 0 33.33%", maxWidth: "33.33%" }}>
            <div className="top-address">
              <p>
                <b>Regd. 203, Hari Om Commercial Complex</b>
                <br />
                New Dak Bunglow Road, Patna-800001
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <section className="section">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Loan Approval</h5>
              <table>
                <thead>
                  <tr>
                    <th>Member Id</th>
                    <th>Loan Amount(₹)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, idx) => (
                    <tr key={idx}>
                      <td>{loan.userid}</td>
                      <td>{loan.loanAmount}</td>
                      <td>
                        <a
                          className="btn-view"
                          href={`/loan_approval/${loan.userid}`}
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}