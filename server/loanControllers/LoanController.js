const PersonalInformation = require("../models/PersonalInformation.js");
const officialEntryModel = require("../loanModels/officialEntryModel.js");
const guaranteerMemberDetailsModel = require("../loanModels/guaranteerMemberDetailsModel.js");
const loanPaymentForEmiDetailsModel = require("../loanModels/loanPaymentForEmiDetailsModel.js");
const loanAdjustmentModel = require("../loanModels/loanAdjustmentModel.js");
const puppeteer = require("puppeteer");

const generateTransactionId = async () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let id;

  do {
    id = "";

    // 3 uppercase letters
    for (let i = 0; i < 3; i++) {
      id += letters[Math.floor(Math.random() * letters.length)];
    }

    // 2 numbers
    for (let i = 0; i < 2; i++) {
      id += numbers[Math.floor(Math.random() * numbers.length)];
    }

    // Check whether this ID already exists
    const exists =
      await officialEntryModel.exists({ transactionId: id }) ||
      await loanPaymentForEmiDetailsModel.exists({ transactionId: id }) ||
      await loanAdjustmentModel.exists({ transactionId: id });

    if (!exists) {
      return id;
    }

  } while (true);
};

const escapeHtml = (value) => {
  if (value === undefined || value === null) {
    return "-";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date)
    .toLocaleDateString("en-GB")
    .replace(/\//g, "-");
};

exports.getMemberByMemberId = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await PersonalInformation.findOne({
      memberId: memberId.trim(),
    }).select(
      "firstname lastname email phoneno profile_image signature_image memberId"
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return res.status(200).json({
      success: true,
      data: {
        memberId: member.memberId,
        name: `${member.firstname} ${member.lastname}`,
        email: member.email,
        phoneNumber: member.phoneno,

        profileImage: member.profile_image
          ? `${baseUrl}/${member.profile_image.replace(/\\/g, "/")}`
          : "",

        signatureImage: member.signature_image
          ? `${baseUrl}/${member.signature_image.replace(/\\/g, "/")}`
          : "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.createOfficialEntry = async (req, res) => {
  try {
    const { memberId } = req.params;

    const {
      officeName,
      loanType,
      loanAmount,
      tenureMonths,
      monthlyInterest,
      processingFees = 0,
      paymentMode
    } = req.body;

    // EMI factors by tenure
    const emiFactors = {
      84: 16.86,
      96: 15.44,
      108: 14.35,
      120: 13.49,
      132: 12.8,
      144: 12.24,
      156: 11.78,
      168: 11.38,
      180: 11.05
    };

    const factor = emiFactors[tenureMonths];

    if (!factor) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenure months"
      });
    }

    // EMI calculation
    const emiAmount = Number(
      ((loanAmount * factor) / 1000).toFixed(2)
    );

    // Loan code generation
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const prefix = `LN${year}${month}`;

    const lastLoan = await officialEntryModel
      .findOne({
        loanCode: { $regex: `^${prefix}` }
      })
      .sort({ createdAt: -1 });

    let serial = "0001";

    if (lastLoan) {
      const lastSerial = parseInt(lastLoan.loanCode.slice(-4));
      serial = String(lastSerial + 1).padStart(4, "0");
    }

    const loanCode = `${prefix}${serial}`;
    const transactionId = await generateTransactionId();

    const data = await officialEntryModel.create({
      memberId,
      loanCode,
      officeName,
      loanType,
      loanAmount,
      tenureMonths,
      emiAmount,
      monthlyInterest,
      processingFees,
      paymentMode,
      transactionId
    });

    res.status(201).json({
      success: true,
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createGuaranteerMemberDetails = async (req, res) => {
  try {
    const { memberId } = req.params;

    // latest loan code from official entry
    const latestLoan = await officialEntryModel
      .findOne({ memberId })
      .sort({ createdAt: -1 });

    if (!latestLoan) {
      return res.status(404).json({
        success: false,
        message: "Official loan entry not found"
      });
    }

    const data = await guaranteerMemberDetailsModel.create({
      loanCode: latestLoan.loanCode,
      memberId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createLoanPaymentForEmiDetails = async (req, res) => {
  try {
    const { memberId } = req.params;
    const {
      paymentMode,
      amount
    } = req.body;

    // latest loan code for this member
    const latestLoan = await officialEntryModel
      .findOne({ memberId })
      .sort({ createdAt: -1 });

    if (!latestLoan) {
      return res.status(404).json({
        success: false,
        message: "Official loan entry not found"
      });
    }

    const transactionId = await generateTransactionId();
    const data = await loanPaymentForEmiDetailsModel.create({
      memberId,
      loanCode: latestLoan.loanCode,
      paymentMode,
      amount,
      transactionId
    });

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createLoanAdjustment = async (req, res) => {
  try {
    const { memberId } = req.params;

    const {
      paymentMode,
      adjustmentAmount,
      chequeNumber = ""
    } = req.body;

    // latest loan code for this member
    const latestLoan = await officialEntryModel
      .findOne({ memberId })
      .sort({ createdAt: -1 });

    if (!latestLoan) {
      return res.status(404).json({
        success: false,
        message: "Official loan entry not found"
      });
    }
    const transactionId = await generateTransactionId();
    const data = await loanAdjustmentModel.create({
      memberId,
      loanCode: latestLoan.loanCode,
      paymentMode,
      adjustmentAmount,
      chequeNumber,
      transactionId
    });

    res.status(201).json({
      success: true,
      data
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getOfficialEntry = async (req, res) => {
  try {
    const { memberId } = req.params;

    const data = await officialEntryModel
      .findOne({ memberId })
      .sort({ createdAt: -1 });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Official entry not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getGuaranteerMemberDetails = async (req, res) => {
  try {
    const { memberId } = req.params;

    const latestLoan = await officialEntryModel
      .findOne({ memberId })
      .sort({ createdAt: -1 });

    if (!latestLoan) {
      return res.status(404).json({
        success: false,
        message: "Official loan entry not found"
      });
    }

    const data = await guaranteerMemberDetailsModel.find({
      memberId,
      loanCode: latestLoan.loanCode
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLoanPaymentForEmiDetails = async (req, res) => {
  try {
    const { memberId } = req.params;

    const latestLoan = await officialEntryModel
      .findOne({ memberId })
      .sort({ createdAt: -1 });

    if (!latestLoan) {
      return res.status(404).json({
        success: false,
        message: "Official loan entry not found"
      });
    }

    const data = await loanPaymentForEmiDetailsModel.find({
      memberId,
      loanCode: latestLoan.loanCode
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLoanAdjustment = async (req, res) => {
  try {
    const { memberId } = req.params;

    const latestLoan = await officialEntryModel
      .findOne({ memberId })
      .sort({ createdAt: -1 });

    if (!latestLoan) {
      return res.status(404).json({
        success: false,
        message: "Official loan entry not found"
      });
    }

    const data = await loanAdjustmentModel.find({
      memberId,
      loanCode: latestLoan.loanCode
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTotalTransactionDetails = async (req, res) => {
  try {
    const { memberId } = req.params;

    // 1. Official Entry
    const officialEntries = await officialEntryModel.find({ memberId });

    // 2. EMI Payment
    const emiPayments = await loanPaymentForEmiDetailsModel.find({
      memberId,
    });

    // 3. Loan Adjustment
    const loanAdjustments = await loanAdjustmentModel.find({
      memberId,
    });

    // Official Entry → CREDIT
    const officialData = officialEntries.map((item) => ({
      amount: item.loanAmount,
      paymentMode: "-",
      transactionDate: item.createdAt,
      interest: "Included in EMI",
      type: "CREDIT",
    }));

    // EMI Payment → DEBIT
    const emiData = emiPayments.map((item) => ({
      amount: item.amount,
      paymentMode: item.paymentMode,
      transactionDate: item.createdAt,
      interest: "Included in EMI",
      type: "DEBIT",
    }));

    // Loan Adjustment → DEBIT
    const adjustmentData = loanAdjustments.map((item) => ({
      amount: item.adjustmentAmount,
      paymentMode: item.paymentMode,
      transactionDate: item.createdAt,
      interest: "Included in EMI",
      type: "DEBIT",
    }));

    // Merge + sort by date
    const allTransactions = [
      ...officialData,
      ...emiData,
      ...adjustmentData,
    ].sort(
      (a, b) =>
        new Date(a.transactionDate) -
        new Date(b.transactionDate)
    );

    res.status(200).json({
      success: true,
      count: allTransactions.length,
      data: allTransactions,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTotalEmiPaid = async (req, res) => {
  try {
    const { memberId } = req.params;

    const payments = await loanPaymentForEmiDetailsModel.find({ memberId });

    const totalPaid = payments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      memberId,
      totalPaid
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAvailableBalance = async (req, res) => {
  try {
    const { memberId } = req.params;

    const loans = await officialEntryModel.find({ memberId });
    const payments = await loanPaymentForEmiDetailsModel.find({ memberId });

    const totalLoanAmount = loans.reduce(
      (sum, item) => sum + Number(item.loanAmount || 0),
      0
    );

    const totalPaid = payments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const availableBalance = totalLoanAmount - totalPaid;

    return res.status(200).json({
      success: true,
      memberId,
      totalLoanAmount,
      totalPaid,
      availableBalance
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllLoanReports = async (req, res) => {
  try {
    const members = await PersonalInformation.find({
      approval_status: "approved",
    }).sort({ memberId: 1 });

    const reports = [];

    for (const member of members) {
      const loans = await officialEntryModel
        .find({
          memberId: member.memberId,
        })
        .sort({ createdAt: 1 });

      // ==========================================
      // Member has NO loan
      // ==========================================
      if (loans.length === 0) {
        reports.push({
          memberCode: member.memberId,

          membershipNumber:
            member.membershipNumber || "-",

          memberName:
            `${member.firstname} ${member.lastname}`,

          firstLoanDate: "-",

          totalLoanAmount: 0,

          interest: "None",

          paymentMode: "-",

          transactionId: "-",
        });
      }

      // ==========================================
      // Member has loan
      // ==========================================
      else {
        const totalLoanAmount = loans.reduce(
          (sum, loan) =>
            sum + Number(loan.loanAmount || 0),
          0
        );

        const firstLoan = loans[0];

        reports.push({
          memberCode: member.memberId,

          membershipNumber:
            member.membershipNumber || "-",

          memberName:
            `${member.firstname} ${member.lastname}`,

          firstLoanDate:
            firstLoan.createdAt
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-"),

          totalLoanAmount,

          interest: "None",

          paymentMode:
            firstLoan.paymentMode || "-",

          transactionId:
            firstLoan.transactionId || "-",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: reports,
    });

  } catch (error) {
    console.error(
      "Get all loan reports error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPaymentModes = async (req, res) => {
  try {
    const paymentModes = officialEntryModel.schema.path("paymentMode").enumValues;

    res.status(200).json({
      success: true,
      data: paymentModes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.memberLoanDetailsById = async (req, res) => {
  try {
    const { memberId } = req.params;

    // ================================
    // 1. Get Member Personal Information
    // ================================
    const member = await PersonalInformation.findOne({
      memberId: memberId,
      approval_status: "approved",
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // ================================
    // 2. Get Member's All Loans
    // ================================
    const loans = await officialEntryModel
      .find({
        memberId: memberId,
      })
      .sort({ createdAt: 1 });

    // ================================
    // 3. Calculate Loan Information
    // ================================
    let firstLoanDate = "-";
    let totalLoanAmount = 0;
    let paymentMode = "-";
    let transactionId = "-";

    if (loans.length > 0) {
      const firstLoan = loans[0];

      // First Loan Date
      firstLoanDate = firstLoan.createdAt
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");

      // Total Loan Amount
      totalLoanAmount = loans.reduce(
        (sum, loan) => sum + Number(loan.loanAmount || 0),
        0
      );

      // First Loan Payment Details
      paymentMode = firstLoan.paymentMode || "-";
      transactionId = firstLoan.transactionId || "-";
    }

    // ================================
    // 4. Response
    // ================================
    res.status(200).json({
      success: true,
      data: {
        // ===== Member Information =====
        memberId: member.memberId,

        firstname: member.firstname,
        lastname: member.lastname,

        dob: member.dob,
        age: member.age,

        gender: member.gender,
        status: member.status,

        guardian_firstname: member.guardian_firstname,
        guardian_relation: member.guardian_relation,

        phoneno: member.phoneno,
        email: member.email,

        address_line1: member.address_line1,
        address_line2: member.address_line2,

        state: member.state,
        pincode: member.pincode,

        pf_no: member.pf_no,

        // ===== Loan Information =====
        firstLoanDate,
        totalLoanAmount,
        paymentMode,
        transactionId,
      },
    });
  } catch (error) {
    console.error("Member loan details error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.printMemberLoanDetails = async (req, res) => {
  try {
    const { memberId } = req.params;

    // ==========================================
    // 1. Get Member Personal Information
    // SAME QUERY AS YOUR EXISTING API
    // ==========================================
    const member = await PersonalInformation.findOne({
      memberId: memberId,
      approval_status: "approved",
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // ==========================================
    // 2. Get Member's All Loans
    // SAME QUERY AS YOUR EXISTING API
    // ==========================================
    const loans = await officialEntryModel
      .find({
        memberId: memberId,
      })
      .sort({ createdAt: 1 });

    // ==========================================
    // 3. Calculate Loan Information
    // SAME LOGIC AS YOUR EXISTING API
    // ==========================================
    let firstLoanDate = "-";
    let totalLoanAmount = 0;
    let paymentMode = "-";
    let transactionId = "-";

    if (loans.length > 0) {
      const firstLoan = loans[0];

      firstLoanDate = firstLoan.createdAt
        ? firstLoan.createdAt
            .toLocaleDateString("en-GB")
            .replace(/\//g, "-")
        : "-";

      totalLoanAmount = loans.reduce(
        (sum, loan) =>
          sum + Number(loan.loanAmount || 0),
        0
      );

      paymentMode = firstLoan.paymentMode || "-";
      transactionId = firstLoan.transactionId || "-";
    }

    // ==========================================
    // 4. Helper
    // ==========================================
    const valueOrDash = (value) => {
      return value !== undefined &&
        value !== null &&
        value !== ""
        ? value
        : "-";
    };

    const formatDate = (date) => {
      if (!date) return "-";

      return new Date(date)
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");
    };

    // ==========================================
    // 5. HTML FOR PDF
    // ONLY MEMBER + LOAN DETAILS
    // ==========================================
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            background: white;
            color: #333;
          }

          .container {
            width: 100%;
            padding: 20px;
          }

          .title {
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            color: #012970;
            margin-bottom: 25px;
          }

          .card {
            border: 1px solid #dee2e6;
            border-radius: 6px;
            margin-bottom: 22px;
            overflow: hidden;
          }

          .card-title {
            margin: 0;
            padding: 12px 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;

            font-size: 17px;
            font-weight: 700;
            color: #012970;
          }

          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .detail-item {
            display: grid;
            grid-template-columns: 45% 55%;

            min-height: 45px;

            border-right: 1px solid #dee2e6;
            border-bottom: 1px solid #dee2e6;
          }

          .detail-item:nth-child(even) {
            border-right: none;
          }

          .label {
            padding: 10px 12px;
            background: #f8f9fa;

            font-size: 13px;
            font-weight: 600;
            color: #444;
          }

          .value {
            padding: 10px 12px;

            font-size: 13px;
            color: #333;

            word-break: break-word;
          }

          .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 11px;
            color: #777;
          }

          @page {
            size: A4;
            margin: 15mm;
          }

        </style>
      </head>

      <body>

        <div class="container">

          <div class="title">
            Loan Report Details
          </div>

          <!-- ================= MEMBER INFORMATION ================= -->

          <div class="card">

            <h2 class="card-title">
              Member Information
            </h2>

            <div class="details-grid">

              <div class="detail-item">
                <div class="label">Member Code</div>
                <div class="value">
                  ${valueOrDash(member.memberId)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Member Name</div>
                <div class="value">
                  ${valueOrDash(member.firstname)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Last Name</div>
                <div class="value">
                  ${valueOrDash(member.lastname)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Member D.O.B</div>
                <div class="value">
                  ${formatDate(member.dob)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Age</div>
                <div class="value">
                  ${valueOrDash(member.age)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Gender</div>
                <div class="value">
                  ${valueOrDash(member.gender)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Status</div>
                <div class="value">
                  ${valueOrDash(member.status)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Guardian Name</div>
                <div class="value">
                  ${valueOrDash(member.guardian_firstname)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Guardian Relation</div>
                <div class="value">
                  ${valueOrDash(member.guardian_relation)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Phone</div>
                <div class="value">
                  ${valueOrDash(member.phoneno)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Email Id</div>
                <div class="value">
                  ${valueOrDash(member.email)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">House/Flat No.</div>
                <div class="value">
                  ${valueOrDash(member.address_line1)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Street No./Area</div>
                <div class="value">
                  ${valueOrDash(member.address_line2)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">State</div>
                <div class="value">
                  ${valueOrDash(member.state)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Pincode</div>
                <div class="value">
                  ${valueOrDash(member.pincode)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">PF No</div>
                <div class="value">
                  ${valueOrDash(member.pf_no)}
                </div>
              </div>

            </div>
          </div>


          <!-- ================= LOAN INFORMATION ================= -->

          <div class="card">

            <h2 class="card-title">
              Loan Information
            </h2>

            <div class="details-grid">

              <div class="detail-item">
                <div class="label">First Loan Date</div>
                <div class="value">
                  ${valueOrDash(firstLoanDate)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Total Loan Amount</div>
                <div class="value">
                  ₹${Number(totalLoanAmount).toLocaleString("en-IN")}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Payment Mode</div>
                <div class="value">
                  ${valueOrDash(paymentMode)}
                </div>
              </div>

              <div class="detail-item">
                <div class="label">Transaction ID</div>
                <div class="value">
                  ${valueOrDash(transactionId)}
                </div>
              </div>

            </div>

          </div>


          <div class="footer">
            Loan Report
          </div>

        </div>

      </body>
      </html>
    `;

    // ==========================================
    // 6. CREATE PDF USING PUPPETEER
    // ==========================================

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

const pdf = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: {
    top: "15mm",
    right: "15mm",
    bottom: "15mm",
    left: "15mm",
  },
});

await browser.close();

// ==========================================
// 7. SHOW PDF IN BROWSER
// ==========================================

res.set({
  "Content-Type": "application/pdf",
  "Content-Disposition": `inline; filename="loan-report-${memberId}.pdf"`,
  "Content-Length": pdf.length,
});

res.send(pdf);

  } catch (error) {
    console.error(
      "Member loan PDF error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Reusable Loan Report Data Helper
// ==========================================

const getLoanReportData = async () => {
  const members = await PersonalInformation.find({
    approval_status: "approved",
  }).sort({ memberId: 1 });

  const reports = [];

  for (const member of members) {
    const loans = await officialEntryModel
      .find({
        memberId: member.memberId,
      })
      .sort({ createdAt: 1 });

    if (loans.length === 0) {
      reports.push({
        memberCode: member.memberId,
        memberName: `${member.firstname} ${member.lastname}`,
        firstLoanDate: "-",
        totalLoanAmount: 0,
        interest: "None",
        paymentMode: "-",
        transactionId: "-",
      });
    } else {
      const totalLoanAmount = loans.reduce(
        (sum, loan) =>
          sum + Number(loan.loanAmount || 0),
        0
      );

      const firstLoan = loans[0];

      reports.push({
        memberCode: member.memberId,

        memberName:
          `${member.firstname} ${member.lastname}`,

        firstLoanDate: firstLoan.createdAt
          ? firstLoan.createdAt
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "-",

        totalLoanAmount,

        interest: "None",

        paymentMode:
          firstLoan.paymentMode || "-",

        transactionId:
          firstLoan.transactionId || "-",
      });
    }
  }

  return reports;
};

exports.loanReportPDF = async (req, res) => {
  let browser;

  try {

    // ==========================================
    // 1. Get Loan Report Data
    // ==========================================

    const reports = await getLoanReportData();


    // ==========================================
    // 2. Generate Table HTML
    // ==========================================

    const rows = reports.map((report, index) => {

      return `
        <tr>

          <td>${index + 1}</td>

          <td>
            ${report.memberCode || "-"}
          </td>

          <td>
            ${report.memberName || "-"}
          </td>

          <td>
            ${report.firstLoanDate || "-"}
          </td>

          <td>
            ₹${Number(
              report.totalLoanAmount || 0
            ).toLocaleString("en-IN")}
          </td>

          <td>
            ${report.interest || "-"}
          </td>

          <td>
            ${report.paymentMode || "-"}
          </td>

          <td>
            ${report.transactionId || "-"}
          </td>

        </tr>
      `;
    }).join("");


    // ==========================================
    // 3. Full HTML
    // ==========================================

    const html = `

      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <title>
          Loan Report
        </title>

        <style>

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            margin: 0;
            padding: 20px;

            color: #333;
          }

          .header {
            text-align: center;

            margin-bottom: 20px;
          }

          .title {
            font-size: 22px;
            font-weight: 700;

            color: #012970;

            margin-bottom: 8px;
          }

          .address {
            font-size: 13px;

            line-height: 1.5;
          }

          table {
            width: 100%;

            border-collapse:
              collapse;

            font-size: 11px;
          }

          th,
          td {
            border:
              1px solid #dee2e6;

            padding: 8px;

            text-align: center;
          }

          th {
            background: #f8f9fa;

            font-weight: 600;
          }

          @page {
            size: A4 landscape;

            margin: 12mm;
          }

        </style>

      </head>


      <body>

        <div class="header">

          <div class="title">
            Loan Report
          </div>

          <div class="address">

            <strong>
              Regd. 203, Hari Om Commercial Complex
            </strong>

            <br />

            New Dak Bunglow Road,
            Patna-800001

          </div>

        </div>


        <table>

          <thead>

            <tr>

              <th>
                Sl.
              </th>

              <th>
                Member Code
              </th>

              <th>
                Member Name
              </th>

              <th>
                First Loan Date
              </th>

              <th>
                Total Loan Amount
              </th>

              <th>
                Interest
              </th>

              <th>
                Payment Mode
              </th>

              <th>
                Transaction ID
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              rows ||
              `
                <tr>
                  <td colspan="8">
                    No loan report found.
                  </td>
                </tr>
              `
            }

          </tbody>

        </table>

      </body>

      </html>

    `;


    // ==========================================
    // 4. Launch Puppeteer
    // ==========================================

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });


    const page =
      await browser.newPage();


    // ==========================================
    // 5. Load HTML
    // ==========================================

    await page.setContent(
      html,
      {
        waitUntil: "networkidle0",
      }
    );


    // ==========================================
    // 6. Generate PDF
    // ==========================================

    const pdf =
      await page.pdf({

        format: "A4",

        landscape: true,

        printBackground: true,

        margin: {
          top: "12mm",
          right: "12mm",
          bottom: "12mm",
          left: "12mm",
        },

      });


    // ==========================================
    // 7. Send PDF
    // ==========================================

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'inline; filename="loan-report.pdf"'
    );

    res.end(pdf);


  } catch (error) {

    console.error(
      "Loan report PDF error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate loan report PDF",
    });

  } finally {

    if (browser) {
      await browser.close();
    }

  }
};