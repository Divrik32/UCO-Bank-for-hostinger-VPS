const User = require("../models/User.js");
const PersonalInformation = require("../models/PersonalInformation.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminLogin = require("../models/AdminLogin.js");
const nodemailer = require("nodemailer");
const { getMemberTotalLoan, getMemberShareBalance, getMemberThriftBalance} = require("../helpers/memberFinancialHelper.js");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

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
console.log(admin);


if (admin) {
  const isAdminMatch = password === admin.password;

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
      membershipNumber: req.body.membershipNumber,
      branch: req.body.branch,
      date_of_joining: req.body.date_of_joining,
      date_of_retirement: req.body.date_of_retirement,
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
    // ==========================================
    // 1. Get All Pending Members
    // ==========================================
    const members = await PersonalInformation.find({}).sort({
      createdAt: -1,
    });

    // ==========================================
    // 2. Get Financial Details For Each Member
    // ==========================================
    const membersWithFinancialDetails = await Promise.all(
      members.map(async (member) => {
        const memberId = member.memberId;

        const [
          totalLoan,
          shareBalance,
          thriftBalance,
        ] = await Promise.all([
          getMemberTotalLoan(memberId),
          getMemberShareBalance(memberId),
          getMemberThriftBalance(memberId),
        ]);

        return {
          ...member.toObject(),

          totalLoan,
          shareBalance,
          thriftBalance,
        };
      })
    );

    // ==========================================
    // 3. Response
    // ==========================================
    return res.status(200).json({
      success: true,
      count: membersWithFinancialDetails.length,
      data: membersWithFinancialDetails,
    });
  } catch (error) {
    console.error(
      "Get approval pending members error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getApprovedMembers = async (req, res) => {
  try {
    const members = await PersonalInformation.find({
      approval_status: "approved",
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

// ================= GET MEMBER BY MEMBERSHIP NUMBER =================

const getMemberByMembershipNumber = async (req, res) => {
  try {
    const { membershipNumber } = req.params;

    if (!membershipNumber) {
      return res.status(400).json({
        success: false,
        message: "Membership number is required",
      });
    }

    const member = await PersonalInformation.findOne({
      membershipNumber: membershipNumber.trim(),
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found with this membership number",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member found successfully",
      data: member,
    });
  } catch (error) {
    console.error("Get member by membership number error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const approveMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await PersonalInformation.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (member.approval_status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Member already approved",
      });
    }

    member.approval_status = "approved";

    await member.save();

    res.status(200).json({
      success: true,
      message: "Member approved successfully",
      data: member,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
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

    const { userType } = storedOtpData;

    if (userType === "user") {
      // User password → bcrypt
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.findOneAndUpdate(
        { email },
        { password: hashedPassword }
      );

    } else {
      // Admin password → plain text
      await AdminLogin.findOneAndUpdate(
        { email },
        { password: newPassword }
      );
    }

    // OTP একবার ব্যবহার হওয়ার পর delete
    delete otpStore[email];

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const imageToDataUri = (filePath) => {
  try {
    if (!filePath) return null;

    // Windows path -> Linux compatible path
    const normalizedPath = filePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    const absolutePath = path.resolve(
      process.cwd(),
      normalizedPath
    );

    if (!fs.existsSync(absolutePath)) {
      console.log(
        "Image not found:",
        absolutePath
      );

      return null;
    }

    const extension = path
      .extname(absolutePath)
      .toLowerCase();

    let mimeType = "image/jpeg";

    if (extension === ".png") {
      mimeType = "image/png";
    } else if (extension === ".webp") {
      mimeType = "image/webp";
    } else if (extension === ".gif") {
      mimeType = "image/gif";
    } else if (extension === ".jpg" || extension === ".jpeg") {
      mimeType = "image/jpeg";
    }

    const imageBuffer =
      fs.readFileSync(absolutePath);

    return `data:${mimeType};base64,${imageBuffer.toString(
      "base64"
    )}`;
  } catch (error) {
    console.error(
      "Image conversion error:",
      error
    );

    return null;
  }
};

const printMemberDetails = async (req, res) => {
  let browser;

  try {
    const { id } = req.params;

    const member = await PersonalInformation.findById(id).lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // ==========================================
    // Convert Images to Base64
    // ==========================================

    const profileImage = imageToDataUri(
      member.profile_image
    );

    const signatureImage = imageToDataUri(
      member.signature_image
    );

    const document1Image = imageToDataUri(
      member.doc1File
    );

    const document2Image = imageToDataUri(
      member.doc2File
    );

    // ==========================================
    // Helper
    // ==========================================

    const value = (val) => {
      if (
        val === null ||
        val === undefined ||
        val === ""
      ) {
        return "—";
      }

      return String(val);
    };

    const formatDate = (date) => {
      if (!date) return "—";

      const parsed = new Date(date);

      if (isNaN(parsed.getTime())) {
        return value(date);
      }

      const day = String(
        parsed.getDate()
      ).padStart(2, "0");

      const month = String(
        parsed.getMonth() + 1
      ).padStart(2, "0");

      const year =
        parsed.getFullYear();

      return `${day}-${month}-${year}`;
    };

    // ==========================================
    // Image HTML
    // ==========================================

    const imageBox = (
      image,
      title,
      small = false
    ) => {
      if (!image) {
        return `
          <div class="image-box placeholder">
            <span>${title}</span>
          </div>
        `;
      }

      return `
        <div class="image-box ${small ? "small" : ""}">
          <img
            src="${image}"
            alt="${title}"
          />
        </div>
      `;
    };

    // ==========================================
    // HTML
    // ==========================================

    const html = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8" />

<title>Member Details - ${value(
      member.memberId
    )}</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 25px;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  color: #222;

  background: #ffffff;

  font-size: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  border-bottom: 2px solid #012970;

  padding-bottom: 12px;
  margin-bottom: 18px;
}

.company-name {
  font-size: 20px;
  font-weight: 700;
  color: #012970;
}

.company-address {
  margin-top: 5px;
  color: #555;
  line-height: 1.5;
}

.report-title {
  text-align: right;
}

.report-title h1 {
  margin: 0;

  color: #012970;

  font-size: 19px;
}

.report-title p {
  margin: 5px 0 0;

  color: #555;
}

.card {
  border: 1px solid #ddd;

  border-radius: 7px;

  margin-bottom: 16px;

  overflow: hidden;

  page-break-inside: avoid;
}

.card-title {
  background: #f3f6fa;

  color: #012970;

  font-size: 15px;

  font-weight: 700;

  padding: 9px 12px;

  border-bottom: 1px solid #ddd;
}

.details {
  padding: 0 12px;
}

.row {
  display: flex;

  min-height: 29px;

  border-bottom: 1px solid #eeeeee;

  align-items: center;
}

.row:last-child {
  border-bottom: none;
}

.label {
  width: 190px;

  flex-shrink: 0;

  font-weight: 600;

  color: #555;
}

.value {
  color: #222;

  word-break: break-word;
}

.two-column {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 14px;

  align-items: start;
}

.image-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 12px;

  padding: 12px;
}

.image-box {
  height: 150px;

  border: 1px solid #ddd;

  border-radius: 6px;

  display: flex;

  align-items: center;

  justify-content: center;

  overflow: hidden;

  background: #fff;
}

.image-box.small {
  height: 80px;
}

.image-box img {
  max-width: 100%;
  max-height: 100%;

  object-fit: contain;
}

.placeholder {
  color: #aaa;

  font-size: 11px;
}

.member-id {
  background: #eef4ff;

  color: #012970;

  padding: 4px 9px;

  border-radius: 4px;

  font-weight: 700;
}

.footer {
  margin-top: 25px;

  padding-top: 10px;

  border-top: 1px solid #ddd;

  display: flex;

  justify-content: space-between;

  color: #666;

  font-size: 10px;
}

@page {
  size: A4;

  margin: 12mm;
}

@media print {

  body {
    padding: 0;
  }

}

</style>

</head>

<body>

<!-- ==========================================
     HEADER
========================================== -->

<div class="header">

  <div>

    <div class="company-name">
      BSUCB Cooperative
    </div>

    <div class="company-address">
      Regd. 203, Hari Om Commercial Complex<br/>
      New Dak Bunglow Road, Patna-800001
    </div>

  </div>

  <div class="report-title">

    <h1>
      Member Details
    </h1>

    <p>
      Member Code:
      <span class="member-id">
        ${value(member.memberId)}
      </span>
    </p>

  </div>

</div>


<!-- ==========================================
     MEMBER DETAILS + KYC
========================================== -->

<div class="two-column">

<!-- LEFT -->

<div>

  <div class="card">

    <div class="card-title">
      Member Details
    </div>

    <div class="details">

      <div class="row">
        <div class="label">Member Name</div>
        <div class="value">
          ${value(member.firstname)}
        </div>
      </div>

      <div class="row">
        <div class="label">Last Name</div>
        <div class="value">
          ${value(member.lastname)}
        </div>
      </div>

      <div class="row">
        <div class="label">Member D.O.B</div>
        <div class="value">
          ${formatDate(member.dob)}
        </div>
      </div>

      <div class="row"> 
        <div class="label">Membership Number</div> 
        <div class="value"> 
          ${value(member.membershipNumber)} 
        </div> 
      </div>

      <div class="row">
        <div class="label">Age</div>
        <div class="value">
          ${value(member.age)}
        </div>
      </div>
      <div class="row">
  <div class="label">Date of Joining</div>
  <div class="value">
    ${formatDate(member.date_of_joining)}
  </div>
</div>

<div class="row">
  <div class="label">Date of Retirement</div>
  <div class="value">
    ${formatDate(member.date_of_retirement)}
  </div>
</div>

      <div class="row">
        <div class="label">Gender</div>
        <div class="value">
          ${value(member.gender)}
        </div>
      </div>

      <div class="row">
        <div class="label">Status</div>
        <div class="value">
          ${value(member.status)}
        </div>
      </div>

      <div class="row">
        <div class="label">Guardian Name</div>
        <div class="value">
          ${value(member.guardian_firstname)}
        </div>
      </div>

      <div class="row">
        <div class="label">Guardian Relation</div>
        <div class="value">
          ${value(member.guardian_relation)}
        </div>
      </div>

      <div class="row">
        <div class="label">Phone</div>
        <div class="value">
          ${value(member.phoneno)}
        </div>
      </div>

      <div class="row">
        <div class="label">Email Id</div>
        <div class="value">
          ${value(member.email)}
        </div>
      </div>

      <div class="row">
        <div class="label">House/Flat No.</div>
        <div class="value">
          ${value(member.address_line1)}
        </div>
      </div>

      <div class="row">
        <div class="label">Street No./Area</div>
        <div class="value">
          ${value(member.address_line2)}
        </div>
      </div>

      <div class="row">
        <div class="label">State</div>
        <div class="value">
          ${value(member.state)}
        </div>
      </div>

      <div class="row">
        <div class="label">Pincode</div>
        <div class="value">
          ${value(member.pincode)}
        </div>
      </div>

    </div>

    <div class="image-grid">

      ${imageBox(
        profileImage,
        "Profile Photo"
      )}

      ${imageBox(
        signatureImage,
        "Signature",
        true
      )}

    </div>

  </div>


  <!-- BANKING -->

  <div class="card">

    <div class="card-title">
      Member Banking Information
    </div>

    <div class="details">

      <div class="row">
        <div class="label">Bank Name</div>
        <div class="value">
          ${value(member.bank_name)}
        </div>
      </div>

      <div class="row">
        <div class="label">Branch Name</div>
        <div class="value">
          ${value(member.branch_name)}
        </div>
      </div>

      <div class="row">
        <div class="label">Account No.</div>
        <div class="value">
          ${value(member.account_number)}
        </div>
      </div>

      <div class="row">
        <div class="label">Category</div>
        <div class="value">
          ${value(member.category)}
        </div>
      </div>

      <div class="row">
        <div class="label">IFSC Code</div>
        <div class="value">
          ${value(member.ifsc_code)}
        </div>
      </div>

      <div class="row">
        <div class="label">MICR Code</div>
        <div class="value">
          ${value(member.micr_code)}
        </div>
      </div>

    </div>

  </div>

</div>


<!-- RIGHT -->

<div>

  <!-- KYC -->

  <div class="card">

    <div class="card-title">
      KYC Details
    </div>

    <div class="details">

      <div class="row">
        <div class="label">PF No</div>
        <div class="value">
          ${value(member.pf_no)}
        </div>
      </div>

      <div class="row">
        <div class="label">ID Proof Name</div>
        <div class="value">
          ${value(member.id_proof_name)}
        </div>
      </div>

      <div class="row">
        <div class="label">ID Proof No</div>
        <div class="value">
          ${value(member.id_proof_no)}
        </div>
      </div>

      <div class="row">
        <div class="label">Address Proof</div>
        <div class="value">
          ${value(member.address_proof_name)}
        </div>
      </div>

      <div class="row">
        <div class="label">Address Proof No</div>
        <div class="value">
          ${value(member.address_proof_no)}
        </div>
      </div>

      <div class="row">
        <div class="label">Sign. Proof Name</div>
        <div class="value">
          ${value(member.sign_proof_name)}
        </div>
      </div>

      <div class="row">
        <div class="label">PAN Card No</div>
        <div class="value">
          ${value(member.pan_no)}
        </div>
      </div>

    </div>

    <div class="image-grid">

      ${imageBox(
        document1Image,
        "KYC Document 1"
      )}

      ${imageBox(
        document2Image,
        "KYC Document 2"
      )}

    </div>

  </div>


  <!-- NOMINEE -->

  <div class="card">

    <div class="card-title">
      Nominee Details
    </div>

    <div class="details">

      <div class="row">
        <div class="label">Nominee Name</div>
        <div class="value">
          ${value(member.nominee_name)}
        </div>
      </div>

      <div class="row">
        <div class="label">D.O.B</div>
        <div class="value">
          ${formatDate(member.nominee_dob)}
        </div>
      </div>

      <div class="row">
        <div class="label">Age</div>
        <div class="value">
          ${value(member.nominee_age)}
        </div>
      </div>

      <div class="row">
        <div class="label">Relation</div>
        <div class="value">
          ${value(member.nominee_relation)}
        </div>
      </div>

      <div class="row">
        <div class="label">Per. Of Share</div>
        <div class="value">
          ${
            member.percentage_share !==
              undefined &&
            member.percentage_share !==
              null &&
            member.percentage_share !== ""
              ? `${member.percentage_share}%`
              : "—"
          }
        </div>
      </div>

    </div>

  </div>

</div>

</div>


<!-- ==========================================
     FOOTER
========================================== -->

<div class="footer">

  <span>
    Member Code: ${value(member.memberId)}
  </span>

  <span>
    Generated on:
    ${formatDate(new Date())}
  </span>

</div>

</body>
</html>
`;

    // ==========================================
    // Puppeteer
    // ==========================================

    browser = await puppeteer.launch({
      headless: "new",

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",

      printBackground: true,

      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
    });

    await browser.close();
    browser = null;

    // ==========================================
    // Response
    // ==========================================

    res.set({
      "Content-Type": "application/pdf",

      "Content-Disposition":
        `inline; filename="member-${member.memberId || id}.pdf"`,

      "Content-Length":
        pdfBuffer.length,
    });

    return res.send(pdfBuffer);

  } catch (error) {

    console.error(
      "Member PDF Error:",
      error
    );

    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate member PDF",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

const memberApprovalPDF = async (req, res) => {
  let browser;

  try {
    // ==========================================
    // 1. Get Members
    // ==========================================

    const { members } = req.body;

    if (!Array.isArray(members)) {
      return res.status(400).json({
        success: false,
        message: "Members data is required",
      });
    }

    // ==========================================
    // 2. Generate Table HTML
    // ==========================================

    const rows = members
      .map((member, index) => {

        const memberName =
          `${member.firstname || ""} ${
            member.lastname || ""
          }`.trim();

        return `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${member.memberId || "-"}
            </td>

            <td>
              ${member.membershipNumber || "-"}
            </td>

            <td>
              ${memberName || "-"}
            </td>

            <td>
              ${member.phoneno || "-"}
            </td>

            <td>
              ${member.email || "-"}
            </td>

            <td>
              ₹${Number(
                member.totalLoan || 0
              ).toLocaleString("en-IN")}
            </td>

            <td>
              ₹${Number(
                member.shareBalance || 0
              ).toLocaleString("en-IN")}
            </td>

            <td>
              ₹${Number(
                member.thriftBalance || 0
              ).toLocaleString("en-IN")}
            </td>

          </tr>
        `;
      })
      .join("");


    // ==========================================
    // 3. Full HTML
    // ==========================================

    const html = `

      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <title>
          Member Approval Report
        </title>

        <style>

          body {

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            margin: 0;

            padding: 20px;

            color: #333;

          }


          .header {

            text-align: center;

            margin-bottom: 20px;

          }


          .title {

            font-size: 22px;

            font-weight: 700;

            color: #012970;

            margin-bottom: 8px;

          }


          .address {

            font-size: 13px;

            line-height: 1.5;

          }


          .report-info {

            margin-top: 10px;

            font-size: 11px;

            color: #666;

          }


          table {

            width: 100%;

            border-collapse: collapse;

            font-size: 10px;

          }


          th,
          td {

            border:
              1px solid #dee2e6;

            padding: 7px 5px;

            text-align: center;

            vertical-align: middle;

          }


          th {

            background: #f8f9fa;

            font-weight: 600;

          }


          tr:nth-child(even) {

            background: #fafafa;

          }


          @page {

            size: A4 landscape;

            margin: 12mm;

          }


        </style>

      </head>


      <body>


        <div class="header">

          <div class="title">
            Member Approval Report
          </div>


          <div class="address">

            <strong>
              Regd. 203, Hari Om Commercial Complex
            </strong>

            <br />

            New Dak Bunglow Road,
            Patna-800001

          </div>


          <div class="report-info">

            Total Members:
            <strong>
              ${members.length}
            </strong>

            &nbsp;&nbsp; | &nbsp;&nbsp;

            Generated:
            ${new Date().toLocaleString("en-IN")}

          </div>

        </div>


        <table>

          <thead>

            <tr>

              <th>
                Sl.
              </th>

              <th>
                Member ID
              </th>

              <th>
                Membership Number
              </th>

              <th>
                Member Name
              </th>

              <th>
                Contact Number
              </th>

              <th>
                Email
              </th>

              <th>
                Total Loan
              </th>

              <th>
                Share Balance
              </th>

              <th>
                Thrift Balance
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              rows ||
              `
                <tr>

                  <td colspan="9">
                    No members found.
                  </td>

                </tr>
              `
            }

          </tbody>

        </table>


      </body>

      </html>

    `;


    // ==========================================
    // 4. Launch Puppeteer
    // ==========================================

    browser = await puppeteer.launch({

      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],

    });


    const page =
      await browser.newPage();


    // ==========================================
    // 5. Load HTML
    // ==========================================

    await page.setContent(
      html,
      {
        waitUntil: "networkidle0",
      }
    );


    // ==========================================
    // 6. Generate PDF
    // ==========================================

    const pdf =
      await page.pdf({

        format: "A4",

        landscape: true,

        printBackground: true,

        margin: {

          top: "12mm",

          right: "12mm",

          bottom: "12mm",

          left: "12mm",

        },

      });


    // ==========================================
    // 7. Send PDF
    // ==========================================

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );


    res.setHeader(
      "Content-Disposition",
      'inline; filename="member-approval-report.pdf"'
    );


    res.end(pdf);


  } catch (error) {

    console.error(
      "Member approval PDF error:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        "Failed to generate member approval PDF",

      error: error.message,

    });


  } finally {

    if (browser) {

      await browser.close();

    }

  }
};

const getNomineeRelations = async (req, res) => {
  try {
    const nomineeRelations =
      PersonalInformation.schema
        .path("nominee_relation")
        .enumValues;

    res.status(200).json({
      success: true,
      data: nomineeRelations,
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
  getApprovedMembers,
  getMemberById,
  getMemberByMembershipNumber,
  approveMember,
  logoutUser,
  sendForgotOtp,
  resetPassword,
  printMemberDetails,
  memberApprovalPDF,
  getNomineeRelations
};