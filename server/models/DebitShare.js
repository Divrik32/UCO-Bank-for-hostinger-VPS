const mongoose = require("mongoose");

const debitShareSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMode: {
      type: String,
      enum: ["Cheque", "Cash", "UPI", "Net Banking", "NEFT", "RTGS", "IMPS", "Bank Transfer", "Demand Draft"],
      required: true,
      trim: true,
    },

    chequeNumber: {
      type: String,
      trim: true,
    },

    transactionId: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },

transferShareTo: {
  type: String,
  enum: ["Members Loan Account", "Members Account"],
  trim: true,
  required: true,
},

    debitDate: {
      type: Date,
      default: Date.now,
    },

    // shareCertificateNumber: {
    //   type: String,
    //   trim: true,
    //   required: true,
    // },
        bookNo: {
      type: String,
      trim: true,
    },

    certificateNo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DebitShare",
  debitShareSchema
);