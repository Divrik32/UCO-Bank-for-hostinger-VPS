const mongoose = require("mongoose");

const thriftFundEntrySchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      trim: true,
    },

    totalAmountReceived: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["Cheque", "Cash", "UPI", "Net Banking", "NEFT", "RTGS", "IMPS", "Bank Transfer", "Demand Draft"],
      required: true,
    },

    transactionId: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },

    chequeNumber: {
      type: String,
      default: null,
      trim: true,
    },

    particular: {
      type: String,
      required: true,
      default: "By Installement",
      trim: true,
    },

    yearlyInterestAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    availableBalance: {
      type: Number,
      default: 0,
    },

    remainingBalance: {
      type: Number,
      default: 0,
    },

    entryDate: {
      type: Date,
      default: Date.now,
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ThriftFundEntry",
  thriftFundEntrySchema
);