const ThriftFundEntry = require("../models/ThriftFundEntry");
const ThriftFundWithdrawal = require("../models/ThriftFundWithdrawal");

const CreditShare = require("../models/CreditShare");
const DebitShare = require("../models/DebitShare");
const officialEntryModel = require("../loanModels/officialEntryModel");
const loanPaymentForEmiDetailsModel = require("../loanModels/loanPaymentForEmiDetailsModel.js");
const loanAdjustmentModel = require("../loanModels/loanAdjustmentModel.js");
const LoanInterest = require("../loanModels/loanInterest.js");

// =====================================================
// 1. Get Total Loan
// =====================================================

// =====================================================
// 1. Get Total Loan — Same Running Balance As Loan.jsx
// =====================================================

const getMemberTotalLoan = async (memberId) => {
  // ==========================================
  // 1. Fetch All 3 Transaction Sources
  // ==========================================
  const [
    officialEntries,
    emiPayments,
    loanAdjustments,
    interestRates,
  ] = await Promise.all([
    officialEntryModel.find({ memberId }).lean(),

    loanPaymentForEmiDetailsModel.find({ memberId }).lean(),

    loanAdjustmentModel.find({ memberId }).lean(),

    LoanInterest.find({})
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  // ==========================================
  // 2. Interest Rate At Transaction Date
  // Same Logic As LoanController
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
  // 3. Official Entry -> DEBIT
  // ==========================================
  const officialData = officialEntries.map((item) => ({
    amount: Number(item.loanAmount || 0),
    transactionDate: item.transactionDate,
    interestRate: getInterestRateAtDate(item.transactionDate),
    type: "DEBIT",
  }));

  // ==========================================
  // 4. EMI Payment -> CREDIT
  // ==========================================
  const emiData = emiPayments.map((item) => ({
    amount: Number(item.amount || 0),
    transactionDate: item.transactionDate,
    interestRate: getInterestRateAtDate(item.transactionDate),
    type: "CREDIT",
  }));

  // ==========================================
  // 5. Loan Adjustment -> CREDIT
  // Both: thrift + share adjustment amount
  // Other modes: adjustmentAmount
  // ==========================================
  const adjustmentData = loanAdjustments.map((item) => {
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
      transactionDate: item.createdAt,
      interestRate: getInterestRateAtDate(item.createdAt),
      type: "CREDIT",
    };
  });

  // ==========================================
  // 6. Merge All Transactions
  // Sort By Transaction Date
  // Same Source Order As LoanController
  // ==========================================
  const allTransactions = [
    ...officialData,
    ...emiData,
    ...adjustmentData,
  ].sort(
    (a, b) =>
      new Date(a.transactionDate) -
      new Date(b.transactionDate)
  );

  // ==========================================
  // 7. Running Balance + Interest Calculation
  // Same Logic As Loan.jsx
  // ==========================================
  let runningBalance = 0;
  let runningInterestBalance = 0;

  allTransactions.forEach((item, index) => {
    const amount = Number(item.amount || 0);

    const currentDate = new Date(item.transactionDate);

    // Calculate days until the next transaction
    let noOfDays = "-";

    if (index < allTransactions.length - 1) {
      const nextItem = allTransactions[index + 1];

      const nextDate = new Date(nextItem.transactionDate);

      const diffTime =
        nextDate.getTime() - currentDate.getTime();

      const diffDays = Math.floor(
        diffTime / (1000 * 60 * 60 * 24)
      );

      noOfDays = Math.max(diffDays, 0);
    }

    // DEBIT increases the loan balance
    if (item.type === "DEBIT") {
      runningBalance += amount;
    }

    // Calculate interest
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

    // CREDIT pays interest first, then principal
    if (item.type === "CREDIT") {
      if (amount <= runningInterestBalance) {
        runningInterestBalance -= amount;
      } else {
        const remainingCredit =
          amount - runningInterestBalance;

        runningInterestBalance = 0;

        runningBalance = Math.max(
          runningBalance - remainingCredit,
          0
        );
      }
    }
  });

  // Same as transactionSummary.lastBalance in Loan.jsx
  return Math.round(runningBalance);
};

// =====================================================
// 2. Get Share Balance
// =====================================================
const getMemberShareBalance = async (memberId) => {
  const [credits, debits] = await Promise.all([
    CreditShare.find({ memberId }),
    DebitShare.find({ memberId }),
  ]);

  const totalCreditAmount = credits.reduce(
    (sum, item) =>
      sum + Number(item.investmentAmount || 0),
    0
  );

  const totalDebitAmount = debits.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );
  const shareBalance = totalCreditAmount - totalDebitAmount;
  return shareBalance;
};

// =====================================================
// 3. Get Thrift Balance
// =====================================================
const getMemberThriftBalance = async (memberId) => {
  const [entries, withdrawals] = await Promise.all([
    ThriftFundEntry.find({ memberId }),
    ThriftFundWithdrawal.find({ memberId }),
  ]);
  const totalEntryAmount = entries.reduce(
    (sum, item) =>
      sum + Number(item.totalAmountReceived || 0),
    0
  );
  const totalWithdrawalAmount = withdrawals.reduce(
    (sum, item) =>
      sum + Number(item.withdrawalAmount || 0),
    0
  );
  const thriftBalance = totalEntryAmount - totalWithdrawalAmount;
  return thriftBalance;
};

module.exports = {
  getMemberTotalLoan,
  getMemberShareBalance,
  getMemberThriftBalance,
};