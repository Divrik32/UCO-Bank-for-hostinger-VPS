const PersonalInformation = require("../models/PersonalInformation.js");
const officialEntryModel = require("../loanModels/officialEntryModel.js");
const guaranteerMemberDetailsModel = require("../loanModels/guaranteerMemberDetailsModel.js");
const loanPaymentForEmiDetailsModel = require("../loanModels/loanPaymentForEmiDetailsModel.js");
const loanAdjustmentModel = require("../loanModels/loanAdjustmentModel.js");
const LoanInterest = require("../loanModels/loanInterest.js");
const puppeteer = require("puppeteer");
const loanInterest = require("../loanModels/loanInterest.js");


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
      interestDays,
      interestAmount,
      paymentMode,
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
      180: 11.05,
    };

    const factor = emiFactors[tenureMonths];

    if (!factor) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenure months",
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
        loanCode: { $regex: `^${prefix}` },
      })
      .sort({ createdAt: -1 });

    let serial = "0001";

    if (lastLoan) {
      const lastSerial = parseInt(lastLoan.loanCode.slice(-4));
      serial = String(lastSerial + 1).padStart(4, "0");
    }

    const loanCode = `${prefix}${serial}`;

    // Generate transaction ID
    const transactionId = await generateTransactionId();

    // Create Official Entry
    const data = await officialEntryModel.create({
      memberId,
      loanCode,
      officeName,
      loanType,
      loanAmount,
      tenureMonths,
      emiAmount,
      monthlyInterest,
      interestDays,
      interestAmount,
      paymentMode,
      transactionId,
    });

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
      thriftAdjustmentAmount,
      shareAdjustmentAmount,
      chequeNumber = "",
    } = req.body;

    // ─────────────────────────────────────────
    // Validate Payment Mode
    // ─────────────────────────────────────────

    const allowedPaymentModes = [
      "Amount given by Member",
      "Amount given from thrift A/C",
      "Amount given from Share A/C",
      "Both",
    ];

    if (!allowedPaymentModes.includes(paymentMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment mode",
      });
    }

    // ─────────────────────────────────────────
    // Validate Amounts
    // ─────────────────────────────────────────

    if (paymentMode === "Both") {
      // Both হলে normal adjustmentAmount লাগবে না
      if (
        (!thriftAdjustmentAmount || Number(thriftAdjustmentAmount) <= 0) &&
        (!shareAdjustmentAmount || Number(shareAdjustmentAmount) <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter thrift or share adjustment amount",
        });
      }
    } else {
      // Member / Thrift / Share হলে adjustmentAmount required
      if (!adjustmentAmount || Number(adjustmentAmount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Adjustment amount is required",
        });
      }
    }

    // ─────────────────────────────────────────
    // Latest loan code for this member
    // ─────────────────────────────────────────

    const latestLoan = await officialEntryModel
      .findOne({ memberId })
      .sort({ createdAt: -1 });

    if (!latestLoan) {
      return res.status(404).json({
        success: false,
        message: "Official loan entry not found",
      });
    }

    // ─────────────────────────────────────────
    // Generate transaction ID
    // ─────────────────────────────────────────

    const transactionId = await generateTransactionId();

    // ─────────────────────────────────────────
    // Create Loan Adjustment
    // ─────────────────────────────────────────

    const data = await loanAdjustmentModel.create({
      memberId,
      loanCode: latestLoan.loanCode,
      paymentMode,

      // Used for Member / Thrift / Share
      adjustmentAmount:
        paymentMode !== "Both"
          ? Number(adjustmentAmount)
          : undefined,

      // Used only for Both
      thriftAdjustmentAmount:
        paymentMode === "Both"
          ? Number(thriftAdjustmentAmount || 0)
          : undefined,

      shareAdjustmentAmount:
        paymentMode === "Both"
          ? Number(shareAdjustmentAmount || 0)
          : undefined,

      chequeNumber,
      transactionId,
    });

    res.status(201).json({
      success: true,
      data,
    });

  } catch (error) {
    // Duplicate transaction ID
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
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
    const loanAdjustments = await loanAdjustmentModel.find({ memberId });

    // ─────────────────────────────────────────────
    // Get all interest rate history
    // ─────────────────────────────────────────────
    const interestRates = await loanInterest
      .find({})
      .sort({ createdAt: 1 })
      .lean();

    console.log("INTEREST RATES:", interestRates);

    // ─────────────────────────────────────────────
    // Find interest rate applicable at transaction date
    // ─────────────────────────────────────────────
    const getInterestRateAtDate = (transactionDate) => {
      if (!transactionDate || interestRates.length === 0) {
        return null;
      }

      const transactionTime = new Date(transactionDate).getTime();

      let applicableRate = null;

      for (const rate of interestRates) {
        const rateTime = new Date(rate.createdAt).getTime();

        if (rateTime <= transactionTime) {
          applicableRate = rate;
        } else {
          break;
        }
      }

      // If no rate existed before transaction date,
      // use first available rate
      if (!applicableRate) {
        return interestRates[0].rate;
      }

      return applicableRate.rate;
    };

    // ─────────────────────────────────────────────
    // Official Entry → DEBIT
    // ─────────────────────────────────────────────
    const officialData = officialEntries.map((item) => ({
      amount: Number(item.loanAmount || 0),
      paymentMode: "-",
      transactionDate: item.createdAt,
      interest: "Included in EMI",
      interestRate: getInterestRateAtDate(item.createdAt),
      type: "DEBIT",
    }));

    // ─────────────────────────────────────────────
    // EMI Payment → CREDIT
    // ─────────────────────────────────────────────
    const emiData = emiPayments.map((item) => ({
      amount: Number(item.amount || 0),
      paymentMode: item.paymentMode,
      transactionDate: item.createdAt,
      interest: "Included in EMI",
      interestRate: getInterestRateAtDate(item.createdAt),
      type: "CREDIT",
    }));

    // ─────────────────────────────────────────────
    // Loan Adjustment → CREDIT
    // ─────────────────────────────────────────────
    const adjustmentData = loanAdjustments.map((item) => ({
      amount: Number(item.adjustmentAmount || 0),
      paymentMode: item.paymentMode,
      transactionDate: item.createdAt,
      interest: "Included in EMI",
      interestRate: getInterestRateAtDate(item.createdAt),
      type: "CREDIT",
    }));

    // ─────────────────────────────────────────────
    // Merge + sort by transaction date
    // ─────────────────────────────────────────────
const allTransactions = [
  ...officialData,
  ...emiData,
  ...adjustmentData,
].sort(
  (a, b) =>
    new Date(a.transactionDate) -
    new Date(b.transactionDate)
);


    // ─────────────────────────────────────────────
    // Calculate running balance
    // ─────────────────────────────────────────────
    let balance = 0;

const transactionsWithBalance = allTransactions.map((transaction) => {
  const amount = Number(transaction.amount || 0);

  if (transaction.type === "DEBIT") {
    balance += amount;
  } else if (transaction.type === "CREDIT") {
    balance -= amount;
  }

  return {
    ...transaction,
    balance,
  };
});

    // ─────────────────────────────────────────────
    // Response
    // ─────────────────────────────────────────────
res.status(200).json({
  success: true,
  count: transactionsWithBalance.length,
  data: transactionsWithBalance,
});
  } catch (error) {
    console.error("getTotalTransactionDetails error:", error);

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
    const adjustments = await loanAdjustmentModel.find({ memberId });

    const totalLoanAmount = loans.reduce(
      (sum, item) => sum + Number(item.loanAmount || 0),
      0
    );

    const totalPaid = payments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalAdjustment = adjustments.reduce((sum, item) => {
      if (item.paymentMode === "Both") {
        return (
          sum +
          Number(item.thriftAdjustmentAmount || 0) +
          Number(item.shareAdjustmentAmount || 0)
        );
      }

      return sum + Number(item.adjustmentAmount || 0);
    }, 0);

    const availableBalance =
      totalLoanAmount - totalPaid - totalAdjustment;

    return res.status(200).json({
      success: true,
      memberId,
      totalLoanAmount,
      totalPaid,
      totalAdjustment,
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

      firstLoanDate = firstLoan.createdAt
        ? firstLoan.createdAt
            .toLocaleDateString("en-GB")
            .replace(/\//g, "-")
        : "-";

      totalLoanAmount = loans.reduce(
        (sum, loan) => sum + Number(loan.loanAmount || 0),
        0
      );

      paymentMode = firstLoan.paymentMode || "-";
      transactionId = firstLoan.transactionId || "-";
    }

    // =====================================================
    // 4. GET LOAN ADJUSTMENTS
    // =====================================================
    const loanAdjustments = await loanAdjustmentModel.find({
      memberId,
      paymentMode: {
        $in: [
          "Amount given from thrift A/C",
          "Amount given from Share A/C",
          "Both",
        ],
      },
    });

    // =====================================================
    // 5. CALCULATE THRIFT & SHARE LOAN PAYMENT
    // =====================================================
    let thriftLoanPaid = 0;
    let shareLoanPaid = 0;

    loanAdjustments.forEach((item) => {
      if (item.paymentMode === "Amount given from thrift A/C") {
        thriftLoanPaid += Number(item.adjustmentAmount || 0);
      }

      if (item.paymentMode === "Amount given from Share A/C") {
        shareLoanPaid += Number(item.adjustmentAmount || 0);
      }

      if (item.paymentMode === "Both") {
        thriftLoanPaid += Number(
          item.thriftAdjustmentAmount || 0
        );

        shareLoanPaid += Number(
          item.shareAdjustmentAmount || 0
        );
      }
    });

    // ================================
    // 6. Response
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

        // ===== Loan Adjustment Information =====
        thriftLoanPaid,
        shareLoanPaid,
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
// 4. GET LOAN ADJUSTMENTS
// ==========================================
const loanAdjustments = await loanAdjustmentModel.find({
  memberId,
  paymentMode: {
    $in: [
      "Amount given from thrift A/C",
      "Amount given from Share A/C",
      "Both",
    ],
  },
});

// ==========================================
// 5. CALCULATE THRIFT & SHARE LOAN PAYMENT
// ==========================================
let thriftLoanPaid = 0;
let shareLoanPaid = 0;

loanAdjustments.forEach((item) => {
  if (item.paymentMode === "Amount given from thrift A/C") {
    thriftLoanPaid += Number(item.adjustmentAmount || 0);
  }

  if (item.paymentMode === "Amount given from Share A/C") {
    shareLoanPaid += Number(item.adjustmentAmount || 0);
  }

  if (item.paymentMode === "Both") {
    thriftLoanPaid += Number(
      item.thriftAdjustmentAmount || 0
    );

    shareLoanPaid += Number(
      item.shareAdjustmentAmount || 0
    );
  }
});

    // ==========================================
    // 4. Helper
    // ==========================================
// ==========================================
// 4. GET ALL TRANSACTIONS
// ==========================================

const officialEntries = await officialEntryModel
  .find({ memberId })
  .sort({ createdAt: 1 })
  .lean();

const emiPayments = await loanPaymentForEmiDetailsModel
  .find({ memberId })
  .sort({ createdAt: 1 })
  .lean();

const allLoanAdjustments = await loanAdjustmentModel
  .find({ memberId })
  .sort({ createdAt: 1 })
  .lean();

// ==========================================
// GET INTEREST RATE HISTORY
// ==========================================

const interestRates = await LoanInterest
  .find({})
  .sort({ createdAt: 1 })
  .lean();

// ==========================================
// FIND INTEREST RATE AT TRANSACTION DATE
// ==========================================

const getInterestRateAtDate = (transactionDate) => {
  if (!transactionDate || interestRates.length === 0) {
    return null;
  }

  const transactionTime = new Date(transactionDate).getTime();

  let applicableRate = null;

  for (const rate of interestRates) {
    const rateTime = new Date(rate.createdAt).getTime();

    if (rateTime <= transactionTime) {
      applicableRate = rate;
    } else {
      break;
    }
  }

  if (!applicableRate) {
    return Number(interestRates[0].rate || 0);
  }

  return Number(applicableRate.rate || 0);
};

// ==========================================
// OFFICIAL ENTRY → DEBIT
// ==========================================

const officialTransactionData = officialEntries.map((item) => ({
  amount: Number(item.loanAmount || 0),

  paymentMode: item.paymentMode || "-",

  transactionId: item.transactionId || "-",

  transactionDate: item.createdAt,

  interestRate: getInterestRateAtDate(item.createdAt),

  type: "DEBIT",
}));

// ==========================================
// EMI PAYMENT → CREDIT
// ==========================================

const emiTransactionData = emiPayments.map((item) => ({
  amount: Number(item.amount || 0),

  paymentMode: item.paymentMode || "-",

  transactionId: item.transactionId || "-",

  transactionDate: item.createdAt,

  interestRate: getInterestRateAtDate(item.createdAt),

  type: "CREDIT",
}));

// ==========================================
// LOAN ADJUSTMENT → CREDIT
// ==========================================

const adjustmentTransactionData = allLoanAdjustments.map((item) => {

  let amount = 0;

  if (item.paymentMode === "Both") {
    amount =
      Number(item.thriftAdjustmentAmount || 0) +
      Number(item.shareAdjustmentAmount || 0);
  } else {
    amount = Number(item.adjustmentAmount || 0);
  }

  return {
    amount,

    paymentMode: item.paymentMode || "-",

    transactionId: item.transactionId || "-",

    transactionDate: item.createdAt,

    interestRate: getInterestRateAtDate(item.createdAt),

    type: "CREDIT",
  };
});

// ==========================================
// MERGE ALL TRANSACTIONS
// ==========================================

const allTransactions = [
  ...officialTransactionData,
  ...emiTransactionData,
  ...adjustmentTransactionData,
].sort(
  (a, b) =>
    new Date(a.transactionDate) -
    new Date(b.transactionDate)
);

// ==========================================
// CALCULATE BALANCE + INTEREST
// ==========================================

let runningBalance = 0;
let runningInterestBalance = 0;

const transactionsWithBalance = allTransactions.map(
  (item, index) => {

    const amount = Number(item.amount || 0);

    const currentDate = new Date(item.transactionDate);

    // ========================================
    // NO OF DAYS
    // ========================================

    let noOfDays = "-";

    if (index < allTransactions.length - 1) {

      const nextItem = allTransactions[index + 1];

      const nextDate = new Date(
        nextItem.transactionDate
      );

      const diffTime =
        nextDate.getTime() -
        currentDate.getTime();

      const diffDays = Math.floor(
        diffTime /
          (1000 * 60 * 60 * 24)
      );

      noOfDays = Math.max(
        diffDays - 1,
        0
      );
    }

    // ========================================
    // DEBIT → ADD TO BALANCE
    // ========================================

    if (item.type === "DEBIT") {
      runningBalance += amount;
    }

    // ========================================
    // INTEREST CHARGE
    // ========================================

    let interestCharge = 0;

    if (noOfDays !== "-") {

      interestCharge =
        (
          runningBalance *
          Number(item.interestRate || 0) *
          Number(noOfDays || 0)
        ) / 36500;
    }

    runningInterestBalance += interestCharge;

    // ========================================
    // CREDIT → FIRST PAY INTEREST
    // THEN MAIN BALANCE
    // ========================================

    if (item.type === "CREDIT") {

      if (
        amount <=
        runningInterestBalance
      ) {

        runningInterestBalance -= amount;

      } else {

        const remainingCredit =
          amount -
          runningInterestBalance;

        runningInterestBalance = 0;

        runningBalance = Math.max(
          runningBalance -
            remainingCredit,
          0
        );
      }
    }

    // ========================================
    // PRODUCT
    // ========================================

    const product =
      noOfDays !== "-"
        ? runningBalance * Number(noOfDays)
        : 0;

    return {
      ...item,

      balance: runningBalance,

      noOfDays,

      product,

      interestCharge,

      interestBalance:
        runningInterestBalance,
    };
  }
);

// ==========================================
// HELPER
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

const formatDateTime = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }
  );
};

