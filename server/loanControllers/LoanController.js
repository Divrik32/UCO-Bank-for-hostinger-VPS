const PersonalInformation = require("../models/PersonalInformation");
const officialEntryModel = require("../loanModels/officialEntryModel");
const guaranteerMemberDetailsModel = require("../loanModels/guaranteerMemberDetailsModel");
const loanPaymentForEmiDetailsModel = require("../loanModels/loanPaymentForEmiDetailsModel");
const loanAdjustmentModel = require("../loanModels/loanAdjustmentModel");

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
      processingFees = 0
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
    const emiAmount = Number(((loanAmount * factor) / 1000).toFixed(2));

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

    const data = await officialEntryModel.create({
      memberId,
      loanCode,
      officeName,
      loanType,
      loanAmount,
      tenureMonths,
      emiAmount,
      processingFees
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
      amount,
      transactionId
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
      chequeNumber = "",
      transactionId = ""
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

    const data = await loanAdjustmentModel.create({
      memberId,
      loanCode: latestLoan.loanCode,
      paymentMode,
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

    // 1. Official Entry data (LOAN GIVEN → CREDIT)
    const officialEntries = await officialEntryModel.find({ memberId });

    // 2. EMI Payment data (LOAN PAID → DEBIT)
    const emiPayments = await loanPaymentForEmiDetailsModel.find({ memberId });

    // 3. Format Official Entries
    const officialData = officialEntries.map((item) => ({
      amount: item.loanAmount,
      paymentMode: "-",
      transactionDate: item.createdAt,
      interest: "Included in EMI",
      type: "CREDIT",   // 🔥 added
    }));

    // 4. Format EMI Payments
    const emiData = emiPayments.map((item) => ({
      amount: item.amount,
      paymentMode: item.paymentMode,
      transactionDate: item.createdAt,
      interest: "Included in EMI",
      type: "DEBIT",   // 🔥 added
    }));

    // 5. Merge + sort
    const allTransactions = [...officialData, ...emiData].sort(
      (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate)
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