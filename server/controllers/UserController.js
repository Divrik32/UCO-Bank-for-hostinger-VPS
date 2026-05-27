const User = require("../models/User");
const PersonalInformation = require("../models/PersonalInformation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminLogin = require("../models/AdminLogin");
const nodemailer = require("nodemailer");

const otpStore = {};

// ================= USER REGISTER =================
const registerUser = async (req, res) => {
  try {
    const existingUser = await User.findOne({
      email: req.body.email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      image: req.file ? req.file.path : "",
      role: "user",
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= LOGIN =================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ===== COMMON COOKIE OPTIONS =====
    const isProd = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProd,                  // production এ true
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,     // 1 day
      path: "/",
    };

    // ================= ADMIN LOGIN =================
const admin = await AdminLogin.findOne({ email });

if (admin) {
  const isAdminMatch = await bcrypt.compare(password, admin.password);

  if (!isAdminMatch) {
    return res.status(400).json({
      success: false,
      message: "Invalid admin password",
    });
  }

      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: "admin",
        },
        process.env.JWT_SECRET || "mysecretkey",
        { expiresIn: "1d" }
      );

      // ✅ SET COOKIE
      res.cookie("token", token, cookieOptions);

      return res.status(200).json({
        success: true,
        token,
        message: "Admin login successful",
        role: "admin",
        user: {
          email: admin.email,
          role: "admin",
        },
      });
    }

    // ================= USER LOGIN =================
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "1d" }
    );

    // ✅ SET COOKIE
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "User login successful",
      role: user.role,
      token,
      user,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= HELP IMAGE FUNCTION =================
// const getFiles = (req) => ({
//   profile_image: req.files?.profile_image?.[0]?.path || "",
//   signature_image: req.files?.signature_image?.[0]?.path || "",
//   doc1File: req.files?.doc1File?.[0]?.path || "",
//   doc2File: req.files?.doc2File?.[0]?.path || "",
// });

// ================= FINAL MULTI STEP FORM SUBMIT =================
const submitMemberForm = async (req, res) => {
  try {
    const data = new PersonalInformation({
      // ========== PERSONAL ==========
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      dob: req.body.dob,
      age: req.body.age,
      // form_no: req.body.form_no,
      gender: req.body.gender,
      status: req.body.status,
      guardian_firstname: req.body.guardian_firstname,
      guardian_relation: req.body.guardian_relation,
      phoneno: req.body.phoneno,
      email: req.body.email,
      address_line1: req.body.address_line1,
      address_line2: req.body.address_line2,
      state: req.body.state,
      pincode: req.body.pincode,

      profile_image: req.files?.profile_image?.[0]?.path || "",
      signature_image: req.files?.signature_image?.[0]?.path || "",

      // ========== KYC ==========
      pf_no: req.body.pf_no,
      id_proof_name: req.body.id_proof_name,
      id_proof_no: req.body.id_proof_no,
      address_proof_name: req.body.address_proof_name,
      address_proof_no: req.body.address_proof_no,
      sign_proof_name: req.body.sign_proof_name,
      pan_no: req.body.pan_no, 

      doc1File: req.files?.doc1File?.[0]?.path || "",
      doc2File: req.files?.doc2File?.[0]?.path || "",

      // ========== BANK ==========
      bank_name: req.body.bank_name,
      branch_name: req.body.branch_name,
      account_number: req.body.account_number,
      category: req.body.category,
      ifsc_code: req.body.ifsc_code,
      micr_code: req.body.micr_code,

      // ========== NOMINEE ==========
      nominee_name: req.body.nominee_name,
      nominee_dob: req.body.nominee_dob,
      nominee_age: req.body.nominee_age,
      nominee_relation: req.body.nominee_relation,
      percentage_share: req.body.percentage_share,

      approval_status: "pending",
    });

    await data.save();

    res.status(201).json({
      success: true,
      message: "Full form submitted successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getApprovalPendingMembers = async (req, res) => {
  try {
    const members = await PersonalInformation.find({
      approval_status: "pending",
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await PersonalInformation.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,        // production এ true হবে (https)
    sameSite: "lax",      // login এর সময় যেটা use করেছিস সেটাই দিতে হবে
    path: "/",            // MUST match cookie path
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const sendForgotOtp = async (req, res) => {
  try {
    const { email } = req.body;

    let userType = null;

    const user = await User.findOne({ email });
    const admin = await AdminLogin.findOne({ email });

    if (!user && !admin) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    userType = user ? "user" : "admin";

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp,
      userType,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      
      success: false,
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const storedOtpData = otpStore[email];

    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    if (storedOtpData.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (storedOtpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    let updated = null;
    
const { userType } = storedOtpData;

if (userType === "user") {
  await User.findOneAndUpdate(
    { email },
    { password: hashedPassword }
  );
} else {
  await AdminLogin.findOneAndUpdate(
    { email },
    { password: hashedPassword }
  );
}

    delete otpStore[email];

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  submitMemberForm,
  getApprovalPendingMembers,
  getMemberById,
  logoutUser,
  sendForgotOtp,
  resetPassword
};