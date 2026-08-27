const express = require("express");
const router = express.Router();
const { createThriftWithdrawal, createThriftEntry, getTotalTransactionDetails, getMemberByMemberId, getAvailableBalance, getMemberThriftTransactions, getThriftPaymentMethods, memberThriftDetailsById, printMemberThriftDetails, printThriftFundReport, getTotalThriftInterest } = require("../controllers/ThriftFundController.js");
const { updateInterestRate, getInterestRate } = require("../controllers/interestController.js");

router.get("/payment-methods", getThriftPaymentMethods);
router.get("/interest-rate", getInterestRate);
router.put("/update-interest", updateInterestRate);
router.post("/thrift-entry", createThriftEntry);
router.post("/thrift-withdrawal", createThriftWithdrawal);
router.get("/transaction/:memberId", getTotalTransactionDetails);
router.get("/member/:memberId", getMemberByMemberId);
router.get("/available-balance/:memberId",getAvailableBalance);
router.get("/member-thrift-transactions", getMemberThriftTransactions);
router.get("/member-thrift-details/:memberId", memberThriftDetailsById);
router.get("/member-thrift-details-pdf/:memberId", printMemberThriftDetails);
router.get("/thrift-fund-report-pdf", printThriftFundReport);
router.get("/total-thrift-interest/:memberId", getTotalThriftInterest);

module.exports = router;