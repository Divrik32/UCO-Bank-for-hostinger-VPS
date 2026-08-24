const mongoose = require("mongoose");

const loanAdjustmentSchema = new mongoose.Schema(
  {     
    memberId: {
      type: String,
      required: true,
      trim: true
    },

    loanCode: {
      type: String,
      required: true,
      trim: true
    },
    paymentMode: {
      type: String,
      required: true,
      enum: [
        'Amount given by Member', 
        'Amount given from thrift A/C',
        'Amount given from Share A/C',
        "Both",
      ],
    },
    // Member / Thrift / Share single-mode amount
    adjustmentAmount: {
      type: Number,
      min: 0,
    },

    // Used only when paymentMode === "Both"
    thriftAdjustmentAmount: {
      type: Number,
      min: 0,
    },

    shareAdjustmentAmount: {
      type: Number,
      min: 0,
    },
    chequeNumber: {
      type: String,
      trim: true,
      default: "",
    },
    transactionId: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LoanAdjustment", loanAdjustmentSchema);