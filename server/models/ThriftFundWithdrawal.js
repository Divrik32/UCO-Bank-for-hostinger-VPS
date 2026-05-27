const mongoose = require("mongoose");

const thriftFundWithdrawalSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      trim: true,
    },

    withdrawalAmount: {
      type: Number,
      required: true,
      min: 1,
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
    
        availableBalance: {
      type: Number,
      default: 0,
    },

    remainingBalance: {
      type: Number,
      default: 0,
    },

    withdrawalDate: {
      type: Date,
      default: Date.now,
    },

    approvedBy: {
      type: String,
      trim: true,
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ThriftFundWithdrawal",
  thriftFundWithdrawalSchema
);