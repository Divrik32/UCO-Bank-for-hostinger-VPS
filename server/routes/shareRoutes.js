const express = require("express");
const router = express.Router();

const {
  getShareInterest,
  updateShareInterest,
  createCreditShare,
  getAllCreditShare,
  createDebitShare,
  getAllDebitShare,
  getShareAvailableBalance,
  saveOfficialDetails,
  getOfficialDetails,
  getMemberByMemberId
} = require("../controllers/ShareController.js");

/* ================= SHARE INTEREST ================= */
router.get("/share-interest", getShareInterest);
router.put("/share-interest", updateShareInterest);

/* ================= CREDIT SHARE ================= */
router.post("/credit-share", createCreditShare);
router.get("/credit-share/:memberId", getAllCreditShare);

/* ================= DEBIT SHARE ================= */
router.post("/debit-share", createDebitShare);
router.get("/debit-share/:memberId", getAllDebitShare);


router.get(
 "/share-balance/:memberId",
 getShareAvailableBalance
);

router.post(
 "/official-details",
 saveOfficialDetails
);

router.get(
 "/official-details/:memberId",
 getOfficialDetails
);

router.get(
 "/member/:memberId",
 getMemberByMemberId
);

module.exports = router;