const ThriftFundEntry = require("../models/ThriftFundEntry");
const ThriftFundWithdrawal = require("../models/ThriftFundWithdrawal");

const CreditShare = require("../models/CreditShare");
const DebitShare = require("../models/DebitShare");
const officialEntryModel = require("../loanModels/officialEntryModel");


// =====================================================
// 1. Get Total Loan
// =====================================================
const getMemberTotalLoan = async (memberId) => {
  const loans = await officialEntryModel.find({
    memberId,
  });

  const totalLoanAmount = loans.reduce(
    (sum, loan) => sum + Number(loan.loanAmount || 0),
    0
  );

  return totalLoanAmount;
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