const express = require("express");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware.js");

const {
  registerUser,
  loginUser,
  submitMemberForm,
  getApprovalPendingMembers,
  getMemberById,
  logoutUser,
  sendForgotOtp,
  resetPassword
} = require("../controllers/UserController.js");

const router = express.Router();


// ================= MULTER =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      "-" +
      file.fieldname +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


// ================= AUTH ROUTES (PUBLIC) =================
router.post("/register", upload.single("image"), registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);


// ================= MULTI FILE UPLOAD =================
const multiUpload = upload.fields([
  { name: "profile_image", maxCount: 1 },
  { name: "signature_image", maxCount: 1 },
  { name: "doc1File", maxCount: 1 },
  { name: "doc2File", maxCount: 1 },
]);

// ================= PROTECTED ROUTES =================
router.post(
  "/submit-member-form",
  authMiddleware,
  multiUpload,
  submitMemberForm
);
router.get("/approval-pending-members", getApprovalPendingMembers);
router.get("/members/:id", getMemberById);

router.post("/forgot-password", sendForgotOtp);
router.post("/reset-password", resetPassword);

module.exports = router;