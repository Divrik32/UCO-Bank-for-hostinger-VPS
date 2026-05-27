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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CreditShare",
  creditShareSchema
);