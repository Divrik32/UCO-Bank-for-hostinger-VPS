import React from "react";

const shares = [
  { userid: "2023080018", shares: "None" },
  { userid: "2023080001", shares: "None" },
  { userid: "2023080003", shares: "None" },
  { userid: "2023080004", shares: "None" },
  { userid: "2023080005", shares: "None" },
];

export default function ShareApproval() {
  return (
    <>
      <style>{`
        .share-main {
          padding: 10px 30px;
          font-family: "Open Sans", sans-serif;
          background: #f6f9ff;
          min-height: 100vh;
          color: #444444;
        }
        .share-main .pagetitle h1 {
          font-size: 24px;
          margin-bottom: 0;
          font-weight: 600;
          color: #012970;
          font-family: "Nunito", sans-serif;
        }
        .share-main .breadcrumb {
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
        .share-main .breadcrumb-item + .breadcrumb-item::before {
          content: "/";
          padding: 0 6px;
          color: #899bbd;
        }
        .share-main .breadcrumb-item a {
          color: #899bbd;
          text-decoration: none;
          transition: 0.3s;
        }
        .share-main .breadcrumb-item a:hover {
          color: #51678f;
        }
        .share-main .breadcrumb-item.active {
          color: #51678f;
          font-weight: 600;
        }
        .share-main .top-address {
          text-align: end;
          font-size: 14px;
          color: #333;
        }
        .share-main .card {
          margin-bottom: 30px;
          border: none;
          border-radius: 5px;
          box-shadow: 0px 0 30px rgba(1, 41, 112, 0.1);
          background: #fff;
        }
        .share-main .card-body {
          padding: 0 20px 20px 20px;
          overflow-x: auto;
        }
        .share-main .card-title {
          padding: 20px 0 15px 0;
          font-size: 18px;
          font-weight: 500;
          color: #012970;
          font-family: "Poppins", sans-serif;
        }
        .share-main table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
          font-size: 14px;
        }
        .share-main table th,
        .share-main table td {
          border: 1px solid #dee2e6;
          padding: 10px 12px;
          vertical-align: middle;
        }
        .share-main table thead th {
          font-weight: 600;
          color: #333;
        }
        .share-main .btn-view {
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
        .share-main .btn-view:hover {
          background: #198754;
          color: #fff;
        }
        @media (max-width: 1199px) {
          .share-main { padding: 20px; }
        }
        @media (max-width: 450px) {
          .share-main .top-address { display: none; }
        }
      `}</style>

      <main id="main" className="share-main">
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: "16px" }}>
          <div style={{ flex: "0 0 66.66%", maxWidth: "66.66%" }}>
            <div className="pagetitle" style={{ marginBottom: "10px" }}>
              <h1 style={{textAlign:"start"}}>Share Approval</h1>
              <nav>
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="/index">Home</a></li>
                  <li className="breadcrumb-item"><a href="/admin_update">Admin Update</a></li>
                  <li className="breadcrumb-item active">Share Approval</li>
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

        <section className="section">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Share Approval</h5>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Member Id</th>
                    <th scope="col">Shares</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((item) => (
                    <tr key={item.userid}>
                      <td>{item.userid}</td>
                      <td>{item.shares}</td>
                      <td>
                        <a
                          className="btn-view"
                          href={`/share_approval/${item.userid}`}
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