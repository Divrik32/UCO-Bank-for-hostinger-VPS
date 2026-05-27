const mongoose = require("mongoose");

const guaranteerMemberDetailsSchema = new mongoose.Schema(
  {    
    loanCode: {
      type: String,
      required: true,
      trim: true
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
    },
    employeePhoneNo: {
      type: String,
      required: true,
      trim: true,
    },
    memberName: {
      type: String,
      required: true,
      trim: true,
    },
    memberId: {
      type: String,
      required: true,
      trim: true,
    },
    memberPhoneNo: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "GuaranteerMemberDetails",
  guaranteerMemberDetailsSchema
);