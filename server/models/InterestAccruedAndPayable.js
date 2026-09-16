const mongoose = require("mongoose");

const interestAccruedAndPayableSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      trim: true,
    },

    interestAccruedAndPayableCredit: {
      type: Number,
      default: 0,
      min: 0,
    },

    interestAccruedAndPayableDebit: {
      type: Number,
      default: 0,
      min: 0,
    },

    transactionDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InterestAccruedAndPayable",
  interestAccruedAndPayableSchema
);