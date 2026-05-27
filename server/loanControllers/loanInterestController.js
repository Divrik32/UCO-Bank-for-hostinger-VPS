const LoanInterest = require("../loanModels/loanInterest");

// 👉 GET current interest
exports.getLoanInterest = async (req, res) => {
  try {
    let interest = await LoanInterest.findOne();

    // jodi DB te na thake, default create kore debo
    if (!interest) {
      interest = await LoanInterest.create({
        rate: 10.5,
        updatedBy: "system",
        remarks: "Default interest rate",
      });
    }

    res.status(200).json({
      success: true,
      data: interest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan interest",
      error: error.message,
    });
  }
};

// 👉 UPDATE interest
exports.updateLoanInterest = async (req, res) => {
  try {
    const { rate, updatedBy, remarks } = req.body;

    if (rate == null) {
      return res.status(400).json({
        success: false,
        message: "Rate is required",
      });
    }

    let interest = await LoanInterest.findOne();

    // jodi na thake, create kore update dhore nebo
    if (!interest) {
      interest = await LoanInterest.create({
        rate,
        updatedBy,
        remarks,
      });
    } else {
      interest.rate = rate;
      if (updatedBy) interest.updatedBy = updatedBy;
      if (remarks) interest.remarks = remarks;

      await interest.save();
    }

    res.status(200).json({
      success: true,
      message: "Loan interest updated successfully",
      data: interest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update loan interest",
      error: error.message,
    });
  }
};