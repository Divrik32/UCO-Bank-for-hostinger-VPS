const express = require("express");
const router = express.Router();

const {
  getLoanInterest,
  updateLoanInterest
} = require("../loanControllers/loanInterestController");

const {
  getMemberByMemberId,
  createOfficialEntry,
  createGuaranteerMemberDetails,
  createLoanPaymentForEmiDetails,
  createLoanAdjustment,
  getOfficialEntry,
  getGuaranteerMemberDetails,
  getLoanPaymentForEmiDetails,
  getLoanAdjustment,
  getTotalTransactionDetails,
  getTotalEmiPaid,
  getAvailableBalance
} = require("../loanControllers/loanController");

// loan interest routes
router.get("/interest-rate", getLoanInterest);
router.put("/interest-rate", updateLoanInterest);

// member info
router.get("/member/:memberId", getMemberByMemberId);

// official entry
router.post("/official-entry/:memberId", createOfficialEntry);
router.get("/official-entry/:memberId", getOfficialEntry);

// guarantor
router.post("/guaranteer/:memberId", createGuaranteerMemberDetails);
router.get("/guaranteer/:memberId", getGuaranteerMemberDetails);

// EMI payment
router.post("/emi-payment/:memberId", createLoanPaymentForEmiDetails);
router.get("/emi-payment/:memberId", getLoanPaymentForEmiDetails);

// loan adjustment
router.post("/loan-adjustment/:memberId", createLoanAdjustment);
router.get("/loan-adjustment/:memberId", getLoanAdjustment);

// transaction (merged data)
router.get("/transactions/:memberId", getTotalTransactionDetails);

// total EMI paid
router.get("/emi-total/:memberId", getTotalEmiPaid);

// available balance
router.get("/available-balance/:memberId", getAvailableBalance);

module.exports = router;