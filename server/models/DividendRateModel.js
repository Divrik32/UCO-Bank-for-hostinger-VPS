const mongoose = require("mongoose");

const dividendRateSchema = new mongoose.Schema(
  {
    dividendRate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DividendRate", dividendRateSchema);