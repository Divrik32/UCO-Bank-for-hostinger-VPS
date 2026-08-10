const mongoose = require("mongoose");

const creditShareSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      trim: true,
    },
    
    investmentAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    numberOfShares: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentMode: {
      type: String,
      enum: ["Cheque", "Cash", "UPI", "Net Banking", "NEFT", "RTGS", "IMPS", "Bank Transfer", "Demand Draft"],
      required: true,
      trim: true,
    },

    transactionId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CreditShare",
  creditShareSchema
);