const formatAmount = (amount) => {
  return Number(amount || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
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

/* ==========================================
   TRANSACTION TABLE
   ========================================== */

.transaction-card {
  width: 100%;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 22px;
  overflow: hidden;
}

.transaction-table-wrapper {
  width: 100%;
  overflow: hidden;
}

.transaction-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 9px;
}

.transaction-table th,
.transaction-table td {
  padding: 7px 6px;
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid #dee2e6;
  border-right: 1px solid #dee2e6;
  line-height: 1.25;
  word-break: normal;
  overflow-wrap: break-word;
}

.transaction-table th:last-child,
.transaction-table td:last-child {
  border-right: none;
}

.transaction-table th {
  background: #f8f9fa;
  color: #012970;
  font-weight: 700;
  white-space: normal;
}

.transaction-table td {
  color: #222;
}

/* Individual column widths */

.transaction-table th:nth-child(1),
.transaction-table td:nth-child(1) {
  width: 4%;
}

.transaction-table th:nth-child(2),
.transaction-table td:nth-child(2) {
  width: 12%;
}

.transaction-table th:nth-child(3),
.transaction-table td:nth-child(3) {
  width: 14%;
}

.transaction-table th:nth-child(4),
.transaction-table td:nth-child(4) {
  width: 9%;
}

.transaction-table th:nth-child(5),
.transaction-table td:nth-child(5) {
  width: 9%;
}

.transaction-table th:nth-child(6),
.transaction-table td:nth-child(6) {
  width: 10%;
}

.transaction-table th:nth-child(7),
.transaction-table td:nth-child(7) {
  width: 7%;
}

.transaction-table th:nth-child(8),
.transaction-table td:nth-child(8) {
  width: 8%;
}

.transaction-table th:nth-child(9),
.transaction-table td:nth-child(9) {
  width: 9%;
}

.transaction-table th:nth-child(10),
.transaction-table td:nth-child(10) {
  width: 9%;
}

.transaction-table th:nth-child(11),
.transaction-table td:nth-child(11) {
  width: 9%;
}

/* Date */
.date-cell {
  white-space: normal;
}

/* Particulars */
.particular-cell {
  text-align: left !important;
}

/* Amount columns */
.debit-cell,
.credit-cell {
  white-space: nowrap;
}

/* Empty row */
.empty-cell {
  text-align: center !important;
  padding: 15px !important;
}

/* ==========================================
   PDF PAGE
   ========================================== */

@page {
  size: A4 landscape;
  margin: 10mm;
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
    ${valueOrDash(
      `${member.firstname || ""} ${member.lastname || ""}`.trim()
    )} 
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

              <div class="detail-item">
  <div class="label">
    Loan Paid from Thrift A/C
  </div>
  <div class="value">
    ₹${Number(thriftLoanPaid).toLocaleString("en-IN")}
  </div>
</div>

<div class="detail-item">
  <div class="label">
    Loan Paid from Share A/C
  </div>
  <div class="value">
    ₹${Number(shareLoanPaid).toLocaleString("en-IN")}
  </div>
</div>

            </div>

          </div>


          <!-- ========================================== -->
          <!-- TOTAL TRANSACTION DETAILS -->
          <!-- ========================================== -->

          <div class="transaction-card">

            <h2 class="card-title">
              Total Transaction Details
            </h2>

            <div class="transaction-table-wrapper">

              <table class="transaction-table">

                <thead>

                  <tr>

                    <th>Sl No</th>

                    <th>
                      Transaction Date
                    </th>

                    <th>
                      Particulars
                    </th>

                    <th>
                      Debit
                    </th>

                    <th>
                      Credit
                    </th>

                    <th>
                      Balance
                    </th>

                    <th>
                      No of Days
                    </th>

                    <th>
                      Interest Rate
                    </th>

                    <th>
                      Product
                    </th>

                    <th>
                      Interest Charge
                    </th>

                    <th>
                      Interest Balance
                    </th>

                  </tr>

                </thead>

                <tbody>

                  ${
                    transactionsWithBalance.length > 0
                      ? transactionsWithBalance
                          .map((item, index) => {

                            return `
                              <tr>

                                <td>
                                  ${index + 1}
                                </td>

                                <td class="date-cell">
                                  ${formatDateTime(
                                    item.transactionDate
                                  )}
                                </td>

                                <td class="particular-cell">
                                  ${valueOrDash(
                                    item.paymentMode
                                  )}
                                </td>

                                <td class="debit-cell">
                                  ${
                                    item.type === "DEBIT"
                                      ? `₹${formatAmount(
                                          item.amount
                                        )}`
                                      : "-"
                                  }
                                </td>

                                <td class="credit-cell">
                                  ${
                                    item.type === "CREDIT"
                                      ? `₹${formatAmount(
                                          item.amount
                                        )}`
                                      : "-"
                                  }
                                </td>

                                <td>
                                  ₹${formatAmount(
                                    item.balance
                                  )}
                                </td>

                                <td>
                                  ${valueOrDash(
                                    item.noOfDays
                                  )}
                                </td>

                                <td>
                                  ${
                                    item.interestRate !==
                                      undefined &&
                                    item.interestRate !==
                                      null &&
                                    item.interestRate !==
                                      ""
                                      ? `${Number(
                                          item.interestRate
                                        ).toFixed(2)}%`
                                      : "-"
                                  }
                                </td>

                                <td>
                                  ${
                                    item.noOfDays !== "-"
                                      ? `₹${formatAmount(
                                          item.product
                                        )}`
                                      : "-"
                                  }
                                </td>

                                <td>
                                  ₹${formatAmount(
                                    item.interestCharge
                                  )}
                                </td>

                                <td>
                                  ₹${formatAmount(
                                    item.interestBalance
                                  )}
                                </td>

                              </tr>
                            `;
                          })
                          .join("")
                      : `
                        <tr>

                          <td
                            colspan="11"
                            class="empty-cell"
                          >
                            No transaction found.
                          </td>

                        </tr>
                      `
                  }

                </tbody>

              </table>

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
  landscape: true,
  printBackground: true,
  margin: {
    top: "10mm",
    right: "10mm",
    bottom: "10mm",
    left: "10mm",
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

// 👉 GET Total Loan Interest
exports.getTotalLoanInterest = async (req, res) => {
  try {
    const { memberId } = req.params;

    // 1️⃣ Get current loan interest rate
    let interest = await LoanInterest.findOne();

    // DB te interest na thakle default create
    if (!interest) {
      interest = await LoanInterest.create({
        rate: 10.5,
        updatedBy: "system",
        remarks: "Default interest rate",
      });
    }

    const loanInterest = Number(interest.rate || 0);

    // 2️⃣ Get all loan related data
    const loans = await officialEntryModel.find({ memberId });
    const payments = await loanPaymentForEmiDetailsModel.find({ memberId });
    const adjustments = await loanAdjustmentModel.find({ memberId });

    // 3️⃣ Total loan amount
    const totalLoanAmount = loans.reduce(
      (sum, item) => sum + Number(item.loanAmount || 0),
      0
    );

    // 4️⃣ Total paid amount
    const totalPaid = payments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    // 5️⃣ Total adjustment
    const totalAdjustment = adjustments.reduce((sum, item) => {
      if (item.paymentMode === "Both") {
        return (
          sum +
          Number(item.thriftAdjustmentAmount || 0) +
          Number(item.shareAdjustmentAmount || 0)
        );
      }

      return sum + Number(item.adjustmentAmount || 0);
    }, 0);

    // 6️⃣ Available balance
    const availableBalance =
      totalLoanAmount - totalPaid - totalAdjustment;

    // 7️⃣ Calculate total loan interest
    // Formula:
    // (balance * 30 * loanInterest) / 36500
    const totalLoanInterest =
      (availableBalance * 30 * loanInterest) / 36500;

    return res.status(200).json({
      success: true,
      memberId,

      totalLoanAmount,
      totalPaid,
      totalAdjustment,
      availableBalance,

      loanInterest,
      totalLoanInterest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};