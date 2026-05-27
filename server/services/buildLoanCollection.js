const officialEntryModel = require("../loanModels/officialEntryModel");

exports.buildLoanCollection = async () => {
  await officialEntryModel.aggregate([
    {
      $lookup: {
        from: "guaranteermemberdetails",
        let: {
          memberId: "$memberId",
          loanCode: "$loanCode"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$memberId", "$$memberId"] },
                  { $eq: ["$loanCode", "$$loanCode"] }
                ]
              }
            }
          }
        ],
        as: "Guaranteer Member Details"
      }
    },
    {
      $lookup: {
        from: "loanpaymentforemidetails",
        let: {
          memberId: "$memberId",
          loanCode: "$loanCode"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$memberId", "$$memberId"] },
                  { $eq: ["$loanCode", "$$loanCode"] }
                ]
              }
            }
          }
        ],
        as: "Loan Payment For EMI Details"
      }
    },
    {
      $lookup: {
        from: "loanadjustments",
        let: {
          memberId: "$memberId",
          loanCode: "$loanCode"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$memberId", "$$memberId"] },
                  { $eq: ["$loanCode", "$$loanCode"] }
                ]
              }
            }
          }
        ],
        as: "Loan Adjustment"
      }
    },
    {
      $project: {
        memberId: 1,
        loanCode: 1,
        "Official Entry": ["$$ROOT"],
        "Guaranteer Member Details": 1,
        "Loan Payment For EMI Details": 1,
        "Loan Adjustment": 1
      }
    },
    {
      $merge: {
        into: "loanCollection",
        on: ["memberId", "loanCode"],
        whenMatched: "replace",
        whenNotMatched: "insert"
      }
    }
  ]);
}


