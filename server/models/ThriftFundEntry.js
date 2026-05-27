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
      enum: ["Cash", "Cheque", "UPI", "Bank Transfer"],
      required: true,
    },

    transactionId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    chequeNumber: {
      type: String,
      default: null,
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

    receivedBy: {
      type: String,
      trim: true,
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