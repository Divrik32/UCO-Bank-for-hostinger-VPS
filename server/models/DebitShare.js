const mongoose = require("mongoose");

const debitShareSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMode: {
      type: String,
      required: true,
      trim: true,
    },

    chequeNumber: {
      type: String,
      trim: true,
    },

    transactionId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    transferShareTo: {
      type: String,
      trim: true,
      required: true,
    },

    shareCertificateNumber: {
      type: String,
      trim: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DebitShare",
  debitShareSchema
);