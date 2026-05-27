const InterestRate = require("../models/InterestRate.js");

const updateInterestRate = async (req, res) => {
  try {
    const { rate, updatedBy, remarks } = req.body;

    let existingRate = await InterestRate.findOne();

    if (existingRate) {
      existingRate.rate = rate;
      existingRate.updatedBy = updatedBy;
      existingRate.remarks = remarks;

      await existingRate.save();
    } else {
      existingRate = await InterestRate.create({
        rate,
        updatedBy,
        remarks,
      });
    }

    res.status(200).json({
      success: true,
      message: "Interest rate updated successfully",
      data: existingRate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getInterestRate = async (req, res) => {
  try {
    let rateData = await InterestRate.findOne().sort({
      createdAt: -1,
    });

    if (!rateData) {
      rateData = { rate: 7 };
    }

    res.status(200).json({
      success: true,
      data: rateData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  updateInterestRate,
  getInterestRate,
};

