const mongoose = require("mongoose");

const loanInterestSchema = new mongoose.Schema(
  {
    rate: {
      type: Number,
      required: true,
      default: 12,
      min: 0,
    },

    updatedBy: {
      type: String,
      trim: true,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LoanInterest",
  loanInterestSchema
);