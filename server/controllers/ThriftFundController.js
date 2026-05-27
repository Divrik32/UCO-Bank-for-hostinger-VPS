const InterestRate = require("../models/InterestRate.js");
const ThriftFundEntry = require("../models/ThriftFundEntry.js");
const ThriftFundWithdrawal = require("../models/ThriftFundWithdrawal.js");
const PersonalInformation = require("../models/PersonalInformation.js");

const getCurrentBalance = async (memberId) => {
  const entries = await ThriftFundEntry.find({ memberId });
  const withdrawals = await ThriftFundWithdrawal.find({
    memberId,
  });

  const totalCredit = entries.reduce(
    (sum, item) => sum + item.totalAmountReceived,
    0
  );

  const totalDebit = withdrawals.reduce(
    (sum, item) => sum + item.withdrawalAmount,
    0
  );

  return totalCredit - totalDebit;
};

// ================= CREATE ENTRY =================
const createThriftEntry = async (req, res) => {
  try {
    const {
      memberId,
      totalAmountReceived,
      paymentMethod,
      transactionId,
      chequeNumber,
      receivedBy,
    } = req.body;

    if (transactionId?.trim()) {
      const existingEntry =
        await ThriftFundEntry.findOne({
          transactionId,
        });

      if (existingEntry) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID already exists",
        });
      }
    }

    const interestData = await InterestRate.findOne();
    const rate = interestData ? interestData.rate : 7;

    const yearlyInterestAmount =
      (totalAmountReceived * rate) / 100;

    const currentBalance =
      await getCurrentBalance(memberId);

    const newBalance =
      currentBalance + Number(totalAmountReceived);

    const entry = await ThriftFundEntry.create({
      memberId,
      totalAmountReceived,
      paymentMethod,
      transactionId: transactionId?.trim() || undefined,
      chequeNumber,
      receivedBy,
      yearlyInterestAmount,
      availableBalance: currentBalance,
      remainingBalance: newBalance,
    });

    return res.status(201).json({
      success: true,
      message: "Entry created successfully",
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= CREATE WITHDRAWAL =================
const createThriftWithdrawal = async (req, res) => {
  try {
    const {
      memberId,
      withdrawalAmount,
      paymentMethod,
      transactionId,
      chequeNumber,
      approvedBy,
    } = req.body;

    if (transactionId?.trim()) {
      const existingWithdrawal =
        await ThriftFundWithdrawal.findOne({
          transactionId,
        });

      if (existingWithdrawal) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID already exists",
        });
      }
    }

    const currentBalance =
      await getCurrentBalance(memberId);

    if (withdrawalAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const remainingBalance =
      currentBalance - Number(withdrawalAmount);

    const withdrawal =
      await ThriftFundWithdrawal.create({
        memberId,
        withdrawalAmount,
        paymentMethod,
        transactionId: transactionId?.trim() || undefined,
        chequeNumber,
        approvedBy,
        availableBalance: currentBalance,
        remainingBalance,
      });

    return res.status(201).json({
      success: true,
      message: "Withdrawal successful",
      data: withdrawal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTotalTransactionDetails = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Get interest rate
    const interestData = await InterestRate.findOne();
    const rate = interestData ? interestData.rate : 7;

    // Fetch all entries
    const entries = await ThriftFundEntry.find({ memberId });

    // Fetch all withdrawals
    const withdrawals = await ThriftFundWithdrawal.find({
      memberId,
    });

    // Format entries as CREDIT
    const creditTransactions = entries.map((item) => ({
      amount: item.totalAmountReceived,
      type: "Credit",
      date: item.entryDate,
      interest:
        (item.totalAmountReceived * rate * 1) / 1200,
      transactionId: item.transactionId,
    }));

    // Format withdrawals as DEBIT
    const debitTransactions = withdrawals.map((item) => ({
      amount: item.withdrawalAmount,
      type: "Debit",
      date: item.withdrawalDate,
      interest: "",
      transactionId: item.transactionId,
    }));

    // Merge + sort by date
    const allTransactions = [
      ...creditTransactions,
      ...debitTransactions,
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Add serial number
    const formattedData = allTransactions.map(
      (item, index) => ({
        serial: index + 1,
        ...item,
      })
    );

    return res.status(200).json({
      success: true,
      totalTransactions: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMemberByMemberId = async (req, res) => {
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

const getAvailableBalance = async (req, res) => {
  try {
    const { memberId } = req.params;

    const availableBalance =
      await getCurrentBalance(memberId);

    return res.status(200).json({
      success: true,
      memberId,
      availableBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createThriftEntry,
  createThriftWithdrawal,
  getTotalTransactionDetails,
  getMemberByMemberId,
  getAvailableBalance
};