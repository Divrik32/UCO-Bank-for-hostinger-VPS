const mongoose = require("mongoose");

const dividendPaymentSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      trim: true,
    },

    dividendPaidAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentDestination: {
      type: String,
      required: true,
      enum: [
        "Paid to Thrift Account",
        "Paid to Loan Account",
        "Paid to Members Account",
      ],
    },

    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DividendPayment",
  dividendPaymentSchema
);