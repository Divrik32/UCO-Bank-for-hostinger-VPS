const mongoose = require("mongoose");

const officialEntrySchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      trim: true
    },

    loanCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    officeName: {
      type: String,
      required: true,
      trim: true
    },

    loanType: {
      type: String,
      required: true,
      enum: [
        "Housing",
        "Personal",
        "Vehicle",
        "Education",
        "Business",
        "Gold"
      ],
      trim: true
    },

    loanAmount: {
      type: Number,
      required: true,
      min: 0
    },

    tenureMonths: {
      type: Number,
      required: true,
      enum: [84, 96, 108, 120, 132, 144, 156, 168, 180]
    },

    emiAmount: {
      type: Number,
      required: true,
      min: 0
    },

    processingFees: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("OfficialEntry", officialEntrySchema);