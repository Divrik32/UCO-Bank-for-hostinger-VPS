const mongoose = require("mongoose");

const interestRateSchema = new mongoose.Schema(
  {
    rate: {
      type: Number,
      required: true,
      default: 7, // 7%
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
  "InterestRate",
  interestRateSchema
);