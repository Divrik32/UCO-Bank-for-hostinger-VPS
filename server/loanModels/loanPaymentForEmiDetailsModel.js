const mongoose = require("mongoose");

const loanPaymentForEmiDetailsSchema = new mongoose.Schema(
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
        'Amount given from Share A/C'
      ],
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LoanPaymentForEmiDetails",
  loanPaymentForEmiDetailsSchema
);