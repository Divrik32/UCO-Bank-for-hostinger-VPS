const express = require("express");
const router = express.Router();
const { createThriftWithdrawal, createThriftEntry, getTotalTransactionDetails, getMemberByMemberId, getAvailableBalance } = require("../controllers/ThriftFundController.js");
const { updateInterestRate, getInterestRate } = require("../controllers/interestController.js");

router.get("/interest-rate", getInterestRate);
router.put("/update-interest", updateInterestRate);
router.post("/thrift-entry", createThriftEntry);
router.post("/thrift-withdrawal", createThriftWithdrawal);
router.get("/transaction/:memberId", getTotalTransactionDetails);
router.get("/member/:memberId", getMemberByMemberId);
router.get("/available-balance/:memberId",getAvailableBalance);

module.exports = router;