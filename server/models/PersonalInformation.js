const mongoose = require("mongoose");

const personalInformationSchema = new mongoose.Schema(
  {
    // ================= PERSONAL INFO =================
    firstname: {
      type: String,
      required: true,
      trim: true,
    },

    lastname: {
      type: String,
      required: true,
      trim: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    age: {
      type: Number,
      required: true,
      min: 18,
    },

    // form_no: {
    //   type: Number,
    //   required: true,
    // },

    gender: {
      type: String,
      enum: ["Male", "Female", "Transgender"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Married", "Unmarried"],
      required: true,
    },

    guardian_firstname: {
      type: String,
      required: true,
      trim: true,
    },

    guardian_relation: {
      type: String,
      enum: ["Father", "Mother", "Spouse"],
      required: true,
    },

    phoneno: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    address_line1: {
      type: String,
      required: true,
      trim: true,
    },

    address_line2: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      maxlength: 6,
    },

    profile_image: {
      type: String,
      required: true,
    },

    signature_image: {
      type: String,
      required: true,
    },

    // ================= KYC INFO =================
    pf_no: {
      type: Number,
      required: true,
    },

    id_proof_name: {
      type: String,
      enum: [
        "Aadhar Card",
        "Driving Licence",
        "Electricity Bill",
        "Passport",
        "Pan Card",
        "Voter ID Card",
      ],
      required: true,
    },

    id_proof_no: {
      type: String,
      required: true,
    },

    address_proof_name: {
      type: String,
      enum: [
        "Aadhar Card",
        "Driving Licence",
        "Electricity Bill",
        "Passport",
        "Pan Card",
      ],
      // required: true,
    },

    address_proof_no: {
      type: String,
      // required: true,
    },

    sign_proof_name: {
      type: String,
      enum: ["Passport", "Pan Card"],
      required: true,
    },

    pan_no: {
      type: String,
      required: true,
      trim: true,
    },

    doc1File: {
      type: String,
      required: true,
    },

    doc2File: {
      type: String,
      required: true,
    },

    approval_status: {
      type: String,
      enum: ["pending", "approved"],
      required: true,
    },

    // ================= BANK INFO =================
    bank_name: {
      type: String,
      enum: [
        "Axis Bank",
        "Bank Of Baroda",
        "Bank Of India",
        "Canara Bank",
        "Central Bank Of India",
        "HDFC",
        "Kotak Mahindra Bank",
        "Punjab National Bank",
        "State Bank Of India",
        "Union Bank Of India",
      ],
      required: true,
    },

branch_name: {   // ❗ fix (was branchName)
  type: String,
  required: true,
  trim: true,
},

account_number: {  // ❗ fix (was accountno)
  type: String,
  required: true,
  trim: true,
},



    category: {
      type: String,
      enum: [
        "Current Account",
        "Saving Account",
        "Salary Account",
      ],
      required: true,
    },

    ifsc_code: {
      type: String,
      required: true,
      trim: true,
    },

    micr_code: {
      type: String,
      required: true,
      trim: true,
    },

    // ================= NOMINEE INFO =================
nominee_name: {   // ❗ fix mapping
  type: String,
  required: true,
},

    nominee_dob: {
      type: Date,
      required: true,
    },

    nominee_age: {
      type: Number,
      required: true,
    },

    nominee_relation: {
      type: String,
      enum: ["Father", "Mother", "Spouse"],
      required: true,
    },

    percentage_share: {
      type: Number,
      required: true,
    },

    // ======= member id =======
    memberId: {
     type: String,
     unique: true,
    },
  },
  {
    timestamps: true,
  }
);

personalInformationSchema.pre("save", async function () {
  if (!this.isNew) return;

  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const prefix = `${year}${month}`;

  const lastMember = await mongoose
    .model("PersonalInformation")
    .findOne({
      memberId: new RegExp(`^${prefix}`),
    })
    .sort({ memberId: -1 });

  let serial = 1;

  if (lastMember) {
    const lastSerial = parseInt(lastMember.memberId.slice(-4));
    serial = lastSerial + 1;
  }

  this.memberId = `${prefix}${String(serial).padStart(4, "0")}`;
});

module.exports = mongoose.model(
  "PersonalInformation",
  personalInformationSchema
);